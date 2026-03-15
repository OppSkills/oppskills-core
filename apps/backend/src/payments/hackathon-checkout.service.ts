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
import { Decimal } from '@prisma/client/runtime/library';
import { Logger } from 'src/_utils/logger';

const PLATFORM_FEE_PERCENT = 2;

@Injectable()
export class HackathonCheckoutService {
  private readonly logger = new Logger(HackathonCheckoutService.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paymentsRouteService: PaymentsRouteService,
    private readonly draftTeamService: DraftTeamService,
  ) {}

  async createPaymentOrder(params: {
    hackathonSlug: string;
    userId: string;
    teamId?: string;
    teamName?: string;
    maxSize?: number;
    discountCode?: string;
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
            throw new BadRequestException(
              'Payment already completed for this team',
            );
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

        // Check for existing payment with CREATED/FAILED status for this user (without teamId)
        // This handles retry scenario
        const existingUserPayment =
          await prisma.hackathonPaymentEntity.findFirst({
            where: {
              scope: HackathonPaymentScope.TEAM,
              hackathonId: hackathon.id,
              payerUserId: params.userId,
              teamId: null, // Payment created before team was created
              paymentStatus: {
                in: [
                  HackathonPaymentStatus.CREATED,
                  HackathonPaymentStatus.FAILED,
                ],
              },
            },
          });

        if (existingUserPayment) {
          // Will update this payment record later
          // teamId will be set after team creation
        }

        // teamId will be null - team will be created after payment
        teamId = null;
      } else {
        throw new BadRequestException(
          'Either teamId (for existing team) or teamName (for new team) is required for per-team payment',
        );
      }
    } else {
      // Check for existing payment - allow retry if previous payment was cancelled/failed
      const existingPayment = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          scope: HackathonPaymentScope.USER,
          hackathonId: hackathon.id,
          payerUserId: params.userId,
        },
      });

      if (existingPayment) {
        if (
          existingPayment.paymentStatus === HackathonPaymentStatus.CAPTURED ||
          existingPayment.paymentStatus === HackathonPaymentStatus.AUTHORIZED
        ) {
          throw new BadRequestException('Payment already completed');
        }
        // If payment exists with CREATED/FAILED status, we'll update it instead of creating new one
        // This handles the unique constraint and allows payment retries
      }
    }

    const isEligibleForFreeEntry = await this.checkFreeCollegeEligibility(
      hackathon.freeCollegeIds,
      leaderUserId,
    );

    if (isEligibleForFreeEntry) {
      // Check if payment already exists (for retry scenario)
      const existingFreePayment = await prisma.hackathonPaymentEntity.findFirst(
        {
          where: {
            scope,
            hackathonId: hackathon.id,
            ...(scope === HackathonPaymentScope.TEAM
              ? { teamId: teamId! }
              : { payerUserId: params.userId }),
          },
        },
      );

      let payment;
      if (existingFreePayment) {
        // Update existing payment record
        payment = await prisma.hackathonPaymentEntity.update({
          where: { id: existingFreePayment.id },
          data: {
            razorpayOrderId: `free_college_${hackathon.id}_${Date.now()}`,
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: HackathonPaymentOrderStatus.PAID,
            paymentStatus: HackathonPaymentStatus.CAPTURED,
            discountCodeId: null,
            discountAmount: null,
            razorpayPaymentId: null,
            razorpaySignature: null,
          },
        });
      } else {
        // Create new payment record
        payment = await prisma.hackathonPaymentEntity.create({
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
      }

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

    let grossAmount = new Decimal(hackathon.entryFeeAmount);
    let discountAmount = new Decimal(0);
    let discountCodeId: string | null = null;

    if (params.discountCode) {
      const discount = await this.applyDiscountCode(
        hackathon.id,
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

    if (grossAmountPaise === 0) {
      // Check if payment already exists (for retry scenario)
      const existingZeroPayment = await prisma.hackathonPaymentEntity.findFirst(
        {
          where: {
            scope,
            hackathonId: hackathon.id,
            ...(scope === HackathonPaymentScope.TEAM && teamId
              ? { teamId }
              : scope === HackathonPaymentScope.TEAM && !teamId
                ? { payerUserId: params.userId, teamId: null }
                : { payerUserId: params.userId }),
          },
        },
      );

      let payment;
      if (existingZeroPayment) {
        // Update existing payment record
        payment = await prisma.hackathonPaymentEntity.update({
          where: { id: existingZeroPayment.id },
          data: {
            razorpayOrderId: `free_${hackathon.id}_${Date.now()}`,
            grossAmount: new Decimal(0),
            platformFeeAmount: new Decimal(0),
            organizerShareAmount: new Decimal(0),
            transferOnHold: false,
            transferOnHoldUntil: null,
            orderStatus: HackathonPaymentOrderStatus.PAID,
            paymentStatus: HackathonPaymentStatus.CAPTURED,
            discountCodeId,
            discountAmount: discountAmount.greaterThan(0)
              ? discountAmount
              : null,
            razorpayPaymentId: null,
            razorpaySignature: null,
          },
        });
      } else {
        // Create new payment record
        payment = await prisma.hackathonPaymentEntity.create({
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
      }

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

    const razorpayOrder = await this.razorpayService.createOrder({
      amountPaise: grossAmountPaise,
      currency: hackathon.currency || 'INR',
      receipt: `hck_${hackathon.id.slice(-8)}_${Date.now()}`,
      notes: orderNotes,
    });

    // Check if payment record exists with CREATED/FAILED status (for retry scenario)
    const existingPayment = await prisma.hackathonPaymentEntity.findFirst({
      where: {
        scope,
        hackathonId: hackathon.id,
        ...(scope === HackathonPaymentScope.TEAM && teamId
          ? { teamId }
          : scope === HackathonPaymentScope.TEAM && !teamId
            ? { payerUserId: params.userId, teamId: null }
            : { payerUserId: params.userId }),
        paymentStatus: {
          in: [HackathonPaymentStatus.CREATED, HackathonPaymentStatus.FAILED],
        },
      },
    });

    let payment;
    if (existingPayment) {
      // Update existing payment record instead of creating new one (handles unique constraint)
      payment = await prisma.hackathonPaymentEntity.update({
        where: { id: existingPayment.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          grossAmount,
          platformFeeAmount: totalDeduction, // Total deduction includes Platform Fee + GST
          organizerShareAmount,
          orderStatus: HackathonPaymentOrderStatus.CREATED,
          paymentStatus: HackathonPaymentStatus.CREATED,
          discountCodeId,
          discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
          razorpayPaymentId: null, // Clear previous payment ID
          razorpaySignature: null, // Clear previous signature
          failedAt: null, // Clear failed timestamp if retrying
        },
      });
    } else {
      // Create new payment record
      payment = await prisma.hackathonPaymentEntity.create({
        data: {
          scope,
          hackathonId: hackathon.id,
          organizerId: hackathon.ownerId,
          payerUserId: params.userId,
          teamId,
          currency: hackathon.currency || 'INR',
          grossAmount,
          platformFeeAmount: totalDeduction, // Total deduction includes Platform Fee + GST
          organizerShareAmount,
          razorpayOrderId: razorpayOrder.id,
          transferOnHold: false,
          transferOnHoldUntil: null,
          orderStatus: HackathonPaymentOrderStatus.CREATED,
          paymentStatus: HackathonPaymentStatus.CREATED,
          discountCodeId,
          discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
        },
      });
    }

    return {
      paymentId: payment.id,
      razorpayKeyId: this.razorpayService.getKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amountPaise: grossAmountPaise,
      currency: hackathon.currency || 'INR',
      hackathonName: hackathon.name,
    };
  }

  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    userId: string;
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

    // Layer 1 — pre-check: if the webhook already captured this payment, return
    // idempotently rather than downgrading CAPTURED → AUTHORIZED.
    if (payment.paymentStatus === HackathonPaymentStatus.CAPTURED) {
      this.logger.log(
        `Hackathon payment already captured (pre-check) for order: ${params.razorpayOrderId}`,
      );
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
        return {
          success: true,
          paymentId: payment.id,
          teamId: refreshed?.teamId ?? finalTeamId,
        };
      }
      throw error;
    }

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
