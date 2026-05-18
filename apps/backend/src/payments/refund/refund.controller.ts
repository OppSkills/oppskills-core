import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { RefundService } from './refund.service';
import { CreateRefundDto } from '@oppskills/types';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post(':slug/refunds')
  async createRefund(
    @Param('slug') slug: string,
    @Body() dto: CreateRefundDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.refundService.createRefund({
      hackathonSlug: slug,
      paymentId: dto.paymentId,
      userId: req.user.id,
      amount: dto.amount,
      reason: dto.reason,
    });
  }

  @Get(':slug/refunds/:paymentId/status')
  async getRefundStatus(
    @Param('paymentId') paymentId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.refundService.getRefundStatus({
      paymentId,
      userId: req.user.id,
    });
  }
}
