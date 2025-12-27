import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, DiscountCodeType } from '@oppskills/db';

@Injectable()
export class DiscountCodeService {
  async createDiscountCode(params: {
    hackathonSlug: string;
    userId: string;
    code: string;
    type: 'PERCENT' | 'FIXED';
    value: number;
    maxRedemptions?: number;
    maxPerUser?: number;
  }) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.ownerId !== params.userId) {
      throw new ForbiddenException(
        'Only hackathon owner can create discount codes',
      );
    }

    const existingCode = await prisma.hackathonDiscountCodeEntity.findFirst({
      where: { hackathonId: hackathon.id, code: params.code.toUpperCase() },
    });

    if (existingCode) {
      throw new BadRequestException(
        'Discount code already exists for this hackathon',
      );
    }

    return prisma.hackathonDiscountCodeEntity.create({
      data: {
        hackathonId: hackathon.id,
        code: params.code.toUpperCase(),
        type: params.type as DiscountCodeType,
        value: params.value,
        maxRedemptions: params.maxRedemptions,
        maxPerUser: params.maxPerUser ?? 1,
        active: true,
      },
    });
  }

  async listDiscountCodes(hackathonSlug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.ownerId !== userId) {
      throw new ForbiddenException(
        'Only hackathon owner can view discount codes',
      );
    }

    const codes = await prisma.hackathonDiscountCodeEntity.findMany({
      where: { hackathonId: hackathon.id },
      include: {
        _count: { select: { redemptions: true } },
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
      redemptionCount: c._count.redemptions,
      createdAt: c.createdAt,
    }));
  }

  async updateDiscountCode(params: {
    codeId: string;
    userId: string;
    active?: boolean;
    maxRedemptions?: number;
    maxPerUser?: number;
  }) {
    const code = await prisma.hackathonDiscountCodeEntity.findUnique({
      where: { id: params.codeId },
      include: { hackathon: { select: { ownerId: true } } },
    });

    if (!code) {
      throw new NotFoundException('Discount code not found');
    }

    if (code.hackathon.ownerId !== params.userId) {
      throw new ForbiddenException(
        'Only hackathon owner can update discount codes',
      );
    }

    return prisma.hackathonDiscountCodeEntity.update({
      where: { id: params.codeId },
      data: {
        active: params.active,
        maxRedemptions: params.maxRedemptions,
        maxPerUser: params.maxPerUser,
      },
    });
  }

  async deleteDiscountCode(codeId: string, userId: string) {
    const code = await prisma.hackathonDiscountCodeEntity.findUnique({
      where: { id: codeId },
      include: {
        hackathon: { select: { ownerId: true } },
        _count: { select: { redemptions: true } },
      },
    });

    if (!code) {
      throw new NotFoundException('Discount code not found');
    }

    if (code.hackathon.ownerId !== userId) {
      throw new ForbiddenException(
        'Only hackathon owner can delete discount codes',
      );
    }

    if (code._count.redemptions > 0) {
      throw new BadRequestException(
        'Cannot delete discount code with existing redemptions. Deactivate it instead.',
      );
    }

    await prisma.hackathonDiscountCodeEntity.delete({ where: { id: codeId } });
    return { success: true };
  }

  async validateDiscountCode(
    hackathonId: string,
    code: string,
    userId: string,
  ) {
    const discountCode = await prisma.hackathonDiscountCodeEntity.findFirst({
      where: {
        hackathonId,
        code: code.toUpperCase(),
        active: true,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    if (!discountCode) {
      return { valid: false, reason: 'Invalid or inactive discount code' };
    }

    if (
      discountCode.maxRedemptions !== null &&
      discountCode._count.redemptions >= discountCode.maxRedemptions
    ) {
      return {
        valid: false,
        reason: 'Discount code has reached maximum redemptions',
      };
    }

    const userRedemptions =
      await prisma.hackathonDiscountRedemptionEntity.count({
        where: { discountCodeId: discountCode.id, userId },
      });

    if (userRedemptions >= discountCode.maxPerUser) {
      return {
        valid: false,
        reason: 'You have already used this discount code',
      };
    }

    return {
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type,
        value: Number(discountCode.value),
      },
    };
  }
}
