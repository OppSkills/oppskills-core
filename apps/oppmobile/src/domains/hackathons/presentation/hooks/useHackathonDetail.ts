import { useQuery } from '@tanstack/react-query';

import { hackathonDetailRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useHackathonDetail() {
  return useQuery({
    queryKey: queryKeys.hackathons.detail,
    queryFn: () => hackathonDetailRepository.getDetail(),
  });
}
