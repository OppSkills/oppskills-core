import type { AppliedFeedEntity } from '../../domain/entities/AppliedFeed';
import type { AppliedFeedRepository } from '../../domain/repositories/AppliedFeedRepository';

export class ApiAppliedFeedRepository implements AppliedFeedRepository {
  async getFeed(): Promise<AppliedFeedEntity> {
    throw new Error('ApiAppliedFeedRepository is not active in Phase 11.');
  }
}
