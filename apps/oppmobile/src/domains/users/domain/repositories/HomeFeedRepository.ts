import type { HomeFeedEntity } from '../entities/HomeFeed';

export interface HomeFeedRepository {
  getFeed(): Promise<HomeFeedEntity>;
}
