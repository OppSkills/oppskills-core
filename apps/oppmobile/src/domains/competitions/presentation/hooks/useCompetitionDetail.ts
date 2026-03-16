import { useQuery } from '@tanstack/react-query';

import { competitionDetailRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useCompetitionDetail() {
  return useQuery({
    queryKey: queryKeys.competitions.detail,
    queryFn: () => competitionDetailRepository.getDetail(),
  });
}
