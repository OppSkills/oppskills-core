import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { EventPaymentService } from './event-payment.service';
import {
  CreateEventPaymentOrderDto,
  VerifyEventPaymentDto,
  CreateEventDiscountCodeDto,
  UpdateEventDiscountCodeDto,
  UpdateEventPricingDto,
} from '@oppskills/types';

@ApiTags('Event Payments')
@ApiBearerAuth()
@Controller('events')
export class EventPaymentController {
  private readonly logger = new Logger(EventPaymentController.name);

  constructor(private readonly eventPaymentService: EventPaymentService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Payment Order & Verification
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':slug/payment/order')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Create payment order for event registration' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 201, description: 'Payment order created' })
  @ApiResponse({ status: 400, description: 'Invalid request or event is free' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async createPaymentOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateEventPaymentOrderDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.createPaymentOrder({
      eventSlug: slug,
      userId,
      discountCode: dto.discountCode,
      answers: dto.answers,
    });
  }

  @Post(':slug/payment/verify')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Verify payment and complete registration' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({
    status: 201,
    description: 'Payment verified and registration completed',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(
    @Param('slug') slug: string,
    @Body() dto: VerifyEventPaymentDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.verifyPayment({
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
      userId,
      answers: dto.answers,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Earnings & Payments (Organizer)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':slug/earnings')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get earnings summary for event organizer' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Earnings data' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEarnings(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.getEventEarnings(slug, userId);
  }

  @Get(':slug/payments')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get all payments for event (organizer only)' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getPayments(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.getEventPayments(slug, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pricing Management
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':slug/pricing')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event pricing settings' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Pricing updated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot change pricing after registration started',
  })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updatePricing(
    @Param('slug') slug: string,
    @Body() dto: UpdateEventPricingDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.updateEventPricing(slug, userId, {
      isFree: dto.isFree,
      entryFeeAmount: dto.entryFeeAmount,
      freeCollegeIds: dto.freeCollegeIds,
      feeBearer: dto.feeBearer as 'ORGANISER' | 'PARTICIPANT' | undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Discount Code Management
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':slug/discount-codes')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Create a discount code for event' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 201, description: 'Discount code created' })
  @ApiResponse({ status: 400, description: 'Code already exists' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async createDiscountCode(
    @Param('slug') slug: string,
    @Body() dto: CreateEventDiscountCodeDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.createDiscountCode(slug, userId, {
      code: dto.code,
      type: dto.type,
      value: dto.value,
      maxRedemptions: dto.maxRedemptions,
      maxPerUser: dto.maxPerUser,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      active: dto.active,
    });
  }

  @Get(':slug/discount-codes')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get all discount codes for event' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'List of discount codes' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getDiscountCodes(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.getDiscountCodes(slug, userId);
  }

  @Patch(':slug/discount-codes/:codeId')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update a discount code' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiParam({ name: 'codeId', description: 'Discount code ID' })
  @ApiResponse({ status: 200, description: 'Discount code updated' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Code not found' })
  async updateDiscountCode(
    @Param('slug') slug: string,
    @Param('codeId') codeId: string,
    @Body() dto: UpdateEventDiscountCodeDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.updateDiscountCode(slug, codeId, userId, {
      active: dto.active,
      maxRedemptions: dto.maxRedemptions,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
    });
  }

  @Delete(':slug/discount-codes/:codeId')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Delete a discount code' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiParam({ name: 'codeId', description: 'Discount code ID' })
  @ApiResponse({ status: 200, description: 'Discount code deleted' })
  @ApiResponse({ status: 403, description: 'Not the organizer' })
  @ApiResponse({ status: 404, description: 'Code not found' })
  async deleteDiscountCode(
    @Param('slug') slug: string,
    @Param('codeId') codeId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.eventPaymentService.deleteDiscountCode(slug, codeId, userId);
  }
}
