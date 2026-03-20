import { withMockLatency } from '../../../../shared/data/mockLatency';
import { throwIfMockFailureEnabled } from '../../../../shared/data/mockFailure';
import type { DiscoverFeedEntity } from '../../domain/entities/DiscoverFeed';
import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';
import { mapDiscoverFeed } from '../mappers/mapDiscoverFeed';

export class MockDiscoverFeedRepository implements DiscoverFeedRepository {
  async getFeed(): Promise<DiscoverFeedEntity> {
    await throwIfMockFailureEnabled('discover-feed', () => 'Mock discover feed failure.');
    return withMockLatency(mapDiscoverFeed());
  }
}
