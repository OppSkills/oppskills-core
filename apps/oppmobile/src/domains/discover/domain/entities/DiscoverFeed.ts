import type {
  DiscoverCategoryItem,
  DiscoverCompactItem,
  DiscoverCommunityItem,
  DiscoverFeatureEventItem,
  DiscoverOpportunityItem,
} from '../../../../shared/types/discover';

export interface DiscoverFeedEntity {
  readonly categories: readonly DiscoverCategoryItem[];
  readonly defaultTopListings: readonly DiscoverCompactItem[];
  readonly defaultRecentListings: readonly DiscoverCompactItem[];
  readonly hackathonListings: readonly DiscoverOpportunityItem[];
  readonly competitionListings: readonly DiscoverOpportunityItem[];
  readonly eventCommunityListings: readonly DiscoverCommunityItem[];
  readonly eventFeatureListings: readonly DiscoverFeatureEventItem[];
}
