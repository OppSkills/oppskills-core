import type { AppliedFeedEntity } from '../entities/AppliedFeed';

export interface AppliedFeedRepository {
  getFeed(): Promise<AppliedFeedEntity>;
}
