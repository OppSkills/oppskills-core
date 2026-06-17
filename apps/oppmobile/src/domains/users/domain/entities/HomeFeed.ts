export interface HomeCategoryChipEntity {
  readonly id: string;
  readonly label: string;
}

export interface HomeOpportunityItemEntity {
  readonly id: string;
  readonly title: string;
  readonly kind: 'Hackathon' | 'Competition' | 'Event';
  readonly host: string;
  readonly eventDate: string;
  readonly registerBy: string;
  readonly prizeLabel: string;
  readonly modeLabel: string;
  readonly imageUrl?: string | undefined;
}

export interface HomeEventItemEntity {
  readonly id: string;
  readonly title: string;
  readonly venue: string;
  readonly timing: string;
  readonly attendees: number;
  readonly imageUrl?: string | undefined;
}

export interface HomeCommunityItemEntity {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly domain: string;
  readonly members: number;
  readonly registerBy: string;
}

export interface HomeHighlightItemEntity {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export interface HomeTrackItemEntity {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export interface HomeFeedEntity {
  readonly categoryChips: readonly HomeCategoryChipEntity[];
  readonly topOpportunities: readonly HomeOpportunityItemEntity[];
  readonly listedCompetitions: readonly HomeOpportunityItemEntity[];
  readonly upcomingEvents: readonly HomeEventItemEntity[];
  readonly topCommunities: readonly HomeCommunityItemEntity[];
  readonly nearbyCommunities: readonly HomeCommunityItemEntity[];
  readonly howOppskillsWorks: readonly HomeHighlightItemEntity[];
  readonly whyHustlersChooseOppskills: readonly HomeHighlightItemEntity[];
  readonly trustedByPartners: readonly string[];
  readonly upcomingTracks: readonly HomeTrackItemEntity[];
}
