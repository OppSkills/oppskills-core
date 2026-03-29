import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCron } from './analytics.cron';
import { AnalyticsController } from './analytics.controller';
import { RedisProvider } from 'src/redis.provider';

@Module({
  imports: [],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCron, RedisProvider],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
