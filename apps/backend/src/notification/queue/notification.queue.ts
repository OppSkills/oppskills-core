import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class NotificationQueue {
  private queue: Queue;

  constructor(private readonly cacheService: CacheService) {
    this.queue = new Queue('notification', {
      connection: this.cacheService.getClient() as any,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  async add(notificationId: string, delay = 0) {
    await this.queue.add(
      'send-notification',
      { notificationId },
      {
        jobId: notificationId, // dedupe
        delay,
      },
    );
  }
}
