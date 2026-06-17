export type DiscoverCategoryId = 'hackathons' | 'competitions' | 'events' | 'communities';

export interface DiscoverCategoryItem {
  readonly id: DiscoverCategoryId;
  readonly label: string;
}

export type DiscoverCardTone = 'violet' | 'indigo' | 'teal' | 'amber';

interface DiscoverBaseItem {
  readonly id: string;
  readonly title: string;
  readonly host: string;
  readonly registerBy: string;
  readonly tagLabel: string;
  readonly tone: DiscoverCardTone;
  readonly imageUrl?: string | undefined;
}

export interface DiscoverCompactItem extends DiscoverBaseItem {
  readonly kind: 'compact';
  readonly eventDate: string;
  readonly valueLabel: string;
  readonly value: string;
}

export interface DiscoverOpportunityItem extends DiscoverBaseItem {
  readonly kind: 'opportunity';
  readonly modeLabel: string;
  readonly valueLabel: string;
  readonly value: string;
}

export interface DiscoverCommunityItem {
  readonly kind: 'community';
  readonly id: string;
  readonly title: string;
  readonly domain: string;
  readonly location: string;
  readonly members: number;
  readonly registerBy: string;
  readonly tone: DiscoverCardTone;
  readonly imageUrl?: string | undefined;
}

export interface DiscoverFeatureEventItem {
  readonly kind: 'event-feature';
  readonly id: string;
  readonly title: string;
  readonly timing: string;
  readonly venue: string;
  readonly attendees: number;
  readonly registerBy: string;
  readonly entryFee: string;
  readonly tone: DiscoverCardTone;
  readonly imageUrl?: string | undefined;
}

export type DiscoverVariantItem =
  | DiscoverCompactItem
  | DiscoverOpportunityItem
  | DiscoverCommunityItem
  | DiscoverFeatureEventItem;