import { useQuery } from '@tanstack/react-query';
import { searchRepository } from '../../data/repositories';
import type { SearchResultEntity } from '../../domain/entities/SearchCatalog';

export function useSearchResults(query: string) {
  return useQuery<SearchResultEntity[], Error>({
    queryKey: ['search-results', query],
    queryFn: () => searchRepository.getResults(query),
    staleTime: 60 * 1000,
  });
}
