import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueue {
  private queue: Queue;

  constructor(@Inject('REDIS') private readonly redis: any) {
    this.queue = new Queue('notification', {
      connection: this.redis as any,
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