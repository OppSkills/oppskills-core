import type { DiscoverFeedEntity } from '../../domain/entities/DiscoverFeed';
import {
  discoverCategories,
  discoverCompetitionItems,
  discoverDefaultRecentListings,
  discoverDefaultTopListings,
  discoverEventCommunityItems,
  discoverEventFeatureItems,
  discoverHackathonItems,
} from '../../../../shared/constants/mockDiscover';

export function mapDiscoverFeed(): DiscoverFeedEntity {
  return {
    categories: [...discoverCategories],
    defaultTopListings: [...discoverDefaultTopListings],
    defaultRecentListings: [...discoverDefaultRecentListings],
    hackathonListings: [...discoverHackathonItems],
    competitionListings: [...discoverCompetitionItems],
    eventCommunityListings: [...discoverEventCommunityItems],
    eventFeatureListings: [...discoverEventFeatureItems],
  };
}
