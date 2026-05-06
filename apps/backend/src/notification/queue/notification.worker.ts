// app/src/notification/queue/notification.worker.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker } from 'bullmq';
import { processNotification } from './notification.processor';
import { Logger } from '../../_utils/logger';

const logger = new Logger('NotificationWorker');

@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | null = null;

  constructor(@Inject('REDIS') private readonly redis: any) {}

  onModuleInit() {
    logger.info('Initializing notification worker...');
    this.worker = new Worker(
      'notification',
      async (job) => {
        logger.info(`Starting job: ${job.id}, Notification ID: ${job.data.notificationId}`);
        await processNotification(job.data.notificationId);
      },
      {
        connection: this.redis as any,
        concurrency: 2,
      },
    );

    this.worker.on('active', (job) => {
      logger.info(`Notification job ${job.id} became active.`, { jobId: job.id, data: job.data });
    });

    this.worker.on('completed', (job) => {
      logger.info(`Notification job ${job.id} completed successfully.`, { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Notification job ${job?.id || 'unknown'} failed. Error: ${err.message}`, {
        jobId: job?.id,
        error: err,
      });
    });

    this.worker.on('error', (err) => {
      logger.error(`Notification worker encountered an error: ${err.message}`, { error: err });
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      logger.info('Shutting down notification worker...');
      await this.worker.close();
    }
  }
}