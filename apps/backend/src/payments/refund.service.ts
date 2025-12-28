import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class RefundService {
  constructor(private readonly razorpayService: RazorpayService) {}

  async createRefund(params: {
    hackathonSlug: string;
    paymentId: string;
    userId: string;
    amount?: number;
    reason?: string;
  }) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: params.userId },
      select: { accessLevel: true },
    });

    const isOwner = hackathon.ownerId === params.userId;
    const isAdmin = user?.accessLevel === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only hackathon owner or admin can issue refunds',
      );
    }

    const payment = await prisma.hackathonPaymentEntity.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.hackathonId !== hackathon.id) {
      throw new BadRequestException(
        'Payment does not belong to this hackathon',
      );
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('Payment has not been captured yet');
    }

    if (payment.refundStatus === 'PROCESSED') {
      throw new BadRequestException('Payment has already been refunded');
    }

    const existingPayout = await prisma.hackathonPayoutEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        organizerId: hackathon.ownerId,
        status: 'PAID',
      },
    });

    if (existingPayout) {
      throw new BadRequestException(
        'Refunds are blocked after payout has been processed',
      );
    }

    const refundAmountPaise = params.amount
      ? Math.round(params.amount * 100)
      : undefined;

    const refundResponse = await this.razorpayService.createRefund({
      paymentId: payment.razorpayPaymentId,
      amount: refundAmountPaise,
      notes: params.reason ? { reason: params.reason } : undefined,
    });

    await prisma.hackathonPaymentEntity.update({
      where: { id: params.paymentId },
      data: {
        razorpayRefundId: refundResponse.id,
        refundStatus: 'CREATED',
        paymentStatus: 'REFUNDED',
      },
    });

    return {
      success: true,
      refundId: refundResponse.id,
      status: refundResponse.status,
    };
  }

  async getRefundStatus(params: { paymentId: string; userId: string }) {
    const payment = await prisma.hackathonPaymentEntity.findUnique({
      where: { id: params.paymentId },
      include: {
        hackathon: {
          select: { ownerId: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: params.userId },
      select: { accessLevel: true },
    });

    const isOwner = payment.hackathon.ownerId === params.userId;
    const isPayer = payment.payerUserId === params.userId;
    const isAdmin = user?.accessLevel === 'ADMIN';

    if (!isOwner && !isPayer && !isAdmin) {
      throw new ForbiddenException('Not authorized to view refund status');
    }

    if (!payment.razorpayRefundId) {
      return { hasRefund: false };
    }

    const refundDetails = await this.razorpayService.fetchRefund(
      payment.razorpayRefundId,
    );

    return {
      hasRefund: true,
      refundId: payment.razorpayRefundId,
      status: payment.refundStatus,
      razorpayStatus: refundDetails.status,
    };
  }
}
