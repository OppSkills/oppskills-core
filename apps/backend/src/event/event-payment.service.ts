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
import {
  RazorpayService,
  PaymentRegistrationEscrowService,
  computeRazorpayGatewayFee,
} from '../payments';
import { Decimal } from '@prisma/client/runtime/library';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { extractMobileFromRegistrationFieldAnswers } from '../_utils/extract-mobile-from-registration-field-answers';
import { syncUserOnboardingMobileFromRegistration } from '../_utils/sync-user-onboarding-mobile';
import { ReferralService } from '../referral/referral.service';
import { ReferralEntityTypeDto } from '@oppskills/types';

@Injectable()
export class EventPaymentService {
  private readonly logger = new Logger(EventPaymentService.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentEscrowService: PaymentRegistrationEscrowService,
    private readonly referralService: ReferralService,
  ) {}

  /**
   * Create a payment order for event registration.
   * Returns zero-amount response if user is from a free college or event is free.
   */
  async createPaymentOrder(params: {
    eventSlug: string;
    userId: string;
    discountCode?: string;
    /** Escrowed server-side for verify/webhook when client omits answers */
    answers?: Array<{ fieldId: string; value: string }>;
    /**
     * Referral code from /r/<code> link (oppskills_ref cookie). Persisted on
     * Razorpay order notes so attribution survives redirects / webhooks.
     * Silently ignored if invalid / mismatched.
     */
    referralCode?: string;
    /** The specific ticket tier the user is purchasing */
    ticketTierId?: string;
  }) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: params.eventSlug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        name: true,
        isFree: true,
        freeCollegeIds: true,
        entryFeeAmount: true,
        currency: true,
        feeBearer: true,
        registrationDeadline: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        ownerId: true,
        maxUsers: true,
        registrationCount: true,
        festivalId: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isFree) {
      throw new BadRequestException('This event is free, no payment required');
    }

    const activeTierCount = await prisma.ticketTierEntity.count({
      where: { eventId: event.id, isActive: true },
    });

    if (!event.entryFeeAmount && activeTierCount === 0) {
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

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.maxUsers !== null && event.registrationCount >= event.maxUsers) {
      throw new BadRequestException('Event is at full capacity');
    }

    let registrationFee: Decimal;
    if (activeTierCount > 0) {
      if (!params.ticketTierId) {
        throw new BadRequestException('Please select a ticket type');
      }
      const tier = await prisma.ticketTierEntity.findFirst({
        where: {
          id: params.ticketTierId,
          eventId: event.id,
          isActive: true,
        },
      });
      if (!tier) {
        throw new BadRequestException(
          'Invalid or inactive ticket tier selected',
        );
      }
      if (tier.capacity != null) {
        const sold = await prisma.eventPaymentEntity.count({
          where: {
            ticketTierId: tier.id,
            paymentStatus: {
              in: [EventPaymentStatus.CAPTURED, EventPaymentStatus.AUTHORIZED],
            },
          },
        });
        if (sold >= tier.capacity) {
          throw new BadRequestException('This ticket type is sold out');
        }
      }
      registrationFee = new Decimal(tier.price);
    } else {
      if (params.ticketTierId) {
        throw new BadRequestException('Ticket type is not used for this event');
      }
      registrationFee = new Decimal(event.entryFeeAmount || 0);
    }

    // Check if user already fully registered (draft checkout rows are allowed)
    const existingParticipant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: params.userId,
        },
      },
      select: { id: true, checkoutPending: true },
    });

    if (existingParticipant && !existingParticipant.checkoutPending) {
      throw new BadRequestException(
        'You are already registered for this event',
      );
    }

    const successfulPayment = await prisma.eventPaymentEntity.findFirst({
      where: {
        eventId: event.id,
        payerUserId: params.userId,
        paymentStatus: {
          in: [EventPaymentStatus.CAPTURED, EventPaymentStatus.AUTHORIZED],
        },
      },
    });

    if (successfulPayment) {
      throw new BadRequestException('Payment already completed');
    }

    // Drop abandoned Razorpay CREATED rows so checkout can refresh pricing/discounts
    await prisma.eventPaymentEntity.deleteMany({
      where: {
        eventId: event.id,
        payerUserId: params.userId,
        paymentStatus: EventPaymentStatus.CREATED,
        orderStatus: EventPaymentOrderStatus.CREATED,
      },
    });

    // Check if user is eligible for free entry (college-based)
    const isEligibleForFreeEntry = await this.checkFreeCollegeEligibility(
      event.freeCollegeIds,
      params.userId,
    );

    if (isEligibleForFreeEntry) {
      const payment = await prisma.eventPaymentEntity.create({
        data: {
          eventId: event.id,
          organizerId: event.ownerId,
          payerUserId: params.userId,
          ticketTierId: params.ticketTierId,
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

      return {
        paymentId: payment.id,
        razorpayKey: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: event.currency || 'INR',
        eventName: event.name,
        eventSlug: event.slug,
        originalAmount: Number(registrationFee),
        finalAmount: 0,
        zeroAmountPayment: true,
        isCollegeFree: true,
      };
    }

    // registrationFee is already set above to either ticket tier price or entry fee
    const orderBaseAmount = registrationFee;
    let discountAmount = new Decimal(0);
    let discountCodeId: string | null = null;

    // Apply discount code if provided
    if (params.discountCode) {
      const discount = await this.applyDiscountCode(
        event.id,
        params.userId,
        params.discountCode,
        registrationFee,
      );
      discountAmount = discount.discountAmount;
      discountCodeId = discount.discountCodeId;
      registrationFee = registrationFee.minus(discountAmount);

      if (registrationFee.lessThanOrEqualTo(0)) {
        registrationFee = new Decimal(0);
      }
    }

    const gatewayFee = registrationFee.greaterThan(0)
      ? computeRazorpayGatewayFee(registrationFee)
      : new Decimal(0);

    let chargeAmount: Decimal;
    let organizerShareAmount: Decimal;
    if (event.feeBearer === 'PARTICIPANT' && registrationFee.greaterThan(0)) {
      chargeAmount = registrationFee.plus(gatewayFee);
      organizerShareAmount = registrationFee;
    } else {
      chargeAmount = registrationFee;
      organizerShareAmount = registrationFee.minus(gatewayFee);
    }

    const processingFeeAmount =
      event.feeBearer === 'PARTICIPANT' && gatewayFee.greaterThan(0)
        ? gatewayFee
        : new Decimal(0);

    const grossAmountPaise = chargeAmount.times(100).toNumber();

    // Paid checkout with internal registration fields requires a prior draft save
    // (participant checkoutPending + submission answers), unless the client still
    // sends legacy answers at order-create time.
    if (grossAmountPaise > 0) {
      const legacyAnswersAtOrderCreate = !!(
        params.answers && params.answers.length > 0
      );
      const eventRegForm = await prisma.eventRegistrationFormEntity.findUnique({
        where: { eventId: event.id },
        select: {
          externalFormLink: true,
          _count: { select: { fields: true } },
        },
      });
      const internalFieldCount = eventRegForm?._count.fields ?? 0;
      const externalFormOnly =
        !!eventRegForm?.externalFormLink?.trim() && internalFieldCount === 0;

      if (
        internalFieldCount > 0 &&
        !legacyAnswersAtOrderCreate &&
        !externalFormOnly
      ) {
        const participant = await prisma.eventParticipantEntity.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: params.userId,
            },
          },
          select: { checkoutPending: true },
        });
        if (!participant?.checkoutPending) {
          throw new BadRequestException(
            'Save your registration before checkout — complete the registration form first.',
          );
        }
        const submission =
          await prisma.eventRegistrationSubmissionEntity.findFirst({
            where: { eventId: event.id, userId: params.userId },
            select: { _count: { select: { answers: true } } },
          });
        if (!submission || submission._count.answers === 0) {
          throw new BadRequestException(
            'Save your registration before checkout — registration answers are missing.',
          );
        }
      }
    }

    // Handle zero amount after discount
    if (grossAmountPaise === 0) {
      const payment = await prisma.eventPaymentEntity.create({
        data: {
          eventId: event.id,
          organizerId: event.ownerId,
          payerUserId: params.userId,
          ticketTierId: params.ticketTierId,
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

      return {
        paymentId: payment.id,
        razorpayKey: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: event.currency || 'INR',
        eventName: event.name,
        eventSlug: event.slug,
        originalAmount: Number(orderBaseAmount),
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
    if (params.referralCode) {
      orderNotes.referralCode = params.referralCode;
    }

    const razorpayOrder = await this.razorpayService.createOrder({
      amountPaise: grossAmountPaise,
      currency: event.currency || 'INR',
      receipt: `evt_${event.id.slice(-8)}_${Date.now()}`,
      notes: orderNotes,
    });

    const payment = await prisma.eventPaymentEntity.create({
      data: {
        eventId: event.id,
        organizerId: event.ownerId,
        payerUserId: params.userId,
        ticketTierId: params.ticketTierId,
        currency: event.currency || 'INR',
        grossAmount: registrationFee,
        platformFeeAmount: gatewayFee,
        organizerShareAmount,
        chargedAmount: chargeAmount,
        razorpayOrderId: razorpayOrder.id,
        transferOnHold: false,
        transferOnHoldUntil: null,
        orderStatus: EventPaymentOrderStatus.CREATED,
        paymentStatus: EventPaymentStatus.CREATED,
        discountCodeId,
        discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
      },
    });

    if (params.answers && params.answers.length > 0) {
      const draftFromDb = await this.loadSubmissionAnswersForUser(
        event.id,
        params.userId,
      );
      if (!draftFromDb.length) {
        await this.paymentEscrowService.upsertEventEscrow({
          razorpayOrderId: razorpayOrder.id,
          payerUserId: params.userId,
          eventId: event.id,
          answers: params.answers,
        });
      }
    }

    return {
      paymentId: payment.id,
      razorpayKey: this.razorpayService.getKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amountPaise: grossAmountPaise,
      currency: event.currency || 'INR',
      eventName: event.name,
      eventSlug: event.slug,
      originalAmount: Number(orderBaseAmount),
      finalAmount: Number(registrationFee),
      discountAmount: discountAmount.greaterThan(0)
        ? Number(discountAmount)
        : undefined,
      processingFeeAmount: processingFeeAmount.greaterThan(0)
        ? Number(processingFeeAmount)
        : undefined,
      feeBearer: event.feeBearer,
    };
  }

  /**
   * Persist registration answers to live tables before Razorpay checkout.
   * Participant is marked checkoutPending until verify completes payment.
   */
  async saveRegistrationCheckoutDraft(params: {
    eventSlug: string;
    userId: string;
    answers: Array<{ fieldId: string; value: string }>;
    ticketTierId?: string;
    referralCode?: string;
  }) {
    void params.referralCode;
    const event = await prisma.eventEntity.findUnique({
      where: { slug: params.eventSlug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        name: true,
        isFree: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        ownerId: true,
        maxUsers: true,
        registrationCount: true,
        registrationDeadline: true,
        entryFeeAmount: true,
        freeCollegeIds: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isFree) {
      throw new BadRequestException('This event is free; use join instead');
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

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.maxUsers !== null && event.registrationCount >= event.maxUsers) {
      throw new BadRequestException('Event is at full capacity');
    }

    if (event.ownerId === params.userId) {
      throw new BadRequestException('You cannot register for your own event');
    }

    const activeTierCount = await prisma.ticketTierEntity.count({
      where: { eventId: event.id, isActive: true },
    });

    if (activeTierCount > 0) {
      if (!params.ticketTierId) {
        throw new BadRequestException('Please select a ticket type');
      }
      const tier = await prisma.ticketTierEntity.findFirst({
        where: {
          id: params.ticketTierId,
          eventId: event.id,
          isActive: true,
        },
      });
      if (!tier) {
        throw new BadRequestException(
          'Invalid or inactive ticket tier selected',
        );
      }
    } else if (params.ticketTierId) {
      throw new BadRequestException('Ticket type is not used for this event');
    }

    const existingParticipant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: params.userId,
        },
      },
      select: { id: true, checkoutPending: true },
    });

    if (existingParticipant && !existingParticipant.checkoutPending) {
      throw new BadRequestException(
        'You are already registered for this event',
      );
    }

    const successfulPayment = await prisma.eventPaymentEntity.findFirst({
      where: {
        eventId: event.id,
        payerUserId: params.userId,
        paymentStatus: {
          in: [EventPaymentStatus.CAPTURED, EventPaymentStatus.AUTHORIZED],
        },
      },
    });

    if (successfulPayment) {
      throw new BadRequestException('Payment already completed');
    }

    const isEligibleForFreeEntry = await this.checkFreeCollegeEligibility(
      event.freeCollegeIds,
      params.userId,
    );
    if (isEligibleForFreeEntry) {
      throw new BadRequestException(
        'You qualify for free entry — complete registration without this checkout step.',
      );
    }

    const mappedAnswers = await this.mapFrontendFieldIdsToDbIds(
      event.id,
      params.userId,
      params.answers as Array<{
        fieldId: string;
        value: string | number | string[];
      }>,
    );

    const requiredOrganizerFields =
      await this.applicableRequiredOrganizerRegistrationFields(
        event.id,
        params.userId,
      );

    if (requiredOrganizerFields.length > 0) {
      const answerByFieldId = new Map(
        mappedAnswers.map((a) => [a.fieldId, a] as const),
      );
      for (const field of requiredOrganizerFields) {
        const answer = answerByFieldId.get(field.id);
        const value = answer?.value;
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          throw new BadRequestException(`Field "${field.label}" is required.`);
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const participant = await tx.eventParticipantEntity.upsert({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: params.userId,
          },
        },
        create: {
          eventId: event.id,
          userId: params.userId,
          approved: false,
          approvedAt: null,
          passEmailSent: false,
          checkoutPending: true,
        },
        update: {
          checkoutPending: true,
        },
      });

      let submission = await tx.eventRegistrationSubmissionEntity.findFirst({
        where: { eventId: event.id, userId: params.userId },
      });

      if (submission) {
        await tx.eventRegistrationAnswerEntity.deleteMany({
          where: { submissionId: submission.id },
        });
      } else {
        submission = await tx.eventRegistrationSubmissionEntity.create({
          data: {
            eventId: event.id,
            userId: params.userId,
            participantId: participant.id,
          },
        });
      }

      const answerData = mappedAnswers.map((a) => ({
        submissionId: submission.id,
        fieldId: a.fieldId,
        valueText:
          typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
        valueJson: a.value,
      }));

      if (answerData.length > 0) {
        await tx.eventRegistrationAnswerEntity.createMany({
          data: answerData,
        });
      }
    });

    return {
      success: true,
      eventSlug: event.slug,
      checkoutPath: `/events/${event.slug}/checkout`,
    };
  }

  /**
   * Called from Razorpay webhook after capture: submit escrowed answers when the client
   * never called verify with answers (e.g. mobile redirect).
   */
  async trySubmitRegistrationFromEscrowAfterWebhook(
    razorpayOrderId: string,
  ): Promise<void> {
    const payment = await prisma.eventPaymentEntity.findUnique({
      where: { razorpayOrderId },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            registrationForm: { select: { fields: { select: { id: true } } } },
          },
        },
      },
    });
    if (!payment || payment.paymentStatus !== EventPaymentStatus.CAPTURED) {
      return;
    }
    const fromSubmission = await this.loadSubmissionAnswersForUser(
      payment.eventId,
      payment.payerUserId,
    );
    const escrowAnswers =
      fromSubmission.length > 0
        ? null
        : await this.paymentEscrowService.loadAnswersForVerify(
            razorpayOrderId,
            payment.payerUserId,
          );
    if (!fromSubmission.length && !(escrowAnswers?.length ?? 0)) {
      return;
    }
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: payment.eventId,
          userId: payment.payerUserId,
        },
      },
    });
    if (!participant) {
      this.logger.warn(
        `Escrow submit skipped: no participant yet for event order ${razorpayOrderId}`,
      );
      return;
    }
    try {
      const merged =
        fromSubmission.length > 0
          ? fromSubmission
          : escrowAnswers!.map((a) => ({
              fieldId: a.fieldId,
              value: a.value,
            }));
      const mappedAnswers = await this.mapFrontendFieldIdsToDbIds(
        payment.eventId,
        payment.payerUserId,
        merged as Array<{ fieldId: string; value: string | number | string[] }>,
      );
      if (!mappedAnswers.length) {
        return;
      }
      await this.saveRegistrationAnswersIfMissing(
        payment.eventId,
        payment.payerUserId,
        participant.id,
        mappedAnswers,
      );
      await this.paymentEscrowService.deleteByRazorpayOrderId(razorpayOrderId);
    } catch (err) {
      this.logger.warn(
        `Escrow submit after event webhook failed for order ${razorpayOrderId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * After payment is CAPTURED (verify or webhook), clear checkoutPending and bump
   * registration count once — mirrors verifyPayment when a draft participant already exists.
   * Safe to call multiple times (idempotent).
   */
  async finalizeEventParticipantAfterCapture(
    razorpayOrderId: string,
  ): Promise<void> {
    const payment = await prisma.eventPaymentEntity.findUnique({
      where: { razorpayOrderId },
      include: {
        event: {
          select: { id: true, passSendingMode: true },
        },
      },
    });
    if (!payment || payment.paymentStatus !== EventPaymentStatus.CAPTURED) {
      return;
    }

    const participant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: payment.eventId,
          userId: payment.payerUserId,
        },
      },
      select: { id: true },
    });
    if (!participant) {
      return;
    }

    if (!payment.participantId) {
      await prisma.eventPaymentEntity.update({
        where: { id: payment.id },
        data: { participantId: participant.id },
      });
    }

    const isImmediate = payment.event.passSendingMode === 'IMMEDIATE';
    const checkoutCleared = await prisma.eventParticipantEntity.updateMany({
      where: {
        id: participant.id,
        checkoutPending: true,
      },
      data: {
        checkoutPending: false,
        approved: isImmediate,
        approvedAt: isImmediate ? new Date() : null,
      },
    });

    if (checkoutCleared.count === 1) {
      await prisma.eventEntity.update({
        where: { id: payment.eventId },
        data: { registrationCount: { increment: 1 } },
      });
      this.eventEmitter.emit('event.participant.registered', {
        eventId: payment.eventId,
        userId: payment.payerUserId,
        participantId: participant.id,
        passSendingMode: payment.event.passSendingMode,
      });
    }
  }

  private async loadSubmissionAnswersForUser(
    eventId: string,
    userId: string,
  ): Promise<Array<{ fieldId: string; value: string | number | string[] }>> {
    const submission = await prisma.eventRegistrationSubmissionEntity.findFirst(
      {
        where: { eventId, userId },
        include: {
          answers: {
            select: { fieldId: true, valueJson: true, valueText: true },
          },
        },
      },
    );
    if (!submission?.answers?.length) {
      return [];
    }
    return submission.answers.map((a) => ({
      fieldId: a.fieldId,
      value:
        a.valueJson !== null && a.valueJson !== undefined
          ? (a.valueJson as string | number | string[])
          : (a.valueText ?? ''),
    }));
  }

  private async resolveMergedAnswersForEventVerify(
    razorpayOrderId: string,
    userId: string,
    eventId: string,
    bodyAnswers?: Array<{ fieldId: string; value: string | number | string[] }>,
  ): Promise<Array<{ fieldId: string; value: string | number | string[] }>> {
    const fromSubmission = await this.loadSubmissionAnswersForUser(
      eventId,
      userId,
    );
    const fromEscrow = await this.paymentEscrowService.loadAnswersForVerify(
      razorpayOrderId,
      userId,
    );
    const fromEscrowMapped: Array<{
      fieldId: string;
      value: string | number | string[];
    }> =
      fromEscrow?.length ?? 0
        ? fromEscrow!.map((a) => ({
            fieldId: a.fieldId,
            value: a.value,
          }))
        : [];

    const base =
      fromSubmission.length > 0 ? fromSubmission : fromEscrowMapped;

    if (bodyAnswers?.length) {
      const merged = new Map<string, string | number | string[]>();
      for (const a of base) {
        merged.set(a.fieldId, a.value);
      }
      for (const b of bodyAnswers) {
        merged.set(b.fieldId, b.value);
      }
      const out = Array.from(merged.entries()).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      this.logger.log(
        `Event verifyPayment: merged registration answers for user ${userId} (${out.length} fields; body overlay on draft/escrow)`,
      );
      return out;
    }

    if (fromSubmission.length) {
      this.logger.log(
        `Event verifyPayment: using saved registration submission for user ${userId} (${fromSubmission.length} fields)`,
      );
      return fromSubmission;
    }
    if (fromEscrowMapped.length) {
      this.logger.log(
        `Event verifyPayment: using server-escrowed registration answers for order ${razorpayOrderId} (${fromEscrowMapped.length} fields)`,
      );
      return fromEscrowMapped;
    }
    return [];
  }

  /**
   * Verify Razorpay payment and create event participant.
   * This method is idempotent - safe to call multiple times or concurrently with webhook.
   */
  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    userId: string;
    answers?: Array<{ fieldId: string; value: string | number | string[] }>;
    /**
     * Optional referral code fallback. Primary source is Razorpay order notes
     * (set at createPaymentOrder time). Silently ignored if invalid.
     */
    referralCode?: string;
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
            festivalId: true,
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

    const mergedAnswers = await this.resolveMergedAnswersForEventVerify(
      params.razorpayOrderId,
      params.userId,
      payment.eventId,
      params.answers,
    );

    // Resolve referral code (DTO → Razorpay notes fallback). Best-effort only.
    const referralId = await this.resolveReferralForEventPayment({
      userId: params.userId,
      eventId: payment.event.id,
      festivalId: payment.event.festivalId,
      razorpayOrderId: params.razorpayOrderId,
      dtoReferralCode: params.referralCode,
    });

    if (
      !mergedAnswers.length &&
      payment.event.registrationForm?.fields?.length
    ) {
      this.logger.warn(
        `Event verifyPayment: no registration answers for order ${params.razorpayOrderId} but form has ${payment.event.registrationForm.fields.length} field(s) — answers will not be saved`,
      );
    }

    // If payment is not yet captured, verify the signature
    if (payment.paymentStatus !== EventPaymentStatus.CAPTURED) {
      const isValid = this.razorpayService.verifyCheckoutSignature({
        orderId: params.razorpayOrderId,
        paymentId: params.razorpayPaymentId,
        signature: params.razorpaySignature,
      });

      if (!isValid) {
        throw new BadRequestException('Invalid payment signature');
      }
    }

    // Map frontend field IDs to database field IDs EARLY (before participant check)
    // This ensures we have mapped answers for saving even if participant already exists
    const mappedAnswers = await this.mapFrontendFieldIdsToDbIds(
      payment.event.id,
      params.userId,
      mergedAnswers,
    );

    // Check for existing participant (might have been created by webhook or checkout draft)
    const existingParticipant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: payment.event.id,
          userId: params.userId,
        },
      },
      select: { id: true, checkoutPending: true },
    });

    // If participant already exists, save answers if not already saved, then return
    if (existingParticipant) {
      // Update payment with participantId if not already linked (webhook might have created participant)
      if (!payment.participantId) {
        await prisma.eventPaymentEntity.update({
          where: { id: payment.id },
          data: {
            participantId: existingParticipant.id,
            razorpayPaymentId: params.razorpayPaymentId,
            razorpaySignature: params.razorpaySignature,
            paymentStatus: EventPaymentStatus.CAPTURED,
            orderStatus: EventPaymentOrderStatus.PAID,
            capturedAt: payment.capturedAt || new Date(),
          },
        });
      }

      // Save registration answers if not already saved (webhook doesn't have access to answers)
      await this.saveRegistrationAnswersIfMissing(
        payment.event.id,
        params.userId,
        existingParticipant.id,
        mappedAnswers,
      );

      const isImmediate = payment.event.passSendingMode === 'IMMEDIATE';
      const checkoutCleared = await prisma.eventParticipantEntity.updateMany({
        where: {
          id: existingParticipant.id,
          checkoutPending: true,
        },
        data: {
          checkoutPending: false,
          approved: isImmediate,
          approvedAt: isImmediate ? new Date() : null,
        },
      });

      if (checkoutCleared.count === 1) {
        await prisma.eventEntity.update({
          where: { id: payment.event.id },
          data: { registrationCount: { increment: 1 } },
        });
        this.eventEmitter.emit('event.participant.registered', {
          eventId: payment.event.id,
          userId: params.userId,
          participantId: existingParticipant.id,
          passSendingMode: payment.event.passSendingMode,
        });
      }

      await this.syncOnboardingMobileFromEventVerify(
        params.userId,
        mappedAnswers,
        payment.event.registrationForm?.fields,
      );

      await this.paymentEscrowService.deleteByRazorpayOrderId(
        params.razorpayOrderId,
      );

      await this.attributeEventReferralIfNew({
        referralId,
        participantId: existingParticipant.id,
      });

      return {
        success: true,
        paymentId: payment.id,
        participantId: existingParticipant.id,
      };
    }

    // Create participant within transaction with race condition handling
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Double-check for existing participant inside transaction (handles race with webhook)
        const participantCheck = await tx.eventParticipantEntity.findUnique({
          where: {
            eventId_userId: {
              eventId: payment.event.id,
              userId: params.userId,
            },
          },
        });

        if (participantCheck) {
          // Webhook beat us to it - link payment and save answers
          await tx.eventPaymentEntity.update({
            where: { id: payment.id },
            data: {
              participantId: participantCheck.id,
              razorpayPaymentId: params.razorpayPaymentId,
              razorpaySignature: params.razorpaySignature,
              paymentStatus: EventPaymentStatus.CAPTURED,
              orderStatus: EventPaymentOrderStatus.PAID,
              capturedAt: payment.capturedAt || new Date(),
            },
          });

          // Save registration answers (webhook doesn't have access to them)
          if (mappedAnswers.length > 0) {
            // Check if submission already exists
            const existingSubmission =
              await tx.eventRegistrationSubmissionEntity.findFirst({
                where: {
                  eventId: payment.event.id,
                  userId: params.userId,
                },
              });

            if (!existingSubmission) {
              const submission =
                await tx.eventRegistrationSubmissionEntity.create({
                  data: {
                    eventId: payment.event.id,
                    userId: params.userId,
                    participantId: participantCheck.id,
                  },
                });

              const answerData = mappedAnswers.map((a) => ({
                submissionId: submission.id,
                fieldId: a.fieldId,
                valueText:
                  typeof a.value === 'string'
                    ? a.value
                    : JSON.stringify(a.value),
                valueJson: a.value,
              }));

              await tx.eventRegistrationAnswerEntity.createMany({
                data: answerData,
              });
            }
          }

          const isImmediateInner =
            payment.event.passSendingMode === 'IMMEDIATE';
          const checkoutClearedInner =
            await tx.eventParticipantEntity.updateMany({
              where: {
                id: participantCheck.id,
                checkoutPending: true,
              },
              data: {
                checkoutPending: false,
                approved: isImmediateInner,
                approvedAt: isImmediateInner ? new Date() : null,
              },
            });
          if (checkoutClearedInner.count === 1) {
            await tx.eventEntity.update({
              where: { id: payment.event.id },
              data: { registrationCount: { increment: 1 } },
            });
          }

          return {
            participantId: participantCheck.id,
            alreadyExisted: true,
            didClearCheckout: checkoutClearedInner.count === 1,
          };
        }

        // Create participant
        const isImmediate = payment.event.passSendingMode === 'IMMEDIATE';
        const participant = await tx.eventParticipantEntity.create({
          data: {
            eventId: payment.event.id,
            userId: params.userId,
            approved: isImmediate,
            approvedAt: isImmediate ? new Date() : null,
            passEmailSent: false,
            checkoutPending: false,
            ...(referralId ? { referralId } : {}),
          },
        });

        // Update event registration count
        await tx.eventEntity.update({
          where: { id: payment.event.id },
          data: { registrationCount: { increment: 1 } },
        });

        // Create registration submission if answers provided
        if (mappedAnswers.length > 0) {
          const submission = await tx.eventRegistrationSubmissionEntity.create({
            data: {
              eventId: payment.event.id,
              userId: params.userId,
              participantId: participant.id,
            },
          });

          // Create answers
          const answerData = mappedAnswers.map((a) => ({
            submissionId: submission.id,
            fieldId: a.fieldId,
            valueText:
              typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
            valueJson: a.value,
          }));

          await tx.eventRegistrationAnswerEntity.createMany({
            data: answerData,
          });
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
          try {
            await tx.eventDiscountRedemptionEntity.create({
              data: {
                discountCodeId: payment.discountCodeId,
                userId: params.userId,
                paymentId: payment.id,
              },
            });
          } catch (discountError: any) {
            // Ignore duplicate redemption (might have been created by webhook)
            if (discountError?.code !== 'P2002') {
              throw discountError;
            }
          }
        }

        return {
          participantId: participant.id,
          alreadyExisted: false,
          didClearCheckout: false,
        };
      });

      // Emit event for pass email sending (only if we created the participant)
      if (!result.alreadyExisted || result.didClearCheckout) {
        this.eventEmitter.emit('event.participant.registered', {
          eventId: payment.event.id,
          userId: params.userId,
          participantId: result.participantId,
          passSendingMode: payment.event.passSendingMode,
        });
      }

      // Attribute referral (atomic check-and-set + idempotent counter bump).
      await this.attributeEventReferralIfNew({
        referralId,
        participantId: result.participantId,
      });

      await this.syncOnboardingMobileFromEventVerify(
        params.userId,
        mappedAnswers,
        payment.event.registrationForm?.fields,
      );

      await this.paymentEscrowService.deleteByRazorpayOrderId(
        params.razorpayOrderId,
      );

      return {
        success: true,
        paymentId: payment.id,
        participantId: result.participantId,
      };
    } catch (error: any) {
      // Handle race condition - if participant was created by webhook during our transaction
      if (error?.code === 'P2002') {
        this.logger.warn(
          `Race condition handled: Participant already exists for user ${params.userId} in event ${payment.event.id}`,
        );

        // Fetch the participant that was created by the webhook
        const raceParticipant = await prisma.eventParticipantEntity.findUnique({
          where: {
            eventId_userId: {
              eventId: payment.event.id,
              userId: params.userId,
            },
          },
        });

        if (raceParticipant) {
          // Make sure payment is linked
          await prisma.eventPaymentEntity.update({
            where: { id: payment.id },
            data: {
              participantId: raceParticipant.id,
              razorpayPaymentId: params.razorpayPaymentId,
              razorpaySignature: params.razorpaySignature,
              paymentStatus: EventPaymentStatus.CAPTURED,
              orderStatus: EventPaymentOrderStatus.PAID,
              capturedAt: payment.capturedAt || new Date(),
            },
          });

          // Save registration answers (webhook doesn't have access to them)
          await this.saveRegistrationAnswersIfMissing(
            payment.event.id,
            params.userId,
            raceParticipant.id,
            mappedAnswers,
          );

          await this.syncOnboardingMobileFromEventVerify(
            params.userId,
            mappedAnswers,
            payment.event.registrationForm?.fields,
          );

          await this.paymentEscrowService.deleteByRazorpayOrderId(
            params.razorpayOrderId,
          );

          await this.attributeEventReferralIfNew({
            referralId,
            participantId: raceParticipant.id,
          });

          return {
            success: true,
            paymentId: payment.id,
            participantId: raceParticipant.id,
          };
        }
      }

      throw error;
    }
  }

  /**
   * Resolve a referral code for an event payment flow. Order of precedence:
   * explicit DTO `referralCode`, then Razorpay `order.notes.referralCode`
   * (set at createPaymentOrder time). Returns null on any failure / mismatch.
   */
  private async resolveReferralForEventPayment(input: {
    userId: string;
    eventId: string;
    festivalId: string | null;
    razorpayOrderId: string;
    dtoReferralCode?: string;
  }): Promise<string | null> {
    let code = input.dtoReferralCode?.trim() || null;
    if (!code) {
      try {
        const order = await this.razorpayService.fetchOrder(
          input.razorpayOrderId,
        );
        const fromNotes = order?.notes?.referralCode;
        if (fromNotes) code = fromNotes;
      } catch {
        // Razorpay fetch can fail on synthetic / zero-amount orders.
      }
    }
    if (!code) return null;
    try {
      return await this.referralService.resolveForRegistration({
        code,
        userId: input.userId,
        expectedEntityType: ReferralEntityTypeDto.EVENT,
        expectedEntityId: input.eventId,
        parentFestivalId: input.festivalId,
      });
    } catch {
      return null;
    }
  }

  /**
   * Idempotent attribution helper: atomically sets `referralId` on the
   * EventParticipantEntity only if it is currently null, and bumps the
   * referral counter exactly once. Safe to call from both verify and webhook.
   */
  private async attributeEventReferralIfNew(input: {
    referralId: string | null;
    participantId: string;
  }): Promise<void> {
    if (!input.referralId) return;
    try {
      const res = await prisma.eventParticipantEntity.updateMany({
        where: { id: input.participantId, referralId: null },
        data: { referralId: input.referralId },
      });
      if (res.count > 0) {
        await this.referralService.markRegistrationAttributed(input.referralId);
      }
    } catch (err) {
      this.logger.warn(
        `Event referral attribution best-effort failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async syncOnboardingMobileFromEventVerify(
    userId: string,
    mappedAnswers: Array<{
      fieldId: string;
      value: string | number | string[];
    }>,
    rawFields:
      | Array<{ id: string; label: string; type: string }>
      | undefined
      | null,
  ): Promise<void> {
    const fields = (rawFields ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
    }));
    const mobile = extractMobileFromRegistrationFieldAnswers(
      mappedAnswers,
      fields,
    );
    await syncUserOnboardingMobileFromRegistration(userId, mobile);
  }

  /**
   * Save registration answers for a participant if not already saved.
   * Called when participant was created by webhook (which has no access to answers).
   */
  private async saveRegistrationAnswersIfMissing(
    eventId: string,
    userId: string,
    participantId: string,
    mappedAnswers: Array<{
      fieldId: string;
      value: string | number | string[];
    }>,
  ): Promise<void> {
    if (!mappedAnswers || mappedAnswers.length === 0) {
      return;
    }

    // Check if submission already exists
    const existingSubmission =
      await prisma.eventRegistrationSubmissionEntity.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    if (existingSubmission) {
      const answerCount = await prisma.eventRegistrationAnswerEntity.count({
        where: { submissionId: existingSubmission.id },
      });
      if (answerCount > 0) {
        return;
      }
      const answerData = mappedAnswers.map((a) => ({
        submissionId: existingSubmission.id,
        fieldId: a.fieldId,
        valueText:
          typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
        valueJson: a.value,
      }));
      await prisma.eventRegistrationAnswerEntity.createMany({
        data: answerData,
      });
      this.logger.log(
        `Filled ${answerData.length} registration answers on existing shell submission ${existingSubmission.id} for event ${eventId}`,
      );
      return;
    }

    // Create submission and save answers
    const submission = await prisma.eventRegistrationSubmissionEntity.create({
      data: {
        eventId,
        userId,
        participantId,
      },
    });

    const answerData = mappedAnswers.map((a) => ({
      submissionId: submission.id,
      fieldId: a.fieldId,
      valueText:
        typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
      valueJson: a.value,
    }));

    await prisma.eventRegistrationAnswerEntity.createMany({
      data: answerData,
    });

    this.logger.log(
      `Saved ${answerData.length} registration answers for participant ${participantId} in event ${eventId}`,
    );
  }

  /**
   * Required registration fields created by the organizer use order >= 0. Lazy default
   * identity fields (name, email, etc.) use negative orders and are not counted here,
   * so paid checkout drafts are allowed when the event has no custom required questions.
   */
  private async applicableRequiredOrganizerRegistrationFields(
    eventId: string,
    userId: string,
  ): Promise<Array<{ id: string; label: string }>> {
    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
        select: { userCategory: true },
      });
    const userCategory = userOnboardingProfile?.userCategory;

    const regForm = await prisma.eventRegistrationFormEntity.findUnique({
      where: { eventId },
      include: {
        fields: {
          where: {
            required: true,
            order: { gte: 0 },
          },
          select: { id: true, label: true },
        },
      },
    });

    if (!regForm || regForm.fields.length === 0) {
      return [];
    }

    const identityFieldLabels = new Set([
      'school name',
      'college name',
      'company name',
    ]);

    const requiredIdentityLabel =
      userCategory === 'SCHOOL_STUDENT'
        ? 'school name'
        : userCategory === 'WORKING_PROFESSIONAL'
          ? 'company name'
          : 'college name';

    const applicable: Array<{ id: string; label: string }> = [];
    for (const field of regForm.fields) {
      const labelLower = field.label.toLowerCase();
      if (
        identityFieldLabels.has(labelLower) &&
        labelLower !== requiredIdentityLabel
      ) {
        continue;
      }
      applicable.push({ id: field.id, label: field.label });
    }

    return applicable;
  }

  /**
   * Map frontend field IDs (e.g., "default-name") to database field IDs.
   * Creates default fields if they don't exist, similar to joinEvent flow.
   */
  private async mapFrontendFieldIdsToDbIds(
    eventId: string,
    userId: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ): Promise<Array<{ fieldId: string; value: string | number | string[] }>> {
    if (!answers || answers.length === 0) {
      return [];
    }

    // Fetch user's category to determine which default fields to create
    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
        select: { userCategory: true },
      });
    const userCategory = userOnboardingProfile?.userCategory;

    // Default gender options
    const DEFAULT_GENDER_OPTIONS = [
      'MALE',
      'FEMALE',
      'OTHER',
      'PREFER_NOT_TO_SAY',
    ];

    // Define default fields that should be lazy-created
    type DefaultFieldDef = {
      label: string;
      type: 'TEXT' | 'EMAIL' | 'PHONE_NO' | 'OPTIONS';
      order: number;
      required: boolean;
      options: string[];
      frontendId: string;
    };

    const defaultFieldDefs: DefaultFieldDef[] = [
      {
        frontendId: 'default-name',
        label: 'Name',
        type: 'TEXT',
        order: -50,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-email',
        label: 'Email',
        type: 'EMAIL',
        order: -40,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-phone',
        label: 'Phone No.',
        type: 'PHONE_NO',
        order: -30,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-gender',
        label: 'Gender',
        type: 'OPTIONS',
        order: -20,
        required: true,
        options: DEFAULT_GENDER_OPTIONS,
      },
    ];

    // Add conditional identity field based on userCategory
    if (userCategory === 'SCHOOL_STUDENT') {
      defaultFieldDefs.push({
        frontendId: 'default-school-name',
        label: 'School Name',
        type: 'TEXT',
        order: -10,
        required: true,
        options: [],
      });
    } else if (
      userCategory === 'COLLEGE_STUDENT' ||
      userCategory === 'PROFESSIONAL_SCHOOL_STUDENT' ||
      userCategory === 'FRESHER'
    ) {
      defaultFieldDefs.push({
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -9,
        required: true,
        options: [],
      });
    } else if (userCategory === 'WORKING_PROFESSIONAL') {
      defaultFieldDefs.push({
        frontendId: 'default-company-name',
        label: 'Company Name',
        type: 'TEXT',
        order: -8,
        required: false,
        options: [],
      });
    } else {
      // Fallback: if no category, ask for College Name
      defaultFieldDefs.push({
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -9,
        required: true,
        options: [],
      });
    }

    // Upsert registration form if missing
    let regForm = await prisma.eventRegistrationFormEntity.findUnique({
      where: { eventId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!regForm) {
      regForm = await prisma.eventRegistrationFormEntity.create({
        data: { eventId },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    const registrationFormId = regForm.id;

    // Build a map of existing fields by label for matching
    const existingFieldsByLabel = new Map<
      string,
      (typeof regForm.fields)[number]
    >(regForm.fields.map((f) => [f.label.toLowerCase(), f]));

    // Track used orders to avoid unique constraint violations
    const usedOrders = new Set(regForm.fields.map((f) => f.order));

    // Map frontend field IDs to real DB field IDs
    const frontendIdToDbId = new Map<string, string>();

    for (const def of defaultFieldDefs) {
      const existingField = existingFieldsByLabel.get(def.label.toLowerCase());

      if (existingField) {
        // Field already exists - map the frontend ID to the existing DB ID
        frontendIdToDbId.set(def.frontendId, existingField.id);

        // If it's the Gender field and options are empty, update with default options
        if (
          def.label.toLowerCase() === 'gender' &&
          existingField.type === 'OPTIONS' &&
          (!existingField.options || existingField.options.length === 0)
        ) {
          await prisma.eventRegistrationFieldEntity.update({
            where: { id: existingField.id },
            data: { options: DEFAULT_GENDER_OPTIONS },
          });
        }
      } else {
        // Field doesn't exist - create it
        let orderToUse = def.order;
        while (usedOrders.has(orderToUse)) {
          orderToUse -= 1;
        }
        usedOrders.add(orderToUse);

        try {
          const newField = await prisma.eventRegistrationFieldEntity.create({
            data: {
              registrationFormId,
              label: def.label,
              type: def.type,
              required: def.required,
              order: orderToUse,
              options: def.options,
            },
          });
          frontendIdToDbId.set(def.frontendId, newField.id);
        } catch (error: any) {
          // Handle race condition: if another request created the field concurrently,
          // refetch and use the existing field
          if (error?.code === 'P2002') {
            const refetchedForm =
              await prisma.eventRegistrationFormEntity.findUnique({
                where: { eventId },
                include: {
                  fields: {
                    orderBy: { order: 'asc' },
                  },
                },
              });
            const refetchedField = refetchedForm?.fields.find(
              (f) => f.label.toLowerCase() === def.label.toLowerCase(),
            );
            if (refetchedField) {
              frontendIdToDbId.set(def.frontendId, refetchedField.id);
            } else {
              // If still not found, try with a different order
              let retryOrder = orderToUse - 1;
              while (usedOrders.has(retryOrder)) {
                retryOrder -= 1;
              }
              const newField = await prisma.eventRegistrationFieldEntity.create(
                {
                  data: {
                    registrationFormId,
                    label: def.label,
                    type: def.type,
                    required: def.required,
                    order: retryOrder,
                    options: def.options,
                  },
                },
              );
              frontendIdToDbId.set(def.frontendId, newField.id);
            }
          } else {
            throw error;
          }
        }
      }
    }

    // Update existing field IDs for non-default fields (already in DB with real IDs)
    for (const existingField of regForm.fields) {
      if (!existingField.id.startsWith('default-')) {
        frontendIdToDbId.set(existingField.id, existingField.id);
      }
    }

    // Transform answers: replace frontend "default-*" IDs with real DB IDs
    const mappedAnswers = answers
      .map((a) => ({
        fieldId: frontendIdToDbId.get(a.fieldId) ?? a.fieldId,
        value: a.value,
      }))
      .filter((a) => {
        // If it still starts with 'default-', it means it wasn't in our mapping
        // (likely a field from a different user category that's no longer relevant)
        return !a.fieldId.startsWith('default-');
      });

    return mappedAnswers;
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
    const userRedemption = await prisma.eventDiscountRedemptionEntity.findFirst(
      {
        where: {
          discountCodeId: discountCode.id,
          userId,
        },
      },
    );

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
      where: { slug, isDeleted: false },
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
      where: { slug, isDeleted: false },
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
      chargedAmount: p.chargedAmount?.toString() ?? null,
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
      where: { slug: eventSlug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can create discount codes',
      );
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
      where: { slug: eventSlug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can view discount codes',
      );
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
      where: { slug: eventSlug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can delete discount codes',
      );
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
      where: { slug: eventSlug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the organizer can update discount codes',
      );
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
      feeBearer?: 'ORGANISER' | 'PARTICIPANT';
    },
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: eventSlug, isDeleted: false },
      select: {
        id: true,
        ownerId: true,
        status: true,
        registrationCount: true,
        isFree: true,
        entryFeeAmount: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can update pricing');
    }

    // Only allow base pricing changes (free vs paid, amount) in DRAFT status or if no registrations.
    // However, feeBearer can be toggled as it only affects the checkout calculation.
    const isBasePricingChanging =
      (params.isFree !== undefined && params.isFree !== event.isFree) ||
      (params.entryFeeAmount !== undefined &&
        Number(params.entryFeeAmount) !== Number(event.entryFeeAmount || 0));

    if (
      isBasePricingChanging &&
      event.status !== 'DRAFT' &&
      event.registrationCount > 0
    ) {
      throw new BadRequestException(
        'Cannot change base ticket price after registration has started. You can still toggle who bears the service charge.',
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

    if (params.feeBearer !== undefined) {
      updateData.feeBearer = params.feeBearer;
    }

    const updated = await prisma.eventEntity.update({
      where: { id: event.id },
      data: updateData,
      select: {
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        freeCollegeIds: true,
        feeBearer: true,
      },
    });

    return {
      isFree: updated.isFree,
      entryFeeAmount: updated.entryFeeAmount?.toString() ?? null,
      currency: updated.currency,
      freeCollegeIds: updated.freeCollegeIds,
      feeBearer: updated.feeBearer,
    };
  }
}
