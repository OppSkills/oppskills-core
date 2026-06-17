import type { SearchCatalogEntity, SearchResultEntity } from '../../domain/entities/SearchCatalog';
import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import { mapSearchCatalog } from '../mappers/mapSearchCatalog';

export class MockSearchRepository implements SearchRepository {
  private readonly catalog: SearchCatalogEntity;

  private recentQueries: string[];

  constructor() {
    this.catalog = mapSearchCatalog();
    this.recentQueries = [...this.catalog.initialRecentQueries];
  }

  getCatalog(): SearchCatalogEntity {
    return {
      popularQueries: [...this.catalog.popularQueries],
      initialRecentQueries: [...this.catalog.initialRecentQueries],
      allResults: [...this.catalog.allResults],
    };
  }

  listRecentQueries(): string[] {
    return [...this.recentQueries];
  }

  saveRecentQuery(rawQuery: string): string[] {
    const query = rawQuery.trim();

    if (!query) {
      return [...this.recentQueries];
    }

    const normalized = query.toLowerCase();
    this.recentQueries = [query, ...this.recentQueries.filter((item) => item.toLowerCase() !== normalized)].slice(0, 8);

    return [...this.recentQueries];
  }

  async getSuggestions(rawQuery: string): Promise<string[]> {
    const query = rawQuery.trim().toLowerCase();

    if (!query) {
      return [...this.catalog.popularQueries];
    }

    const suggestions = new Set<string>();
    const suggestionSeed = [
      ...this.catalog.popularQueries,
      'Hack Phoenix',
      'Hack Buddy',
      'Hack Bounty',
      ...this.catalog.allResults.map((item) => item.title),
    ];

    for (const candidate of suggestionSeed) {
      if (candidate.toLowerCase().includes(query)) {
        suggestions.add(candidate);
      }

      if (suggestions.size >= 6) {
        break;
      }
    }

    return [...suggestions];
  }

  async getResults(rawQuery: string): Promise<SearchResultEntity[]> {
    const query = rawQuery.trim().toLowerCase();

    if (!query) {
      return [...this.catalog.allResults];
    }

    return this.catalog.allResults.filter((item) => {
      const searchableText = `${item.title} ${item.host} ${item.tagLabel}`.toLowerCase();
      return searchableText.includes(query);
    });
  }
}
