import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { AdminPayoutsService } from './admin-payouts.service';
import { MarkPayoutPaidDto } from './dto/admin-payout.dto';

@Controller('admin/payouts')
@UseGuards(ClerkAuthGuard, AdminGuard)
export class AdminPayoutsController {
  constructor(private readonly adminPayoutsService: AdminPayoutsService) {}

  @Get('eligible')
  async getEligiblePayouts(
    @Query('hackathonId') hackathonId?: string,
    @Query('organizerId') organizerId?: string,
  ) {
    return this.adminPayoutsService.getEligiblePayouts({
      hackathonId,
      organizerId,
    });
  }

  @Post('pay')
  async markPaid(@Body() dto: MarkPayoutPaidDto) {
    return this.adminPayoutsService.markPaid(dto);
  }
}
