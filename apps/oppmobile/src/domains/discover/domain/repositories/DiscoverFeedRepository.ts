import type { DiscoverFeedEntity } from '../entities/DiscoverFeed';

export interface DiscoverFeedRepository {
  getFeed(): Promise<DiscoverFeedEntity>;
}
