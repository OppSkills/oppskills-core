import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonCheckoutService } from './hackathon-checkout.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto';
import type { Request } from 'express';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class HackathonCheckoutController {
  constructor(private readonly checkoutService: HackathonCheckoutService) {}

  @Post(':slug/payment/order')
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
      discountCode: dto.discountCode,
    });
  }

  @Post(':slug/payment/verify')
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
