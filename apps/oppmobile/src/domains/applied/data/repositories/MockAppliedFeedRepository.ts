import { withMockLatency } from '../../../../shared/data/mockLatency';
import { throwIfMockFailureEnabled } from '../../../../shared/data/mockFailure';
import type { AppliedFeedEntity } from '../../domain/entities/AppliedFeed';
import type { AppliedFeedRepository } from '../../domain/repositories/AppliedFeedRepository';
import { mapAppliedFeed } from '../mappers/mapAppliedFeed';

export class MockAppliedFeedRepository implements AppliedFeedRepository {
  async getFeed(): Promise<AppliedFeedEntity> {
    await throwIfMockFailureEnabled('applied-feed', () => 'Mock applied feed failure.');
    return withMockLatency(mapAppliedFeed());
  }
}
