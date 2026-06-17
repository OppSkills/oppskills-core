import { apiClient } from '../../../../shared/api/apiClient';
import type { SearchCatalogEntity, SearchResultEntity } from '../../domain/entities/SearchCatalog';
import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import { mapSearchCatalog } from '../mappers/mapSearchCatalog';
import { mapOpportunityToSearchResult } from '../mappers/mapSearchResult';

export class ApiSearchRepository implements SearchRepository {
  private recentQueries: string[];
  private readonly catalog: SearchCatalogEntity;

  constructor() {
    this.catalog = mapSearchCatalog();
    this.recentQueries = [...this.catalog.initialRecentQueries];
  }

  getCatalog(): SearchCatalogEntity {
    return {
      popularQueries: [...this.catalog.popularQueries],
      initialRecentQueries: [...this.catalog.initialRecentQueries],
      allResults: [],
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
    const query = rawQuery.trim();
    if (!query) return [...this.catalog.popularQueries];

    try {
      const [hackathons, events] = await Promise.all([
        apiClient.get<Record<string, unknown>[]>(`/hackathons/public?q=${encodeURIComponent(query)}&appendResults=true`),
        apiClient.get<Record<string, unknown>[]>(`/events/public?q=${encodeURIComponent(query)}&appendResults=true`),
      ]);

      const suggestions = [
        ...(hackathons || []).map((item: Record<string, unknown>) => (item.name as string) || (item.title as string) || ''),
        ...(events || []).map((item: Record<string, unknown>) => (item.name as string) || (item.title as string) || ''),
      ].filter(Boolean);

      return Array.from(new Set(suggestions)).slice(0, 8);
    } catch {
      return [];
    }
  }

  async getResults(rawQuery: string): Promise<SearchResultEntity[]> {
    const query = rawQuery.trim();
    if (!query) return [];

    try {
      const [hackathons, events] = await Promise.all([
        apiClient.get<Record<string, unknown>[]>(`/hackathons/public?q=${encodeURIComponent(query)}&appendResults=true`),
        apiClient.get<Record<string, unknown>[]>(`/events/public?q=${encodeURIComponent(query)}&appendResults=true`),
      ]);

      const results: SearchResultEntity[] = [];

      (hackathons || []).forEach((item: Record<string, unknown>) => {
        const kind = (item.hackathonType as string) === 'CASE_STUDY_COMPETITION' ? 'competition' : 'hackathon';
        results.push(mapOpportunityToSearchResult(item, kind));
      });

      (events || []).forEach((item: Record<string, unknown>) => {
        results.push(mapOpportunityToSearchResult(item, 'event'));
      });

      return results;
    } catch {
      return [];
    }
  }
}
