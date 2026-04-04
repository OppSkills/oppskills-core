import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  prisma,
  HackathonChargeMode,
  HackathonPaymentScope,
  HackathonPaymentStatus,
  HackathonPaymentOrderStatus,
} from '@oppskills/db';
import { RazorpayService } from './razorpay.service';
import { PaymentsRouteService } from './payments-route.service';
import { DraftTeamService } from './draft-team.service';
import { RegistrationSubmitService } from './registration-submit.service';
import { PaymentRegistrationEscrowService } from './payment-registration-escrow.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Logger } from 'src/_utils/logger';
import { computeRazorpayGatewayFee } from './payment-gateway-fee.util';

@Injectable()
export class HackathonCheckoutService {
  private readonly logger = new Logger(HackathonCheckoutService.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paymentsRouteService: PaymentsRouteService,
    private readonly draftTeamService: DraftTeamService,
    private readonly registrationSubmitService: RegistrationSubmitService,
    private readonly paymentEscrowService: PaymentRegistrationEscrowService,
  ) {}

  async createPaymentOrder(params: {
    hackathonSlug: string;
    userId: string;
    teamId?: string;
    teamName?: string;
    maxSize?: number;
    discountCode?: string;
    /** Stored on Razorpay order notes for PER_USER join + server-side registration completion */
    invitationCode?: string;
    joinTeamId?: string;
    /** Escrowed server-side for verify/webhook when client omits answers */
    answers?: Array<{ fieldId: string; value: string }>;
  }) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        name: true,
        isFree: true,
        freeCollegeIds: true,
        entryFeeAmount: true,
        currency: true,
        chargeMode: true,
        feeBearer: true,
        registrationDeadline: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        ownerId: true,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.isFree) {
      throw new BadRequestException(
        'This hackathon is free, no payment required',
      );
    }

    if (!hackathon.entryFeeAmount) {
      throw new BadRequestException('Entry fee not configured');
    }

    if (!hackathon.registrationDeadline) {
      throw new BadRequestException(
        'Registration deadline required for paid hackathons',
      );
    }

    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException('Registration is not open');
    }

    if (hackathon.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Hackathon is not approved');
    }

    if (hackathon.isRegistrationPaused) {
      throw new BadRequestException('Registration is paused');
    }

    if (new Date() > hackathon.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    const chargeMode = hackathon.chargeMode || HackathonChargeMode.PER_TEAM;
    const scope =
      chargeMode === HackathonChargeMode.PER_TEAM
        ? HackathonPaymentScope.TEAM
        : HackathonPaymentScope.USER;

    let teamId: string | null = null;
    let leaderUserId: string = params.userId;

    if (scope === HackathonPaymentScope.TEAM) {
      // For PER_TEAM, we can accept either teamId (existing team) or teamName (new team)
      // If teamName is provided, we'll create team after payment verification
      if (params.teamId) {
        // Existing team - validate it
        const team = await prisma.teamEntity.findUnique({
          where: { id: params.teamId },
          select: { id: true, hackathonId: true, leaderId: true },
        });

        if (!team) {
          throw new NotFoundException('Team not found');
        }

        if (team.hackathonId !== hackathon.id) {
          throw new BadRequestException(
            'Team does not belong to this hackathon',
          );
        }

        if (team.leaderId !== params.userId) {
          throw new ForbiddenException('Only team leader can initiate payment');
        }

        leaderUserId = team.leaderId;

        // Check for existing payment - allow retry if previous payment was cancelled/failed
        const existingTeamPayment =
          await prisma.hackathonPaymentEntity.findFirst({
            where: {
              scope: HackathonPaymentScope.TEAM,
              hackathonId: hackathon.id,
              teamId: params.teamId,
            },
          });

        if (existingTeamPayment) {
          if (
            existingTeamPayment.paymentStatus ===
              HackathonPaymentStatus.CAPTURED ||
            existingTeamPayment.paymentStatus ===
              HackathonPaymentStatus.AUTHORIZED
          ) {
            return {
              paymentId: existingTeamPayment.id,
              razorpayKeyId: null,
              razorpayOrderId: null,
              amountPaise: 0,
              currency: hackathon.currency || 'INR',
              hackathonName: hackathon.name,
              zeroAmountPayment: true,
              teamId: existingTeamPayment.teamId ?? params.teamId,
              alreadyPaid: true,
            };
          }
          // If payment exists with CREATED/FAILED status, we'll update it instead of creating new one
        }

        teamId = params.teamId;
      } else if (params.teamName) {
        // New team - validate user can create team, but don't create it yet
        // Team will be created after payment verification
        // Check if user already has a team for this hackathon
        const existingTeam = await prisma.teamEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            OR: [
              { leaderId: params.userId },
              { members: { some: { userId: params.userId } } },
            ],
          },
        });

        if (existingTeam) {
          throw new BadRequestException(
            'You are already in a team for this hackathon',
          );
        }

        // teamId will be null - team will be created after payment
        teamId = null;
      } else {
        throw new BadRequestException(
          'Either teamId (for existing team) or teamName (for new team) is required for per-team payment',
        );
      }
    } else {
      const successfulUserPayment =
        await prisma.hackathonPaymentEntity.findFirst({
          where: {
            scope: HackathonPaymentScope.USER,
            hackathonId: hackathon.id,
            payerUserId: params.userId,
            paymentStatus: {
              in: [
                HackathonPaymentStatus.CAPTURED,
                HackathonPaymentStatus.AUTHORIZED,
              ],
            },
          },
        });

      if (successfulUserPayment) {
        return {
          paymentId: successfulUserPayment.id,
          razorpayKeyId: null,
          razorpayOrderId: null,
          amountPaise: 0,
          currency: hackathon.currency || 'INR',
          hackathonName: hackathon.name,
          zeroAmountPayment: true,
          teamId: successfulUserPayment.teamId ?? null,
          alreadyPaid: true,
        };
      }
    }

    const isEligibleForFreeEntry = await this.checkFreeCollegeEligibility(
      hackathon.freeCollegeIds,
      leaderUserId,
    );

    if (isEligibleForFreeEntry) {
      const payment = await prisma.hackathonPaymentEntity.create({
        data: {
          scope,
          hackathonId: hackathon.id,
          organizerId: hackathon.ownerId,
          payerUserId: params.userId,
          teamId,
          currency: hackathon.currency || 'INR',
          grossAmount: new Decimal(0),
          platformFeeAmount: new Decimal(0),
          organizerShareAmount: new Decimal(0),
          razorpayOrderId: `free_college_${hackathon.id}_${Date.now()}`,
          transferOnHold: false,
          transferOnHoldUntil: null,
          orderStatus: HackathonPaymentOrderStatus.PAID,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
          discountCodeId: null,
          discountAmount: null,
        },
      });

      // For PER_TEAM with teamName, create team now (payment is already CAPTURED)
      let createdTeamId = payment.teamId;
      if (
        scope === HackathonPaymentScope.TEAM &&
        !payment.teamId &&
        params.teamName
      ) {
        const draftTeam = await this.draftTeamService.createDraftTeam({
          hackathonSlug: hackathon.slug,
          name: params.teamName,
          maxSize: params.maxSize,
          leaderId: params.userId,
        });
        createdTeamId = draftTeam.team.id;

        // Update payment with teamId
        await prisma.hackathonPaymentEntity.update({
          where: { id: payment.id },
          data: { teamId: createdTeamId },
        });
      }

      return {
        paymentId: payment.id,
        razorpayKeyId: null,
        razorpayOrderId: null,
        amount: 0,
        currency: hackathon.currency || 'INR',
        zeroAmountPayment: true,
        freeCollegeEligible: true,
        teamId: createdTeamId, // Return teamId if team was created
      };
    }

    let registrationFee = new Decimal(hackathon.entryFeeAmount);
    let discountAmount = new Decimal(0);
    let discountCodeId: string | null = null;

    if (params.discountCode) {
      const discount = await this.applyDiscountCode(
        hackathon.id,
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
    if (
      hackathon.feeBearer === 'PARTICIPANT' &&
      registrationFee.greaterThan(0)
    ) {
      chargeAmount = registrationFee.plus(gatewayFee);
      organizerShareAmount = registrationFee;
    } else {
      chargeAmount = registrationFee;
      organizerShareAmount = registrationFee.minus(gatewayFee);
    }

    const grossAmountPaise = chargeAmount.times(100).toNumber();

    if (grossAmountPaise === 0) {
      const payment = await prisma.hackathonPaymentEntity.create({
        data: {
          scope,
          hackathonId: hackathon.id,
          organizerId: hackathon.ownerId,
          payerUserId: params.userId,
          teamId,
          currency: hackathon.currency || 'INR',
          grossAmount: new Decimal(0),
          platformFeeAmount: new Decimal(0),
          organizerShareAmount: new Decimal(0),
          razorpayOrderId: `free_${hackathon.id}_${Date.now()}`,
          transferOnHold: false,
          transferOnHoldUntil: null,
          orderStatus: HackathonPaymentOrderStatus.PAID,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
          discountCodeId,
          discountAmount: discountAmount.greaterThan(0)
            ? discountAmount
            : null,
        },
      });

      // For PER_TEAM with teamName, create team now (payment is already CAPTURED)
      let createdTeamId = payment.teamId;
      if (
        scope === HackathonPaymentScope.TEAM &&
        !payment.teamId &&
        params.teamName
      ) {
        const draftTeam = await this.draftTeamService.createDraftTeam({
          hackathonSlug: hackathon.slug,
          name: params.teamName,
          maxSize: params.maxSize,
          leaderId: params.userId,
        });
        createdTeamId = draftTeam.team.id;

        // Update payment with teamId
        await prisma.hackathonPaymentEntity.update({
          where: { id: payment.id },
          data: { teamId: createdTeamId },
        });
      }

      return {
        paymentId: payment.id,
        razorpayKeyId: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: hackathon.currency || 'INR',
        hackathonName: hackathon.name,
        zeroAmountPayment: true,
        teamId: createdTeamId, // Return teamId if team was created
      };
    }

    // Store teamName and maxSize in Razorpay order notes if provided (for PER_TEAM new team creation)
    const orderNotes: Record<string, string> = {
      hackathonId: hackathon.id,
      hackathonSlug: hackathon.slug,
      payerUserId: params.userId,
      teamId: teamId || '',
      scope,
    };
    if (params.teamName) {
      orderNotes.teamName = params.teamName;
    }
    if (params.maxSize) {
      orderNotes.maxSize = String(params.maxSize);
    }
    if (params.invitationCode) {
      orderNotes.invitationCode = params.invitationCode;
    }
    if (params.joinTeamId) {
      orderNotes.joinTeamId = params.joinTeamId;
    }

    const razorpayOrder = await this.razorpayService.createOrder({
      amountPaise: grossAmountPaise,
      currency: hackathon.currency || 'INR',
      receipt: `hck_${hackathon.id.slice(-8)}_${Date.now()}`,
      notes: orderNotes,
    });

    const payment = await prisma.hackathonPaymentEntity.create({
      data: {
        scope,
        hackathonId: hackathon.id,
        organizerId: hackathon.ownerId,
        payerUserId: params.userId,
        teamId,
        currency: hackathon.currency || 'INR',
        grossAmount: registrationFee,
        platformFeeAmount: gatewayFee,
        organizerShareAmount,
        chargedAmount: chargeAmount,
        razorpayOrderId: razorpayOrder.id,
        transferOnHold: false,
        transferOnHoldUntil: null,
        orderStatus: HackathonPaymentOrderStatus.CREATED,
        paymentStatus: HackathonPaymentStatus.CREATED,
        discountCodeId,
        discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
      },
    });

    await this.paymentEscrowService.upsertHackathonEscrow({
      razorpayOrderId: razorpayOrder.id,
      payerUserId: params.userId,
      hackathonId: hackathon.id,
      answers: params.answers ?? [],
    });

    return {
      paymentId: payment.id,
      razorpayKeyId: this.razorpayService.getKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amountPaise: grossAmountPaise,
      currency: hackathon.currency || 'INR',
      hackathonName: hackathon.name,
      baseAmount: Number(registrationFee),
      processingFeeAmount:
        hackathon.feeBearer === 'PARTICIPANT' && gatewayFee.greaterThan(0)
          ? Number(gatewayFee)
          : undefined,
      feeBearer: hackathon.feeBearer,
    };
  }

  /**
   * Best-effort match for race where webhook/verify already created the team.
   */
  private isBenignTeamAlreadyExistsError(err: unknown): boolean {
    const msg =
      err instanceof Error
        ? err.message.toLowerCase()
        : String(err).toLowerCase();
    return (
      msg.includes('already in a team') ||
      msg.includes('already the leader of this team') ||
      msg.includes('already a member of this team')
    );
  }

  /**
   * After payment is CAPTURED, ensure PER_USER users have a team then save registration answers.
   * Answers are bundled with verify so a single successful request persists both payment and form.
   */
  private async submitRegistrationAnswersAfterPaymentIfProvided(params: {
    paymentId: string;
    hackathonId: string;
    hackathonSlug: string;
    userId: string;
    razorpayOrderId: string;
    answers?: Array<{ fieldId: string; value: string }>;
  }): Promise<void> {
    const { answers, userId, hackathonSlug, razorpayOrderId, paymentId } =
      params;
    if (!answers?.length) {
      const form = await prisma.registrationFormEntity.findUnique({
        where: { hackathonId: params.hackathonId },
        select: { fields: { select: { id: true } } },
      });
      if (form?.fields?.length) {
        this.logger.warn(
          `verifyPayment: no registration answers for hackathon ${params.hackathonSlug} (paymentId=${paymentId}, order=${razorpayOrderId}) but form has ${form.fields.length} field(s) — answers will not be saved`,
        );
      }
      return;
    }

    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: params.hackathonId, isDeleted: false },
      select: { id: true, chargeMode: true },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const chargeMode = hackathon.chargeMode || HackathonChargeMode.PER_TEAM;

    const status =
      await this.registrationSubmitService.getRegistrationStatus(
        hackathonSlug,
        userId,
      );
    if (status.hasSubmitted) {
      this.logger.log(
        `Registration already submitted for user ${userId} hackathon ${hackathonSlug}; skipping bundled submit`,
      );
      return;
    }

    if (chargeMode === HackathonChargeMode.PER_USER) {
      const hasTeam =
        status.hasTeam ||
        (await prisma.teamEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            OR: [{ leaderId: userId }, { members: { some: { userId } } }],
          },
          select: { id: true },
        }));

      if (!hasTeam) {
        const razorpayOrder =
          await this.razorpayService.fetchOrder(razorpayOrderId);
        const notes = razorpayOrder.notes || {};
        const joinTeamId = notes.joinTeamId?.trim();
        const invitationRaw = notes.invitationCode?.trim();
        const teamName = notes.teamName?.trim();
        const maxSize = notes.maxSize
          ? parseInt(notes.maxSize, 10)
          : undefined;

        if (joinTeamId) {
          try {
            await this.draftTeamService.joinDraftTeam({
              teamId: joinTeamId,
              userId,
            });
          } catch (err) {
            if (!this.isBenignTeamAlreadyExistsError(err)) {
              throw err;
            }
          }
        } else if (invitationRaw) {
          try {
            await this.draftTeamService.joinDraftTeam({
              invitationCode: invitationRaw.toUpperCase(),
              userId,
            });
          } catch (err) {
            if (!this.isBenignTeamAlreadyExistsError(err)) {
              throw err;
            }
          }
        } else if (teamName) {
          try {
            await this.draftTeamService.createDraftTeam({
              hackathonSlug,
              name: teamName,
              maxSize,
              leaderId: userId,
            });
          } catch (err) {
            if (!this.isBenignTeamAlreadyExistsError(err)) {
              throw err;
            }
          }
        } else {
          this.logger.warn(
            `Bundled registration: no teamName/invitationCode on Razorpay order ${razorpayOrderId} for payment ${paymentId}; client must pass team context in order notes`,
          );
          throw new BadRequestException(
            'Could not complete registration: team context missing. Please open Register again to finish — you will not be charged twice.',
          );
        }
      }
    }

    try {
      await this.registrationSubmitService.submitRegistration({
        hackathonSlug,
        userId,
        answers,
      });
      await this.paymentEscrowService.deleteByRazorpayOrderId(razorpayOrderId);
    } catch (err) {
      if (
        err instanceof BadRequestException &&
        err.message.includes('already submitted')
      ) {
        await this.paymentEscrowService.deleteByRazorpayOrderId(razorpayOrderId);
        return;
      }
      throw err;
    }
  }

  /**
   * Called from Razorpay webhook after capture: if client never called verify with answers,
   * submit from server escrow (when present).
   */
  async trySubmitRegistrationFromEscrowAfterWebhook(
    razorpayOrderId: string,
  ): Promise<void> {
    const payment = await prisma.hackathonPaymentEntity.findUnique({
      where: { razorpayOrderId },
      include: {
        hackathon: { select: { slug: true } },
      },
    });
    if (!payment || payment.paymentStatus !== HackathonPaymentStatus.CAPTURED) {
      return;
    }
    const answers = await this.paymentEscrowService.loadAnswersForVerify(
      razorpayOrderId,
      payment.payerUserId,
    );
    if (!answers?.length) {
      return;
    }
    try {
      await this.submitRegistrationAnswersAfterPaymentIfProvided({
        paymentId: payment.id,
        hackathonId: payment.hackathonId,
        hackathonSlug: payment.hackathon.slug,
        userId: payment.payerUserId,
        razorpayOrderId,
        answers,
      });
    } catch (err) {
      this.logger.warn(
        `Escrow submit after webhook failed for order ${razorpayOrderId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async resolveMergedAnswersForVerify(
    razorpayOrderId: string,
    userId: string,
    bodyAnswers?: Array<{ fieldId: string; value: string }>,
  ): Promise<Array<{ fieldId: string; value: string }> | undefined> {
    if (bodyAnswers?.length) {
      return bodyAnswers;
    }
    const fromEscrow = await this.paymentEscrowService.loadAnswersForVerify(
      razorpayOrderId,
      userId,
    );
    if (fromEscrow?.length) {
      this.logger.log(
        `verifyPayment: using server-escrowed registration answers for order ${razorpayOrderId} (${fromEscrow.length} fields)`,
      );
      return fromEscrow;
    }
    return undefined;
  }

  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    userId: string;
    answers?: Array<{ fieldId: string; value: string }>;
  }) {
    const payment = await prisma.hackathonPaymentEntity.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: {
        hackathon: {
          select: { slug: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerUserId !== params.userId) {
      throw new ForbiddenException('Payment does not belong to this user');
    }

    const mergedAnswers = await this.resolveMergedAnswersForVerify(
      params.razorpayOrderId,
      params.userId,
      params.answers,
    );

    // Layer 1 — pre-check: if the webhook already captured this payment, return
    // idempotently rather than downgrading CAPTURED → AUTHORIZED.
    if (payment.paymentStatus === HackathonPaymentStatus.CAPTURED) {
      this.logger.log(
        `Hackathon payment already captured (pre-check) for order: ${params.razorpayOrderId}`,
      );
      await this.submitRegistrationAnswersAfterPaymentIfProvided({
        paymentId: payment.id,
        hackathonId: payment.hackathonId,
        hackathonSlug: payment.hackathon.slug,
        userId: params.userId,
        razorpayOrderId: params.razorpayOrderId,
        answers: mergedAnswers,
      });
      return { success: true, paymentId: payment.id, teamId: payment.teamId };
    }

    // Verify signature only when not already CAPTURED.
    const isValid = this.razorpayService.verifyCheckoutSignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // For PER_TEAM mode with no existing teamId, create the team now.
    // Team creation intentionally happens OUTSIDE the transaction so that
    // DraftTeamService validations (capacity, duplicate-team check) run
    // before we lock payment rows.
    let finalTeamId = payment.teamId;
    if (payment.scope === HackathonPaymentScope.TEAM && !payment.teamId) {
      const razorpayOrder = await this.razorpayService.fetchOrder(
        params.razorpayOrderId,
      );
      const teamName = razorpayOrder.notes?.teamName;
      const maxSize = razorpayOrder.notes?.maxSize
        ? parseInt(razorpayOrder.notes.maxSize, 10)
        : undefined;

      if (teamName) {
        try {
          const draftTeam = await this.draftTeamService.createDraftTeam({
            hackathonSlug: payment.hackathon.slug,
            name: teamName,
            maxSize,
            leaderId: params.userId,
          });
          finalTeamId = draftTeam.team.id;
        } catch (err: any) {
          // If the webhook raced us and already created the team, look it up.
          if (
            err?.message?.includes('already in a team') ||
            err?.status === 400
          ) {
            const existingTeam = await prisma.teamEntity.findFirst({
              where: {
                hackathonId: payment.hackathonId,
                OR: [
                  { leaderId: params.userId },
                  { members: { some: { userId: params.userId } } },
                ],
              },
              select: { id: true },
            });
            if (existingTeam) {
              finalTeamId = existingTeam.id;
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    }

    // Layer 2 — in-transaction re-check + atomic status update.
    try {
      await prisma.$transaction(async (tx) => {
        // Re-read inside the transaction: webhook may have set CAPTURED between
        // our outer read and now.
        const current = await tx.hackathonPaymentEntity.findUnique({
          where: { id: payment.id },
          select: { paymentStatus: true, teamId: true },
        });

        if (current?.paymentStatus === HackathonPaymentStatus.CAPTURED) {
          this.logger.log(
            `Hackathon payment already captured (in-tx re-check) for order: ${params.razorpayOrderId}`,
          );
          // Ensure teamId is persisted even if webhook missed it.
          if (!current.teamId && finalTeamId) {
            await tx.hackathonPaymentEntity.update({
              where: { id: payment.id },
              data: { teamId: finalTeamId },
            });
          }
          return;
        }

        await tx.hackathonPaymentEntity.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: params.razorpayPaymentId,
            razorpaySignature: params.razorpaySignature,
            paymentStatus: HackathonPaymentStatus.CAPTURED,
            orderStatus: HackathonPaymentOrderStatus.PAID,
            capturedAt: new Date(),
            teamId: finalTeamId,
          },
        });

        // Record discount redemption atomically so it is always written even
        // if the Razorpay webhook never fires.
        if (payment.discountCodeId) {
          try {
            await tx.hackathonDiscountRedemptionEntity.create({
              data: {
                discountCodeId: payment.discountCodeId,
                userId: params.userId,
                paymentId: payment.id,
              },
            });
          } catch (discountErr: any) {
            // Ignore duplicate — webhook may have already recorded it.
            if (discountErr?.code !== 'P2002') {
              throw discountErr;
            }
          }
        }
      });
    } catch (error: any) {
      // Layer 3 — P2002 outer catch: the webhook may have concurrently written
      // the same unique-constrained rows (e.g. discount redemption). Re-fetch
      // the current teamId and return success.
      if (error?.code === 'P2002') {
        this.logger.warn(
          `Race condition handled in hackathon verifyPayment for order: ${params.razorpayOrderId}`,
        );
        const refreshed = await prisma.hackathonPaymentEntity.findUnique({
          where: { id: payment.id },
          select: { teamId: true },
        });
        await this.submitRegistrationAnswersAfterPaymentIfProvided({
          paymentId: payment.id,
          hackathonId: payment.hackathonId,
          hackathonSlug: payment.hackathon.slug,
          userId: params.userId,
          razorpayOrderId: params.razorpayOrderId,
          answers: mergedAnswers,
        });
        return {
          success: true,
          paymentId: payment.id,
          teamId: refreshed?.teamId ?? finalTeamId,
        };
      }
      throw error;
    }

    await this.submitRegistrationAnswersAfterPaymentIfProvided({
      paymentId: payment.id,
      hackathonId: payment.hackathonId,
      hackathonSlug: payment.hackathon.slug,
      userId: params.userId,
      razorpayOrderId: params.razorpayOrderId,
      answers: mergedAnswers,
    });

    return { success: true, paymentId: payment.id, teamId: finalTeamId };
  }

  private async applyDiscountCode(
    hackathonId: string,
    userId: string,
    code: string,
    originalAmount: Decimal,
  ): Promise<{ discountAmount: Decimal; discountCodeId: string }> {
    const discountCode = await prisma.hackathonDiscountCodeEntity.findFirst({
      where: {
        hackathonId,
        code: code.toUpperCase(),
        active: true,
      },
    });

    if (!discountCode) {
      throw new BadRequestException('Invalid discount code');
    }

    if (discountCode.maxRedemptions) {
      const redemptionCount =
        await prisma.hackathonDiscountRedemptionEntity.count({
          where: { discountCodeId: discountCode.id },
        });
      if (redemptionCount >= discountCode.maxRedemptions) {
        throw new BadRequestException(
          'Discount code has reached maximum redemptions',
        );
      }
    }

    const userRedemption =
      await prisma.hackathonDiscountRedemptionEntity.findFirst({
        where: {
          discountCodeId: discountCode.id,
          userId,
        },
      });

    if (userRedemption) {
      throw new BadRequestException('You have already used this discount code');
    }

    let discountAmount: Decimal;
    if (discountCode.type === 'PERCENT') {
      discountAmount = originalAmount
        .times(discountCode.value)
        .dividedBy(100)
        .toDecimalPlaces(2);
    } else {
      discountAmount = new Decimal(discountCode.value);
    }

    if (discountAmount.greaterThan(originalAmount)) {
      discountAmount = originalAmount;
    }

    return {
      discountAmount,
      discountCodeId: discountCode.id,
    };
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.hackathonPaymentEntity.findUnique({
      where: { id: paymentId },
      include: {
        hackathon: { select: { name: true, slug: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerUserId !== userId && payment.organizerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: payment.id,
      scope: payment.scope,
      hackathon: payment.hackathon,
      grossAmount: payment.grossAmount,
      chargedAmount: payment.chargedAmount,
      platformFeeAmount: payment.platformFeeAmount,
      organizerShareAmount: payment.organizerShareAmount,
      discountAmount: payment.discountAmount,
      orderStatus: payment.orderStatus,
      paymentStatus: payment.paymentStatus,
      capturedAt: payment.capturedAt,
      refundStatus: payment.refundStatus,
      refundedAt: payment.refundedAt,
    };
  }

  async getOrganizerEarnings(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        ownerId: true,
        name: true,
        registrationDeadline: true,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can view earnings');
    }

    const payments = await prisma.hackathonPaymentEntity.findMany({
      where: {
        hackathonId: hackathon.id,
        paymentStatus: {
          in: [
            HackathonPaymentStatus.AUTHORIZED,
            HackathonPaymentStatus.CAPTURED,
          ],
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

    const payouts = await prisma.hackathonPayoutEntity.findMany({
      where: {
        hackathonId: hackathon.id,
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

    const eligibleAt = hackathon.registrationDeadline;
    const isEligibleNow = eligibleAt ? new Date() >= eligibleAt : false;

    return {
      hackathonId: hackathon.id,
      hackathonName: hackathon.name,
      totalPayments: payments.length,
      totalGross: totalGross.toString(),
      totalPlatformFee: totalPlatformFee.toString(),
      totalOrganizerShare: totalOrganizerShare.toString(),
      totalRefunded: totalRefunded.toString(),
      netEarnings: netEarnings.toString(),
      paidOut: paidOut.toString(),
      pendingPayout: pendingPayout.toString(),
      eligibleAt,
      isEligibleNow,
    };
  }

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

  async getHackathonPayments(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.ownerId !== userId) {
      throw new ForbiddenException('Only the organizer can view payments');
    }

    const payments = await prisma.hackathonPaymentEntity.findMany({
      where: { hackathonId: hackathon.id },
      include: {
        payerUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      scope: p.scope,
      payer: p.payerUser,
      team: p.team,
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
}
