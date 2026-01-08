import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCron } from './analytics.cron';
import { RedisProvider } from 'src/redis.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AnalyticsService, AnalyticsCron, RedisProvider],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
