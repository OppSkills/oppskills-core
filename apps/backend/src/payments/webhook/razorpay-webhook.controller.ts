import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { prisma } from '@oppskills/db';
import { RazorpayService } from '../gateway/razorpay.service';
import { RazorpayWebhookService } from './razorpay-webhook.service';
import { SkipRateLimit } from '../../common/rate-limit';

@Controller('webhooks')
@SkipRateLimit()
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly webhookService: RazorpayWebhookService,
  ) {}

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
      await this.webhookService.processEvent(eventType, payload);

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
}
