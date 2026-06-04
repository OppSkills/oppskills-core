import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CacheService } from '../../common/cache.service';

export interface CommunityEmailJobData {
  communityId: string;
  userIds: string[];
}

@Injectable()
export class CommunityEmailQueue {
  private queue: Queue;

  constructor(private readonly cacheService: CacheService) {
    this.queue = new Queue('community-email', {
      connection: this.cacheService.getClient() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  async addCommunityWelcomeBatch(communityId: string, userIds: string[]) {
    await this.queue.add('send-welcome-batch', {
      communityId,
      userIds,
    });
  }
}
