import type { SearchCatalogEntity, SearchResultEntity } from '../entities/SearchCatalog';

export interface SearchRepository {
  getCatalog(): SearchCatalogEntity;
  listRecentQueries(): string[];
  saveRecentQuery(rawQuery: string): string[];
  getSuggestions(rawQuery: string): Promise<string[]>;
  getResults(rawQuery: string): Promise<SearchResultEntity[]>;
}
