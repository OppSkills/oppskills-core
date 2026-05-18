import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { HackathonCheckoutService } from './hackathon-checkout.service';
import {
  CreateOrderDto,
  VerifyPaymentDto,
  SaveHackathonRegistrationCheckoutDraftDto,
} from '@oppskills/types';
import type { Request } from 'express';
import { RateLimit } from '../../common/rate-limit';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class HackathonCheckoutController {
  constructor(private readonly checkoutService: HackathonCheckoutService) {}

  @Post(':slug/registration/checkout-draft')
  async saveRegistrationCheckoutDraft(
    @Param('slug') slug: string,
    @Body() dto: SaveHackathonRegistrationCheckoutDraftDto,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.checkoutService.saveRegistrationCheckoutDraft({
      hackathonSlug: slug,
      userId,
      answers: dto.answers,
      teamId: dto.teamId,
      teamName: dto.teamName,
      maxSize: dto.maxSize,
      invitationCode: dto.invitationCode,
      joinTeamId: dto.joinTeamId,
      referralCode: dto.referralCode,
      ticketTierId: dto.ticketTierId,
    });
  }

  @Post(':slug/payment/order')
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'payment:order' })
  async createPaymentOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.checkoutService.createPaymentOrder({
      hackathonSlug: slug,
      userId,
      teamId: dto.teamId,
      teamName: dto.teamName,
      maxSize: dto.maxSize,
      discountCode: dto.discountCode,
      invitationCode: dto.invitationCode,
      joinTeamId: dto.joinTeamId,
      answers: dto.answers,
      referralCode: dto.referralCode,
      ticketTierId: dto.ticketTierId,
    });
  }

  @Post(':slug/payment/verify')
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'payment:verify' })
  async verifyPayment(
    @Param('slug') _slug: string,
    @Body() dto: VerifyPaymentDto,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.checkoutService.verifyPayment({
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
      userId,
      answers: dto.answers,
      referralCode: dto.referralCode,
    });
  }

  @Get(':slug/payment/:paymentId/status')
  async getPaymentStatus(
    @Param('slug') _slug: string,
    @Param('paymentId') paymentId: string,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.checkoutService.getPaymentStatus(paymentId, userId);
  }

  @Get(':slug/earnings')
  async getEarnings(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user!.id;
    return this.checkoutService.getOrganizerEarnings(slug, userId);
  }

  @Get(':slug/payments')
  async getPaymentsList(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user!.id;
    return this.checkoutService.getHackathonPayments(slug, userId);
  }
}
