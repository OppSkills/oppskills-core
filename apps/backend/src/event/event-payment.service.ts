import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  prisma,
  EventPaymentStatus,
  EventPaymentOrderStatus,
} from '@oppskills/db';
import { RazorpayService } from '../payments/razorpay.service';
import { Decimal } from '@prisma/client/runtime/library';
import { EventEmitter2 } from '@nestjs/event-emitter';

const PLATFORM_FEE_PERCENT = 2;

@Injectable()
export class EventPaymentService {
  private readonly logger = new Logger(EventPaymentService.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a payment order for event registration.
   * Returns zero-amount response if user is from a free college or event is free.
   */
  async createPaymentOrder(params: {
    eventSlug: string;
    userId: string;
    discountCode?: string;
  }) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: params.eventSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        isFree: true,
        freeCollegeIds: true,
        entryFeeAmount: true,
        currency: true,
        registrationDeadline: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        ownerId: true,
        maxUsers: true,
        registrationCount: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isFree) {
      throw new BadRequestException(
        'This event is free, no payment required',
      );
    }

    if (!event.entryFeeAmount) {
      throw new BadRequestException('Entry fee not configured');
    }

    if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
      throw new BadRequestException('Registration is not open');
    }

    if (event.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Event is not approved');
    }

    if (event.isRegistrationPaused) {
      throw new BadRequestException('Registration is paused');
    }

    if (
      event.registrationDeadline &&
      new Date() > event.registrationDeadline
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (
      event.maxUsers !== null &&
      event.registrationCount >= event.maxUsers
    ) {
      throw new BadRequestException('Event is at full capacity');
    }

    // Check if user already registered
    const existingParticipant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: params.userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('You are already registered for this event');
    }

    // Check for existing payment - allow retry if previous payment was cancelled/failed
    const existingPayment = await prisma.eventPaymentEntity.findFirst({
      where: {
        eventId: event.id,
        payerUserId: params.userId,
      },
    });

    if (existingPayment) {
      if (
        existingPayment.paymentStatus === EventPaymentStatus.CAPTURED ||
        existingPayment.paymentStatus === EventPaymentStatus.AUTHORIZED
      ) {
        throw new BadRequestException('Payment already completed');
      }
      // If payment exists with CREATED/FAILED status, we'll update it instead of creating new one
    }

    // Check if user is eligible for free entry (college-based)
    const isEligibleForFreeEntry = await this.checkFreeCollegeEligibility(
      event.freeCollegeIds,
      params.userId,
    );

    if (isEligibleForFreeEntry) {
      // Create or update payment record for free college entry
      let payment;
      if (existingPayment) {
        payment = await prisma.eventPaymentEntity.update({
          where: { id: existingPayment.id },
          data: {
            razorpayOrderId: `free_college_event_${event.id}_${Date.now()}`,
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: EventPaymentOrderStatus.PAID,
            paymentStatus: EventPaymentStatus.CAPTURED,
            discountCodeId: null,
            discountAmount: null,
            razorpayPaymentId: null,
            razorpaySignature: null,
            capturedAt: new Date(),
          },
        });
      } else {
        payment = await prisma.eventPaymentEntity.create({
          data: {
            eventId: event.id,
            organizerId: event.ownerId,
            payerUserId: params.userId,
            currency: event.currency || 'INR',
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            razorpayOrderId: `free_college_event_${event.id}_${Date.now()}`,
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: EventPaymentOrderStatus.PAID,
            paymentStatus: EventPaymentStatus.CAPTURED,
            discountCodeId: null,
            discountAmount: null,
            capturedAt: new Date(),
          },
        });
      }

      return {
        paymentId: payment.id,
        razorpayKey: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: event.currency || 'INR',
        eventName: event.name,
        eventSlug: event.slug,
        originalAmount: Number(event.entryFeeAmount),
        finalAmount: 0,
        zeroAmountPayment: true,
        isCollegeFree: true,
      };
    }

    let grossAmount = new Decimal(event.entryFeeAmount);
    let discountAmount = new Decimal(0);
    let discountCodeId: string | null = null;

    // Apply discount code if provided
    if (params.discountCode) {
      const discount = await this.applyDiscountCode(
        event.id,
        params.userId,
        params.discountCode,
        grossAmount,
      );
      discountAmount = discount.discountAmount;
      discountCodeId = discount.discountCodeId;
      grossAmount = grossAmount.minus(discountAmount);

      if (grossAmount.lessThanOrEqualTo(0)) {
        grossAmount = new Decimal(0);
      }
    }

    // Calculate fees
    const platformFeeAmount = grossAmount
      .times(PLATFORM_FEE_PERCENT)
      .dividedBy(100)
      .toDecimalPlaces(2);

    // Add 18% GST on the platform fee
    const platformFeeGstAmount = platformFeeAmount
      .times(18)
      .dividedBy(100)
      .toDecimalPlaces(2);

    const totalDeduction = platformFeeAmount.plus(platformFeeGstAmount);
    const organizerShareAmount = grossAmount.minus(totalDeduction);
    const grossAmountPaise = grossAmount.times(100).toNumber();

    // Handle zero amount after discount
    if (grossAmountPaise === 0) {
      let payment;
      if (existingPayment) {
        payment = await prisma.eventPaymentEntity.update({
          where: { id: existingPayment.id },
          data: {
            razorpayOrderId: `free_event_${event.id}_${Date.now()}`,
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: EventPaymentOrderStatus.PAID,
            paymentStatus: EventPaymentStatus.CAPTURED,
            discountCodeId,
            discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
            razorpayPaymentId: null,
            razorpaySignature: null,
            capturedAt: new Date(),
          },
        });
      } else {
        payment = await prisma.eventPaymentEntity.create({
          data: {
            eventId: event.id,
            organizerId: event.ownerId,
            payerUserId: params.userId,
            currency: event.currency || 'INR',
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            razorpayOrderId: `free_event_${event.id}_${Date.now()}`,
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: EventPaymentOrderStatus.PAID,
            paymentStatus: EventPaymentStatus.CAPTURED,
            discountCodeId,
            discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
            capturedAt: new Date(),
          },
        });
      }

      return {
        paymentId: payment.id,
        razorpayKey: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: event.currency || 'INR',
        eventName: event.name,
        eventSlug: event.slug,
        originalAmount: Number(event.entryFeeAmount),
        finalAmount: 0,
        discountAmount: Number(discountAmount),
        zeroAmountPayment: true,
        isCollegeFree: false,
      };
    }

    // Create Razorpay order
    const orderNotes: Record<string, string> = {
      eventId: event.id,
      eventSlug: event.slug,
      payerUserId: params.userId,
      type: 'event_registration',
    };

    const razorpayOrder = await this.razorpayService.createOrder({
      amountPaise: grossAmountPaise,
      currency: event.currency || 'INR',
      receipt: `evt_${event.id.slice(-8)}_${Date.now()}`,
      notes: orderNotes,
    });

    // Create or update payment record
    let payment;
    if (existingPayment) {
      payment = await prisma.eventPaymentEntity.update({
        where: { id: existingPayment.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          grossAmount,
          platformFeeAmount: totalDeduction,
          organizerShareAmount,
          orderStatus: EventPaymentOrderStatus.CREATED,
          paymentStatus: EventPaymentStatus.CREATED,
          discountCodeId,
          discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
          razorpayPaymentId: null,
          razorpaySignature: null,
          failedAt: null,
        },
      });
    } else {
      payment = await prisma.eventPaymentEntity.create({
        data: {
          eventId: event.id,
          organizerId: event.ownerId,
          payerUserId: params.userId,
          currency: event.currency || 'INR',
          grossAmount,
          platformFeeAmount: totalDeduction,
          organizerShareAmount,
          razorpayOrderId: razorpayOrder.id,
          transferOnHold: false,
          transferOnHoldUntil: null,
          orderStatus: EventPaymentOrderStatus.CREATED,
          paymentStatus: EventPaymentStatus.CREATED,
          discountCodeId,
          discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
        },
      });
    }

    return {
      paymentId: payment.id,
      razorpayKey: this.razorpayService.getKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amountPaise: grossAmountPaise,
      currency: event.currency || 'INR',
      eventName: event.name,
      eventSlug: event.slug,
      originalAmount: Number(event.entryFeeAmount),
      finalAmount: Number(grossAmount),
      discountAmount: discountAmount.greaterThan(0) ? Number(discountAmount) : undefined,
    };
  }

  /**
   * Verify Razorpay payment and create event participant.
   */
  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    userId: string;
    answers?: Array<{ fieldId: string; value: string | number | string[] }>;
  }) {
    const payment = await prisma.eventPaymentEntity.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            name: true,
            passSendingMode: true,
            registrationForm: {
              include: {
                fields: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerUserId !== params.userId) {
      throw new ForbiddenException('Payment does not belong to this user');
    }

    if (payment.paymentStatus === EventPaymentStatus.CAPTURED) {
      // Payment already processed - return existing participant
      if (payment.participantId) {
        return {
          success: true,
          paymentId: payment.id,
          participantId: payment.participantId,
        };
      }
      throw new BadRequestException('Payment already captured but participant not found');
    }

    // Verify Razorpay signature
    const isValid = this.razorpayService.verifyCheckoutSignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Create participant within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create participant
      const isImmediate = payment.event.passSendingMode === 'IMMEDIATE';
      const participant = await tx.eventParticipantEntity.create({
        data: {
          eventId: payment.event.id,
          userId: params.userId,
          approved: isImmediate,
          approvedAt: isImmediate ? new Date() : null,
          passEmailSent: false,
        },
      });

      // Update event registration count
      await tx.eventEntity.update({
        where: { id: payment.event.id },
        data: { registrationCount: { increment: 1 } },
      });

      // Create registration submission if answers provided
      if (params.answers && params.answers.length > 0 && payment.event.registrationForm) {
        const registrationFields = payment.event.registrationForm.fields;
        const submission = await tx.eventRegistrationSubmissionEntity.create({
          data: {
            eventId: payment.event.id,
            userId: params.userId,
            participantId: participant.id,
          },
        });

        // Create answer records
        for (const answer of params.answers) {
          const field = registrationFields.find((f) => f.id === answer.fieldId);
          if (field) {
            await tx.eventRegistrationAnswerEntity.create({
              data: {
                submissionId: submission.id,
                fieldId: answer.fieldId,
                valueText: typeof answer.value === 'string' ? answer.value : null,
                valueJson: typeof answer.value !== 'string' ? (answer.value as any) : undefined,
              },
            });
          }
        }
      }

      // Update payment record
      await tx.eventPaymentEntity.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature,
          paymentStatus: EventPaymentStatus.CAPTURED,
          orderStatus: EventPaymentOrderStatus.PAID,
          participantId: participant.id,
          capturedAt: new Date(),
        },
      });

      // Create discount redemption if discount was used
      if (payment.discountCodeId) {
        await tx.eventDiscountRedemptionEntity.create({
          data: {
            discountCodeId: payment.discountCodeId,
            userId: params.userId,
            paymentId: payment.id,
          },
        });
      }

      return { participantId: participant.id };
    });

    // Emit event for pass email sending
    this.eventEmitter.emit('event.participant.registered', {
      eventId: payment.event.id,
      userId: params.userId,
      participantId: result.participantId,
      passSendingMode: payment.event.passSendingMode,
    });

    return {
      success: true,
      paymentId: payment.id,
      participantId: result.participantId,
    };
  }

  /**
   * Apply a discount code and return the discount amount.
   */
  private async applyDiscountCode(
    eventId: string,
    userId: string,
    code: string,
    originalAmount: Decimal,
  ): Promise<{ discountAmount: Decimal; discountCodeId: string }> {
    const discountCode = await prisma.eventDiscountCodeEntity.findFirst({
      where: {
        eventId,
        code: code.toUpperCase(),
        active: true,
      },
    });

    if (!discountCode) {
      throw new BadRequestException('Invalid discount code');
    }

    // Check validity period
    const now = new Date();
    if (discountCode.validFrom && now < discountCode.validFrom) {
      throw new BadRequestException('Discount code is not yet valid');
    }
    if (discountCode.validUntil && now > discountCode.validUntil) {
      throw new BadRequestException('Discount code has expired');
    }

    // Check max redemptions
    if (discountCode.maxRedemptions) {
      const redemptionCount = await prisma.eventDiscountRedemptionEntity.count({
        where: { discountCodeId: discountCode.id },
      });
      if (redemptionCount >= discountCode.maxRedemptions) {
        throw new BadRequestException(
          'Discount code has reached maximum redemptions',
        );
      }
    }

    // Check per-user redemptions
    const userRedemption = await prisma.eventDiscountRedemptionEntity.findFirst({
      where: {
        discountCodeId: discountCode.id,
        userId,
      },
    });

    if (userRedemption) {
      throw new BadRequestException('You have already used this discount code');
    }

    // Calculate discount
    let discountAmount: Decimal;
    if (discountCode.type === 'PERCENT') {
      discountAmount = originalAmount
        .times(discountCode.value)
        .dividedBy(100)
        .toDecimalPlaces(2);
    } else {
      discountAmount = new Decimal(discountCode.value);
    }

    // Cap discount at original amount
    if (discountAmount.greaterThan(originalAmount)) {
      discountAmount = originalAmount;
    }

    return {
      discountAmount,
      discountCodeId: discountCode.id,
    };
  }

  /**
   * Check if user is eligible for free entry based on college.
   */
  private async checkFreeCollegeEligibility(
    freeCollegeIds: string[],
    userId: string,
  ): Promise<boolean> {
    if (!freeCollegeIds || freeCollegeIds.length === 0) {
      return false;
    }

    const profile = await prisma.userOnboardingProfileEntity.findUnique({
      where: { userId },
      select: { collegeId: true },
    });

    if (!profile?.collegeId) {
      return false;
    }

    return freeCollegeIds.includes(profile.collegeId);
  }

  /**
   * Get earnings summary for event organizer.
   */
  async getEventEarnings(slug: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      select: {
        id: true,
        ownerId: true,
        name: true,
        endDate: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can view earnings');
    }

    const payments = await prisma.eventPaymentEntity.findMany({
      where: {
        eventId: event.id,
        paymentStatus: {
          in: [EventPaymentStatus.AUTHORIZED, EventPaymentStatus.CAPTURED],
        },
      },
    });

    const totalGross = payments.reduce(
      (sum, p) => sum.plus(p.grossAmount),
      new Decimal(0),
    );
    const totalPlatformFee = payments.reduce(
      (sum, p) => sum.plus(p.platformFeeAmount),
      new Decimal(0),
    );
    const totalOrganizerShare = payments.reduce(
      (sum, p) => sum.plus(p.organizerShareAmount),
      new Decimal(0),
    );
    const totalRefunded = payments.reduce(
      (sum, p) => sum.plus(p.refundedAmount),
      new Decimal(0),
    );

    const netEarnings = totalOrganizerShare.minus(totalRefunded);

    // Get payouts
    const payouts = await prisma.eventPayoutEntity.findMany({
      where: {
        eventId: event.id,
        organizerId: userId,
        status: 'PAID',
      },
    });

    const paidOut = payouts.reduce(
      (sum, p) => sum.plus(p.amount),
      new Decimal(0),
    );

    const pendingPayout = Decimal.max(
      netEarnings.minus(paidOut),
      new Decimal(0),
    );

    // Eligibility based on event end date (funds available after event ends)
    const eligibleAt = event.endDate;
    const isEligibleNow = eligibleAt ? new Date() >= eligibleAt : false;

    return {
      totalGross: totalGross.toString(),
      totalPlatformFees: totalPlatformFee.toString(),
      totalOrganizerShare: totalOrganizerShare.toString(),
      pendingPayout: pendingPayout.toString(),
      paidOut: paidOut.toString(),
      capturedPaymentsCount: payments.length,
      isEligibleNow,
      eligibleAt: eligibleAt?.toISOString() ?? null,
    };
  }

  /**
   * Get all payments for an event (organizer view).
   */
  async getEventPayments(slug: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can view payments');
    }

    const payments = await prisma.eventPaymentEntity.findMany({
      where: { eventId: event.id },
      include: {
        payerUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      payer: p.payerUser,
      grossAmount: p.grossAmount.toString(),
      platformFeeAmount: p.platformFeeAmount.toString(),
      organizerShareAmount: p.organizerShareAmount.toString(),
      discountAmount: p.discountAmount?.toString() ?? null,
      orderStatus: p.orderStatus,
      paymentStatus: p.paymentStatus,
      refundStatus: p.refundStatus,
      capturedAt: p.capturedAt,
      refundedAt: p.refundedAt,
      createdAt: p.createdAt,
    }));
  }

  // =============================================================================
  // DISCOUNT CODE MANAGEMENT
  // =============================================================================

  async createDiscountCode(
    eventSlug: string,
    userId: string,
    params: {
      code: string;
      type: 'PERCENT' | 'FIXED';
      value: number;
      maxRedemptions?: number;
      maxPerUser?: number;
      validFrom?: Date;
      validUntil?: Date;
      active?: boolean;
    },
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can create discount codes');
    }

    const normalizedCode = params.code.toUpperCase().trim();

    // Check for existing code
    const existing = await prisma.eventDiscountCodeEntity.findFirst({
      where: {
        eventId: event.id,
        code: normalizedCode,
      },
    });

    if (existing) {
      throw new BadRequestException('Discount code already exists');
    }

    const discountCode = await prisma.eventDiscountCodeEntity.create({
      data: {
        eventId: event.id,
        code: normalizedCode,
        type: params.type,
        value: new Decimal(params.value),
        maxRedemptions: params.maxRedemptions ?? null,
        maxPerUser: params.maxPerUser ?? 1,
        validFrom: params.validFrom ?? null,
        validUntil: params.validUntil ?? null,
        active: params.active ?? true,
      },
    });

    return {
      id: discountCode.id,
      code: discountCode.code,
      type: discountCode.type,
      value: Number(discountCode.value),
      active: discountCode.active,
      maxRedemptions: discountCode.maxRedemptions,
      maxPerUser: discountCode.maxPerUser,
      validFrom: discountCode.validFrom?.toISOString() ?? null,
      validUntil: discountCode.validUntil?.toISOString() ?? null,
      redemptionCount: 0,
      createdAt: discountCode.createdAt.toISOString(),
    };
  }

  async getDiscountCodes(eventSlug: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can view discount codes');
    }

    const codes = await prisma.eventDiscountCodeEntity.findMany({
      where: { eventId: event.id },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return codes.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      active: c.active,
      maxRedemptions: c.maxRedemptions,
      maxPerUser: c.maxPerUser,
      validFrom: c.validFrom?.toISOString() ?? null,
      validUntil: c.validUntil?.toISOString() ?? null,
      redemptionCount: c._count.redemptions,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async deleteDiscountCode(eventSlug: string, codeId: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can delete discount codes');
    }

    const code = await prisma.eventDiscountCodeEntity.findUnique({
      where: { id: codeId },
    });

    if (!code || code.eventId !== event.id) {
      throw new NotFoundException('Discount code not found');
    }

    await prisma.eventDiscountCodeEntity.delete({
      where: { id: codeId },
    });

    return { success: true };
  }

  async updateDiscountCode(
    eventSlug: string,
    codeId: string,
    userId: string,
    params: {
      active?: boolean;
      maxRedemptions?: number;
      validUntil?: Date;
    },
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can update discount codes');
    }

    const code = await prisma.eventDiscountCodeEntity.findUnique({
      where: { id: codeId },
    });

    if (!code || code.eventId !== event.id) {
      throw new NotFoundException('Discount code not found');
    }

    const updated = await prisma.eventDiscountCodeEntity.update({
      where: { id: codeId },
      data: {
        active: params.active,
        maxRedemptions: params.maxRedemptions,
        validUntil: params.validUntil,
      },
    });

    return {
      id: updated.id,
      code: updated.code,
      type: updated.type,
      value: Number(updated.value),
      active: updated.active,
      maxRedemptions: updated.maxRedemptions,
      maxPerUser: updated.maxPerUser,
      validFrom: updated.validFrom?.toISOString() ?? null,
      validUntil: updated.validUntil?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // =============================================================================
  // PRICING MANAGEMENT
  // =============================================================================

  async updateEventPricing(
    eventSlug: string,
    userId: string,
    params: {
      isFree?: boolean;
      entryFeeAmount?: string;
      freeCollegeIds?: string[];
    },
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug },
      select: {
        id: true,
        ownerId: true,
        status: true,
        registrationCount: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can update pricing');
    }

    // Only allow pricing changes in DRAFT status or if no registrations
    if (event.status !== 'DRAFT' && event.registrationCount > 0) {
      throw new BadRequestException(
        'Cannot change pricing after registration has started',
      );
    }

    const updateData: Record<string, unknown> = {};

    if (params.isFree !== undefined) {
      updateData.isFree = params.isFree;
    }

    if (params.entryFeeAmount !== undefined) {
      updateData.entryFeeAmount = params.entryFeeAmount
        ? new Decimal(params.entryFeeAmount)
        : null;
    }

    if (params.freeCollegeIds !== undefined) {
      updateData.freeCollegeIds = params.freeCollegeIds;
    }

    const updated = await prisma.eventEntity.update({
      where: { id: event.id },
      data: updateData,
      select: {
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        freeCollegeIds: true,
      },
    });

    return {
      isFree: updated.isFree,
      entryFeeAmount: updated.entryFeeAmount?.toString() ?? null,
      currency: updated.currency,
      freeCollegeIds: updated.freeCollegeIds,
    };
  }
}

