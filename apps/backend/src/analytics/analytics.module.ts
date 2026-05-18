import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCron } from './analytics.cron';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCron],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
