import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminStatsService } from './stats.service';
import { AdminGuard } from '../admin.guard';

@Controller('admin/stats')
@UseGuards(AdminGuard)
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @Get('dashboard')
  async dashboardOverview() {
    return this.statsService.dashboardOverview();
  }
}
