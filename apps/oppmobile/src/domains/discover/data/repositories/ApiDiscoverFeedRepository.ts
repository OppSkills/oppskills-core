import type { DiscoverFeedEntity } from '../../domain/entities/DiscoverFeed';
import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';

export class ApiDiscoverFeedRepository implements DiscoverFeedRepository {
  async getFeed(): Promise<DiscoverFeedEntity> {
    throw new Error('ApiDiscoverFeedRepository is not active in Phase 11.');
  }
}
