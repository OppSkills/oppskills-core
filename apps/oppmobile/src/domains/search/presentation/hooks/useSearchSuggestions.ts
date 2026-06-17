import { useQuery } from '@tanstack/react-query';
import { searchRepository } from '../../data/repositories';

export function useSearchSuggestions(query: string) {
  return useQuery<string[], Error>({
    queryKey: ['search-suggestions', query],
    queryFn: () => searchRepository.getSuggestions(query),
    staleTime: 60 * 1000,
  });
}
