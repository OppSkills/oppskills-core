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
import type { DiscoverCardTone } from '../../../../shared/types/discover';

/** Tone cycle used by both mock and API discover feed mappers. */
export const TONE_CYCLE: readonly DiscoverCardTone[] = ['amber', 'indigo', 'teal', 'violet'];

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
