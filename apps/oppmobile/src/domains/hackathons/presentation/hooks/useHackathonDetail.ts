import { useQuery } from '@tanstack/react-query';

import { hackathonDetailRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useHackathonDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.hackathons.detail, id],
    queryFn: () => hackathonDetailRepository.getDetail(id),
    enabled: id.length > 0,
  });
}
