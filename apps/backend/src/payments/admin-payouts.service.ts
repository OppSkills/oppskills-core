import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';

@Injectable()
export class AdminPayoutsService {
  async getEligiblePayouts(filters?: {
    hackathonId?: string;
    organizerId?: string;
  }) {
    const now = new Date();

    const hackathons = await prisma.hackathonEntity.findMany({
      where: {
        isDeleted: false,
        isFree: false,
        registrationDeadline: { lte: now },
        ...(filters?.hackathonId && { id: filters.hackathonId }),
        ...(filters?.organizerId && { ownerId: filters.organizerId }),
      },
      include: {
        owner: true,
        payoutDetails: true,
        payments: {
          where: {
            paymentStatus: 'CAPTURED',
          },
        },
        payouts: true,
      },
    });

    return hackathons
      .map((hackathon) => {
        const netEarnings = hackathon.payments.reduce((sum, p) => {
          const share = new Prisma.Decimal(p.organizerShareAmount);
          const refunded = new Prisma.Decimal(p.refundedAmount || 0);
          return sum.add(share.sub(refunded));
        }, new Prisma.Decimal(0));

        const paidOut = hackathon.payouts.reduce(
          (sum, p) => sum.add(new Prisma.Decimal(p.amount)),
          new Prisma.Decimal(0),
        );

        const pendingPayout = Prisma.Decimal.max(
          netEarnings.sub(paidOut),
          new Prisma.Decimal(0),
        );

        const currency = hackathon.payments[0]?.currency || 'INR';

        return {
          hackathonId: hackathon.id,
          hackathonTitle: hackathon.name,
          hackathonSlug: hackathon.slug,
          organizerId: hackathon.ownerId,
          organizerEmail: hackathon.owner.email,
          organizerName:
            `${hackathon.owner.firstName || ''} ${hackathon.owner.lastName || ''}`.trim(),
          registrationDeadline: hackathon.registrationDeadline,
          currency,
          netEarnings: netEarnings.toString(),
          paidOut: paidOut.toString(),
          pendingPayout: pendingPayout.toString(),
          payoutDetails: hackathon.payoutDetails
            ? {
                accountHolderName:
                  hackathon.payoutDetails.accountHolderName,
                accountNumber: hackathon.payoutDetails.accountNumber,
                ifsc: hackathon.payoutDetails.ifsc,
                upiId: hackathon.payoutDetails.upiId,
              }
            : null,
          existingPayouts: hackathon.payouts,
        };
      })
      .filter((h) => parseFloat(h.pendingPayout) > 0);
  }

  async markPaid(dto: {
    hackathonId: string;
    organizerId: string;
    amount: string;
    reference: string;
    paidAt?: string;
    notes?: string;
  }) {
    const eligible = await this.getEligiblePayouts({
      hackathonId: dto.hackathonId,
      organizerId: dto.organizerId,
    });

    const target = eligible[0];
    if (!target) {
      throw new NotFoundException(
        'No eligible payout found for this hackathon/organizer',
      );
    }

    const requestedAmount = new Prisma.Decimal(dto.amount);
    const pendingAmount = new Prisma.Decimal(target.pendingPayout);

    if (requestedAmount.greaterThan(pendingAmount)) {
      throw new BadRequestException(
        `Requested amount ${dto.amount} exceeds pending payout ${target.pendingPayout}`,
      );
    }

    const capturedPayments = await prisma.hackathonPaymentEntity.findMany({
      where: {
        hackathonId: dto.hackathonId,
        paymentStatus: 'CAPTURED',
      },
      select: {
        id: true,
        organizerShareAmount: true,
        refundedAmount: true,
      },
    });

    const payout = await prisma.$transaction(async (tx) => {
      const newPayout = await tx.hackathonPayoutEntity.create({
        data: {
          hackathonId: dto.hackathonId,
          organizerId: dto.organizerId,
          amount: requestedAmount,
          currency: target.currency,
          status: 'PAID',
          eligibleAt: target.registrationDeadline ?? new Date(),
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      let remainingToAllocate = requestedAmount;
      for (const payment of capturedPayments) {
        if (remainingToAllocate.lessThanOrEqualTo(0)) break;

        const paymentNet = new Prisma.Decimal(payment.organizerShareAmount).sub(
          new Prisma.Decimal(payment.refundedAmount || 0),
        );

        if (paymentNet.lessThanOrEqualTo(0)) continue;

        const allocate = Prisma.Decimal.min(remainingToAllocate, paymentNet);

        await tx.hackathonPayoutItemEntity.create({
          data: {
            payoutId: newPayout.id,
            paymentId: payment.id,
            amountAllocated: allocate,
          },
        });

        remainingToAllocate = remainingToAllocate.sub(allocate);
      }

      return newPayout;
    });

    return {
      payoutId: payout.id,
      hackathonId: payout.hackathonId,
      organizerId: payout.organizerId,
      amount: payout.amount.toString(),
      reference: payout.reference,
      paidAt: payout.paidAt,
      status: payout.status,
    };
  }
}
