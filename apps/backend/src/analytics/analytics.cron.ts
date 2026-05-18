import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import type Redis from 'ioredis';
import { CacheService } from 'src/common/cache.service';

@Injectable()
export class AnalyticsCron {
  private readonly logger = new Logger(AnalyticsCron.name);
  private readonly redis: Redis;

  constructor(
    private readonly analyticsService: AnalyticsService,
    cacheService: CacheService,
  ) {
    this.redis = cacheService.getClient();
  }

  // Runs every 15 minutes
  @Cron('*/15 * * * *')
  async flushAnalyticsToDb() {
    const lockKey = 'lock:analytics:flush';

    try {
      // Distributed lock (important if you scale later)
      const lock = await this.redis.call('SET', lockKey, '1', 'EX', '60', 'NX');

      if (!lock) {
        return; // another instance already flushing
      }

      this.logger.log('Flushing analytics from Redis to DB...');
      await this.analyticsService.flushToDb();
      this.logger.log('Analytics flush completed');
    } catch (error) {
      this.logger.error('Analytics flush failed', error);
    }
  }
}
