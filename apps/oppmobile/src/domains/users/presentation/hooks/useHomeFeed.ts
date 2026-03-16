import { useQuery } from '@tanstack/react-query';

import { homeFeedRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useHomeFeed() {
  return useQuery({
    queryKey: queryKeys.home.feed,
    queryFn: () => homeFeedRepository.getFeed(),
  });
}
