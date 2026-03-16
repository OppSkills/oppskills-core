import { withMockLatency } from '../../../../shared/data/mockLatency';
import type { DiscoverFeedEntity } from '../../domain/entities/DiscoverFeed';
import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';
import { mapDiscoverFeed } from '../mappers/mapDiscoverFeed';

export class MockDiscoverFeedRepository implements DiscoverFeedRepository {
  async getFeed(): Promise<DiscoverFeedEntity> {
    return withMockLatency(mapDiscoverFeed());
  }
}
