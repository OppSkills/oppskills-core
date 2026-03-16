import type { HomeFeedEntity } from '../../domain/entities/HomeFeed';
import {
  homeCategoryChips,
  howOppskillsWorks,
  listedCompetitions,
  nearbyCommunities,
  topCommunities,
  topOpportunities,
  trustedByPartners,
  upcomingEvents,
  upcomingTracks,
  whyHustlersChooseOppskills,
} from '../mockHomeFeed';

export function mapHomeFeed(): HomeFeedEntity {
  return {
    categoryChips: [...homeCategoryChips],
    topOpportunities: [...topOpportunities],
    listedCompetitions: [...listedCompetitions],
    upcomingEvents: [...upcomingEvents],
    topCommunities: [...topCommunities],
    nearbyCommunities: [...nearbyCommunities],
    howOppskillsWorks: [...howOppskillsWorks],
    whyHustlersChooseOppskills: [...whyHustlersChooseOppskills],
    trustedByPartners: [...trustedByPartners],
    upcomingTracks: [...upcomingTracks],
  };
}
