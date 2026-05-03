import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminPaymentsService } from './payments.service';
import { AdminGuard } from '../admin.guard';

@Controller('admin/payments')
@UseGuards(AdminGuard)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: AdminPaymentsService) {}

  @Get()
  async getPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventId') eventId?: string,
    @Query('hackathonId') hackathonId?: string,
  ) {
    return this.paymentsService.getPayments({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      eventId: eventId?.trim() || undefined,
      hackathonId: hackathonId?.trim() || undefined,
    });
  }
}
