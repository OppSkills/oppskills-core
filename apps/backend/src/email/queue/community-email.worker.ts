import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { CacheService } from '../../common/cache.service';
import { EmailService } from '../email.service';
import { processCommunityEmailBatch } from './community-email.processor';
import { Logger } from '../../_utils/logger';

const logger = new Logger('CommunityEmailWorker');

@Injectable()
export class CommunityEmailWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | null = null;

  constructor(
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    logger.info('Initializing community email worker...');
    this.worker = new Worker(
      'community-email',
      async (job) => {
        logger.info(`Starting community email job: ${job.id}`);
        const { communityId, userIds } = job.data;
        await processCommunityEmailBatch(this.emailService, communityId, userIds);
      },
      {
        connection: this.cacheService.getClient() as any,
        concurrency: 3, // Rate limit concurrent execution to avoid CPU spikes
      },
    );

    this.worker.on('failed', (job, err) => {
      logger.error(`Community email job ${job?.id} failed: ${err.message}`, {
        error: err,
      });
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
