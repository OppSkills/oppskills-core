import { useQuery } from '@tanstack/react-query';

import { competitionDetailRepository } from '../../data/repositories';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useCompetitionDetail(competitionId: string) {
  return useQuery({
    queryKey: [...queryKeys.competitions.detail, competitionId],
    queryFn: () => competitionDetailRepository.getDetail(competitionId),
    enabled: !!competitionId,
  });
}
