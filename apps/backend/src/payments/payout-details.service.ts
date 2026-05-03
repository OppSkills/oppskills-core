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

    let bankName = dto.bankName;
    if (dto.razorpayBankName && dto.ifsc) {
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${dto.ifsc}`);
        if (res.ok) {
          const data = await res.json();
          bankName = data.BANK;
        }
      } catch (err) {
        // Fall back to the passed bankName if fetch fails
      }
    }

    const result = await prisma.organizerPayoutDetailsEntity.upsert({
      where: { userId },
      create: {
        userId,
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        bankName,
        panNumber: dto.panNumber || null,
        gstNumber: dto.gstNumber || null,
        upiId: dto.upiId || '',
        pinCode: dto.pinCode || '',
        city: dto.city || '',
        state: dto.state || '',
        address1: dto.address1 || '',
        address2: dto.address2 || '',
        phone: dto.phone || '',
        email: dto.email || '',
      },
      update: {
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        bankName,
        panNumber: dto.panNumber || null,
        gstNumber: dto.gstNumber || null,
        upiId: dto.upiId || '',
        pinCode: dto.pinCode || '',
        city: dto.city || '',
        state: dto.state || '',
        address1: dto.address1 || '',
        address2: dto.address2 || '',
        phone: dto.phone || '',
        email: dto.email || '',
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
    bankName: string;
    panNumber: string | null;
    gstNumber: string | null;
    upiId: string;
    pinCode: string;
    city: string;
    state: string;
    address1: string;
    address2: string;
    phone: string;
    email: string;
    updatedAt: Date;
  }) {
    return {
      userId: details.userId,
      accountHolderName: details.accountHolderName,
      accountNumberLast4: details.accountNumber.slice(-4),
      ifsc: details.ifsc,
      bankName: details.bankName,
      panNumber: details.panNumber,
      gstNumber: details.gstNumber,
      upiId: details.upiId,
      pinCode: details.pinCode,
      city: details.city,
      state: details.state,
      address1: details.address1,
      address2: details.address2,
      phone: details.phone,
      email: details.email,
      updatedAt: details.updatedAt,
    };
  }
}
