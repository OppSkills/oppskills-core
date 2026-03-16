import type { SearchCatalogEntity, SearchResultEntity } from '../../domain/entities/SearchCatalog';
import type { SearchRepository } from '../../domain/repositories/SearchRepository';

export class ApiSearchRepository implements SearchRepository {
  getCatalog(): SearchCatalogEntity {
    throw new Error('ApiSearchRepository is not active in Phase 11.');
  }

  listRecentQueries(): string[] {
    throw new Error('ApiSearchRepository is not active in Phase 11.');
  }

  saveRecentQuery(_rawQuery: string): string[] {
    throw new Error('ApiSearchRepository is not active in Phase 11.');
  }

  getSuggestions(_rawQuery: string): string[] {
    throw new Error('ApiSearchRepository is not active in Phase 11.');
  }

  getResults(_rawQuery: string): SearchResultEntity[] {
    throw new Error('ApiSearchRepository is not active in Phase 11.');
  }
}
