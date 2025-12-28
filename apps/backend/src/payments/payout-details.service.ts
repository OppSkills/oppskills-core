import { Injectable, ConflictException } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { UpsertPayoutDetailsDto } from './dto/payout-details.dto';

@Injectable()
export class PayoutDetailsService {
  async upsertPayoutDetails(userId: string, dto: UpsertPayoutDetailsDto) {
    const hasAnyPayout = await prisma.hackathonPayoutEntity.findFirst({
      where: { organizerId: userId },
    });

    if (hasAnyPayout) {
      throw new ConflictException(
        'Payout details locked after first payout has been processed',
      );
    }

    const result = await prisma.organizerPayoutDetailsEntity.upsert({
      where: { userId },
      create: {
        userId,
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        upiId: dto.upiId || null,
      },
      update: {
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        upiId: dto.upiId || null,
      },
    });

    return this.maskPayoutDetails(result);
  }

  async getPayoutDetails(userId: string) {
    const details = await prisma.organizerPayoutDetailsEntity.findUnique({
      where: { userId },
    });

    if (!details) {
      return { exists: false };
    }

    return {
      exists: true,
      ...this.maskPayoutDetails(details),
    };
  }

  async getFullPayoutDetails(userId: string) {
    const details = await prisma.organizerPayoutDetailsEntity.findUnique({
      where: { userId },
    });

    if (!details) {
      return null;
    }

    return details;
  }

  private maskPayoutDetails(details: {
    userId: string;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    upiId: string | null;
    updatedAt: Date;
  }) {
    return {
      userId: details.userId,
      accountHolderName: details.accountHolderName,
      accountNumberLast4: details.accountNumber.slice(-4),
      ifsc: details.ifsc,
      upiId: details.upiId,
      updatedAt: details.updatedAt,
    };
  }
}
