import { discoverDefaultTopListings } from '../../../shared/constants/mockDiscover';
import type { DiscoverCardTone } from '../../../shared/types/discover';

export type SearchResultKind = 'hackathon' | 'competition' | 'event';

export interface SearchResultItem {
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

export const popularSearchQueries: readonly string[] = ['IIT Bombay', 'Techfest', 'Hackverse', 'IdeaThon'];

const initialRecentQueries: readonly string[] = ['IIT Bombay', 'Techfest', 'Hackverse', 'IdeaThon'];

const rawSearchResultItems: readonly SearchResultItem[] = discoverDefaultTopListings.map((item) => ({
  id: item.id,
  title: item.title,
  host: item.host,
  tagLabel: item.tagLabel,
  kind: item.tagLabel.toLowerCase() === 'hackathon' ? 'hackathon' : item.tagLabel.toLowerCase() === 'competition' ? 'competition' : 'event',
  eventDate: item.eventDate,
  registerBy: item.registerBy,
  valueLabel: item.valueLabel,
  value: item.value,
  tone: item.tone,
}));

const searchSuggestionSeed = [
  ...popularSearchQueries,
  'Hack Phoenix',
  'Hack Buddy',
  'Hack Bounty',
  ...rawSearchResultItems.map((item) => item.title),
];

let persistedRecentQueries = [...initialRecentQueries];

export function loadMockRecentQueries(): string[] {
  return [...persistedRecentQueries];
}

export function saveMockRecentQuery(rawQuery: string): string[] {
  const query = rawQuery.trim();

  if (!query) {
    return [...persistedRecentQueries];
  }

  const normalized = query.toLowerCase();
  const next = [query, ...persistedRecentQueries.filter((item) => item.toLowerCase() !== normalized)].slice(0, 8);
  persistedRecentQueries = next;
  return [...persistedRecentQueries];
}

export function filterSearchResults(rawQuery: string): SearchResultItem[] {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return [...rawSearchResultItems];
  }

  return rawSearchResultItems.filter((item) => {
    const searchableText = `${item.title} ${item.host} ${item.tagLabel}`.toLowerCase();
    return searchableText.includes(query);
  });
}

export function getSearchSuggestions(rawQuery: string): string[] {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return [...popularSearchQueries];
  }

  const unique = new Set<string>();

  for (const candidate of searchSuggestionSeed) {
    if (candidate.toLowerCase().includes(query)) {
      unique.add(candidate);
    }

    if (unique.size >= 6) {
      break;
    }
  }

  return [...unique];
}
