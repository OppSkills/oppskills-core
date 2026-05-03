import { Injectable, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { UpsertPayoutDetailsDto } from './dto/payout-details.dto';

@Injectable()
export class PayoutDetailsService {
  async assertCanAccess(userId: string, eventId?: string, hackathonId?: string) {
    if (!eventId && !hackathonId) {
      throw new BadRequestException('eventId or hackathonId is required');
    }

    if (eventId) {
      const event = await prisma.eventEntity.findFirst({
        where: { id: eventId, isDeleted: false },
        select: { ownerId: true, userRoles: { where: { userId, role: 'MANAGER' } } },
      });
      if (!event || (event.ownerId !== userId && event.userRoles.length === 0)) {
        throw new ForbiddenException('You are not allowed to access this event payout details');
      }
    } else if (hackathonId) {
      const hackathon = await prisma.hackathonEntity.findFirst({
        where: { id: hackathonId, isDeleted: false },
        select: { ownerId: true, userRoles: { where: { userId, role: 'MANAGER' } } },
      });
      if (!hackathon || (hackathon.ownerId !== userId && hackathon.userRoles.length === 0)) {
        throw new ForbiddenException('You are not allowed to access this hackathon payout details');
      }
    }
  }

  async upsertPayoutDetails(userId: string, dto: UpsertPayoutDetailsDto) {
    await this.assertCanAccess(userId, dto.eventId, dto.hackathonId);

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

    let existing: any = null;
    if (dto.eventId) {
      existing = await prisma.organizerPayoutDetailsEntity.findFirst({
        where: { eventId: dto.eventId },
      });
    } else if (dto.hackathonId) {
      existing = await prisma.organizerPayoutDetailsEntity.findFirst({
        where: { hackathonId: dto.hackathonId },
      });
    }

    let result;
    if (existing) {
      result = await prisma.organizerPayoutDetailsEntity.update({
        where: { id: existing.id },
        data: {
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
    } else {
      result = await prisma.organizerPayoutDetailsEntity.create({
        data: {
          userId,
          eventId: dto.eventId || null,
          hackathonId: dto.hackathonId || null,
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
    }

    return this.maskPayoutDetails(result);
  }

  async getPayoutDetails(userId: string, eventId?: string, hackathonId?: string) {
    await this.assertCanAccess(userId, eventId, hackathonId);

    let details: any = null;
    if (eventId) {
      details = await prisma.organizerPayoutDetailsEntity.findFirst({
        where: { eventId },
      });
    } else if (hackathonId) {
      details = await prisma.organizerPayoutDetailsEntity.findFirst({
        where: { hackathonId },
      });
    }

    if (!details) {
      return { exists: false };
    }

    return {
      exists: true,
      ...this.maskPayoutDetails(details),
    };
  }

  async getFullPayoutDetails(userId: string, eventId?: string, hackathonId?: string) {
    await this.assertCanAccess(userId, eventId, hackathonId);

    if (eventId) {
      return prisma.organizerPayoutDetailsEntity.findFirst({
        where: { eventId },
      });
    } else if (hackathonId) {
      return prisma.organizerPayoutDetailsEntity.findFirst({
        where: { hackathonId },
      });
    }
    return null;
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
