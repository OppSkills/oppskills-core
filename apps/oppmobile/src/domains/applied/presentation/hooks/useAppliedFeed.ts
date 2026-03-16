import { useQuery } from '@tanstack/react-query';

import { appliedFeedRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useAppliedFeed() {
  return useQuery({
    queryKey: queryKeys.applied.feed,
    queryFn: () => appliedFeedRepository.getFeed(),
  });
}
