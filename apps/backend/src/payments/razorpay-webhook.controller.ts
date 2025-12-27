import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma, RazorpayRouteStatus } from '@oppskills/db';
import { RazorpayService } from './razorpay.service';

@Controller('webhooks')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('razorpay')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-razorpay-event-id') eventId: string,
  ) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for webhook verification');
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'Raw body required' });
    }

    const isValid = this.razorpayService.verifyWebhookSignature(
      rawBody.toString(),
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'Invalid signature' });
    }

    if (eventId) {
      const existingEvent = await prisma.razorpayWebhookEventEntity.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        this.logger.log(`Duplicate webhook event: ${eventId}`);
        return res.status(HttpStatus.OK).json({ status: 'already_processed' });
      }
    }

    const payload = JSON.parse(rawBody.toString());
    const eventType = payload.event as string;

    const webhookEvent = await prisma.razorpayWebhookEventEntity.create({
      data: {
        eventId: eventId || `manual_${Date.now()}`,
        eventType,
        payload,
      },
    });

    try {
      await this.processEvent(eventType, payload);

      await prisma.razorpayWebhookEventEntity.update({
        where: { id: webhookEvent.id },
        data: { processedAt: new Date() },
      });

      return res.status(HttpStatus.OK).json({ status: 'processed' });
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Processing failed' });
    }
  }

  private async processEvent(
    eventType: string,
    payload: RazorpayWebhookPayload,
  ) {
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;

      case 'refund.failed':
        await this.handleRefundFailed(payload);
        break;

      case 'transfer.processed':
        await this.handleTransferProcessed(payload);
        break;

      case 'transfer.settled':
        await this.handleTransferSettled(payload);
        break;

      case 'account.under_review':
      case 'account.needs_clarification':
      case 'account.activated':
      case 'account.suspended':
        await this.handleRouteAccountStatusChange(eventType, payload);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private async handlePaymentCaptured(payload: RazorpayWebhookPayload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    if (!orderId) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayOrderId: orderId },
      data: {
        razorpayPaymentId: payment.id,
        paymentStatus: 'CAPTURED',
        orderStatus: 'PAID',
        capturedAt: new Date(),
      },
    });

    const payments = await prisma.hackathonPaymentEntity.findMany({
      where: { razorpayOrderId: orderId },
      select: { id: true, discountCodeId: true, payerUserId: true },
    });

    for (const p of payments) {
      if (!p.discountCodeId) continue;

      try {
        await prisma.hackathonDiscountRedemptionEntity.create({
          data: {
            discountCodeId: p.discountCodeId,
            userId: p.payerUserId,
            paymentId: p.id,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        throw error;
      }
    }

    const transfer = payload.payload?.transfer?.entity;
    if (transfer) {
      await prisma.hackathonPaymentEntity.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayTransferId: transfer.id,
          transferStatus: transfer.status,
          settlementStatus: transfer.settlement_status,
        },
      });
    }

    this.logger.log(`Payment captured for order: ${orderId}`);
  }

  private async handlePaymentFailed(payload: RazorpayWebhookPayload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    if (!orderId) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayOrderId: orderId },
      data: {
        paymentStatus: 'FAILED',
        orderStatus: 'FAILED',
        failedAt: new Date(),
      },
    });

    this.logger.log(`Payment failed for order: ${orderId}`);
  }

  private async handleRefundProcessed(payload: RazorpayWebhookPayload) {
    const refund = payload.payload?.refund?.entity;
    if (!refund) return;

    const paymentId = refund.payment_id;
    if (!paymentId) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        razorpayRefundId: refund.id,
        refundStatus: 'PROCESSED',
        paymentStatus: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    this.logger.log(`Refund processed for payment: ${paymentId}`);
  }

  private async handleRefundFailed(payload: RazorpayWebhookPayload) {
    const refund = payload.payload?.refund?.entity;
    if (!refund) return;

    const paymentId = refund.payment_id;
    if (!paymentId) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        razorpayRefundId: refund.id,
        refundStatus: 'FAILED',
      },
    });

    this.logger.log(`Refund failed for payment: ${paymentId}`);
  }

  private async handleTransferProcessed(payload: RazorpayWebhookPayload) {
    const transfer = payload.payload?.transfer?.entity;
    if (!transfer) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: {
        transferStatus: 'processed',
      },
    });

    this.logger.log(`Transfer processed: ${transfer.id}`);
  }

  private async handleTransferSettled(payload: RazorpayWebhookPayload) {
    const transfer = payload.payload?.transfer?.entity;
    if (!transfer) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: {
        settlementStatus: 'settled',
      },
    });

    this.logger.log(`Transfer settled: ${transfer.id}`);
  }

  private async handleRouteAccountStatusChange(
    eventType: string,
    payload: RazorpayWebhookPayload,
  ) {
    const account = payload.payload?.account?.entity;
    if (!account) return;

    const accountId = account.id;
    if (!accountId) return;

    let status: RazorpayRouteStatus;
    switch (eventType) {
      case 'account.under_review':
        status = 'UNDER_REVIEW';
        break;
      case 'account.needs_clarification':
        status = 'NEEDS_CLARIFICATION';
        break;
      case 'account.activated':
        status = 'ACTIVATED';
        break;
      case 'account.suspended':
        status = 'SUSPENDED';
        break;
      default:
        return;
    }

    const requirements = account.requirements || null;
    const resolutionUrl = account.resolution_url || null;

    await prisma.razorpayRouteAccountEntity.updateMany({
      where: { razorpayAccountId: accountId },
      data: {
        status,
        requirements: requirements
          ? JSON.parse(JSON.stringify(requirements))
          : undefined,
        resolutionUrl,
      },
    });

    this.logger.log(`Route account ${accountId} status changed to: ${status}`);
  }
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
      };
    };
    order?: {
      entity: {
        id: string;
        status: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        status: string;
      };
    };
    transfer?: {
      entity: {
        id: string;
        status: string;
        settlement_status: string;
      };
    };
    account?: {
      entity: {
        id: string;
        status: string;
        requirements?: unknown;
        resolution_url?: string;
      };
    };
  };
}
