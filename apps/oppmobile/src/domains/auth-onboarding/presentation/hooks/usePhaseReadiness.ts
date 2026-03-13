import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../../../shared/query/queryKeys';
import type { DeliveryPhase } from '../../../../shared/types/app';
import { MockScreenStatusRepository } from '../../data/repositories/MockScreenStatusRepository';
import { getPhaseReadiness } from '../../domain/use-cases/getPhaseReadiness';

const repository = new MockScreenStatusRepository();

export function usePhaseReadiness(phase: DeliveryPhase) {
  return useQuery({
    queryKey: queryKeys.delivery.phaseReadiness(phase),
    queryFn: () => getPhaseReadiness(repository, phase),
  });
}
