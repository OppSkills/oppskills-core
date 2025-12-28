import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { PayoutDetailsService } from './payout-details.service';
import { UpsertPayoutDetailsDto } from './dto/payout-details.dto';
import type { Request } from 'express';

@Controller('payments/payout-details')
@UseGuards(ClerkAuthGuard)
export class PayoutDetailsController {
  constructor(private readonly payoutDetailsService: PayoutDetailsService) {}

  @Get()
  async getPayoutDetails(@Req() req: Request) {
    const userId = req.user!.id;
    return this.payoutDetailsService.getPayoutDetails(userId);
  }

  @Put()
  async upsertPayoutDetails(
    @Req() req: Request,
    @Body() dto: UpsertPayoutDetailsDto,
  ) {
    const userId = req.user!.id;
    return this.payoutDetailsService.upsertPayoutDetails(userId, dto);
  }
}
