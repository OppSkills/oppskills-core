import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  prisma,
  HackathonChargeMode,
  HackathonPaymentScope,
  HackathonPaymentStatus,
  HackathonPaymentOrderStatus,
} from '@oppskills/db';
import { RazorpayService } from './razorpay.service';
import { PaymentsRouteService } from './payments-route.service';
import { Decimal } from '@prisma/client/runtime/library';

const PLATFORM_FEE_PERCENT = 2;

@Injectable()
export class HackathonCheckoutService {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paymentsRouteService: PaymentsRouteService,
  ) {}

  async createPaymentOrder(params: {
    hackathonSlug: string;
    userId: string;
    teamId?: string;
    discountCode?: string;
  }) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        isFree: true,
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

    if (scope === HackathonPaymentScope.TEAM) {
      if (!params.teamId) {
        throw new BadRequestException('Team ID required for per-team payment');
      }

      const team = await prisma.teamEntity.findUnique({
        where: { id: params.teamId },
        select: { id: true, hackathonId: true, leaderId: true },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      if (team.hackathonId !== hackathon.id) {
        throw new BadRequestException('Team does not belong to this hackathon');
      }

      if (team.leaderId !== params.userId) {
        throw new ForbiddenException('Only team leader can initiate payment');
      }

      const existingPayment = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          scope: HackathonPaymentScope.TEAM,
          hackathonId: hackathon.id,
          teamId: params.teamId,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
        },
      });

      if (existingPayment) {
        throw new BadRequestException(
          'Payment already completed for this team',
        );
      }

      teamId = params.teamId;
    } else {
      const existingPayment = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          scope: HackathonPaymentScope.USER,
          hackathonId: hackathon.id,
          payerUserId: params.userId,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
        },
      });

      if (existingPayment) {
        throw new BadRequestException('Payment already completed');
      }
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
    const organizerShareAmount = grossAmount.minus(platformFeeAmount);

    const grossAmountPaise = grossAmount.times(100).toNumber();

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
          discountAmount: discountAmount.greaterThan(0) ? discountAmount : null,
        },
      });

      return {
        paymentId: payment.id,
        razorpayKeyId: null,
        razorpayOrderId: null,
        amountPaise: 0,
        currency: hackathon.currency || 'INR',
        hackathonName: hackathon.name,
        zeroAmountPayment: true,
      };
    }

    const razorpayOrder = await this.razorpayService.createOrder({
      amountPaise: grossAmountPaise,
      currency: hackathon.currency || 'INR',
      receipt: `hck_${hackathon.id.slice(-8)}_${Date.now()}`,
      notes: {
        hackathonId: hackathon.id,
        hackathonSlug: hackathon.slug,
        payerUserId: params.userId,
        teamId: teamId || '',
        scope,
      },
    });

    const payment = await prisma.hackathonPaymentEntity.create({
      data: {
        scope,
        hackathonId: hackathon.id,
        organizerId: hackathon.ownerId,
        payerUserId: params.userId,
        teamId,
        currency: hackathon.currency || 'INR',
        grossAmount,
        platformFeeAmount,
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
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerUserId !== params.userId) {
      throw new ForbiddenException('Payment does not belong to this user');
    }

    const isValid = this.razorpayService.verifyCheckoutSignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    await prisma.hackathonPaymentEntity.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        paymentStatus: HackathonPaymentStatus.AUTHORIZED,
      },
    });

    return { success: true, paymentId: payment.id };
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
      where: { slug },
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
        paymentStatus: 'CAPTURED',
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

  async getHackathonPayments(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
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
