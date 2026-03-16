import type { HomeFeedEntity } from '../../domain/entities/HomeFeed';
import type { HomeFeedRepository } from '../../domain/repositories/HomeFeedRepository';

export class ApiHomeFeedRepository implements HomeFeedRepository {
  async getFeed(): Promise<HomeFeedEntity> {
    throw new Error('ApiHomeFeedRepository is not active in Phase 11.');
  }
}
