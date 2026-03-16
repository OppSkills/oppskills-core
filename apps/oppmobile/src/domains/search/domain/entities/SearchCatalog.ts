import type { DiscoverCardTone } from '../../../../shared/types/discover';

export type SearchResultKind = 'hackathon' | 'competition' | 'event';

export interface SearchResultEntity {
  readonly id: string;
  readonly title: string;
  readonly host: string;
  readonly tagLabel: string;
  readonly kind: SearchResultKind;
  readonly eventDate: string;
  readonly registerBy: string;
  readonly valueLabel: string;
  readonly value: string;
  readonly tone: DiscoverCardTone;
}

export interface SearchCatalogEntity {
  readonly popularQueries: readonly string[];
  readonly initialRecentQueries: readonly string[];
  readonly allResults: readonly SearchResultEntity[];
}
