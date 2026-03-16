import { useQuery } from '@tanstack/react-query';

import { discoverFeedRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useDiscoverFeed() {
  return useQuery({
    queryKey: queryKeys.discover.feed,
    queryFn: () => discoverFeedRepository.getFeed(),
  });
}
