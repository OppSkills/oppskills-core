import { withMockLatency } from '../../../../shared/data/mockLatency';
import type { HomeFeedEntity } from '../../domain/entities/HomeFeed';
import type { HomeFeedRepository } from '../../domain/repositories/HomeFeedRepository';
import { mapHomeFeed } from '../mappers/mapHomeFeed';

export class MockHomeFeedRepository implements HomeFeedRepository {
  async getFeed(): Promise<HomeFeedEntity> {
    return withMockLatency(mapHomeFeed());
  }
}
