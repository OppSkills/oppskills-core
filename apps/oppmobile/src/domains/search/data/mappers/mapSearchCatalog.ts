import { discoverDefaultTopListings } from '../../../../shared/constants/mockDiscover';
import type { SearchCatalogEntity, SearchResultEntity } from '../../domain/entities/SearchCatalog';

const basePopularQueries: readonly string[] = ['IIT Bombay', 'Techfest', 'Hackverse', 'IdeaThon'];

function toSearchKind(tagLabel: string): SearchResultEntity['kind'] {
  const normalized = tagLabel.trim().toLowerCase();

  if (normalized === 'hackathon') {
    return 'hackathon';
  }

  if (normalized === 'competition') {
    return 'competition';
  }

  return 'event';
}

export function mapSearchCatalog(): SearchCatalogEntity {
  const allResults: SearchResultEntity[] = discoverDefaultTopListings.map((item) => ({
    id: item.id,
    title: item.title,
    host: item.host,
    tagLabel: item.tagLabel,
    kind: toSearchKind(item.tagLabel),
    eventDate: item.eventDate,
    registerBy: item.registerBy,
    valueLabel: item.valueLabel,
    value: item.value,
    tone: item.tone,
  }));

  return {
    popularQueries: [...basePopularQueries],
    initialRecentQueries: [...basePopularQueries],
    allResults,
  };
}
