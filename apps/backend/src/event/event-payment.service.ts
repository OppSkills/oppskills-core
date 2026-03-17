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
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isFree) {
      throw new BadRequestException('This event is free, no payment required');
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

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.maxUsers !== null && event.registrationCount >= event.maxUsers) {
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
      throw new BadRequestException(
        'You are already registered for this event',
      );
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

    // When participant bears the fee, add the processing fee (2% + 18% GST = 2.36%) on top.
    const baseAmountBeforeProcessingFee = grossAmount;
    let processingFeeAmount = new Decimal(0);
    if (event.feeBearer === 'PARTICIPANT' && grossAmount.greaterThan(0)) {
      processingFeeAmount = grossAmount
        .times('0.0236')
        .toDecimalPlaces(2, Decimal.ROUND_UP);
      grossAmount = grossAmount.plus(processingFeeAmount);
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
            discountAmount: discountAmount.greaterThan(0)
              ? discountAmount
              : null,
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
            discountAmount: discountAmount.greaterThan(0)
              ? discountAmount
              : null,
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
      finalAmount: Number(baseAmountBeforeProcessingFee),
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
   * Verify Razorpay payment and create event participant.
   * This method is idempotent - safe to call multiple times or concurrently with webhook.
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
      params.answers || [],
    );

    // Check for existing participant (might have been created by webhook)
    const existingParticipant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: {
          eventId: payment.event.id,
          userId: params.userId,
        },
      },
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

          return { participantId: participantCheck.id, alreadyExisted: true };
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

        return { participantId: participant.id, alreadyExisted: false };
      });

      // Emit event for pass email sending (only if we created the participant)
      if (!result.alreadyExisted) {
        this.eventEmitter.emit('event.participant.registered', {
          eventId: payment.event.id,
          userId: params.userId,
          participantId: result.participantId,
          passSendingMode: payment.event.passSendingMode,
        });
      }

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
      // Answers already saved
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
