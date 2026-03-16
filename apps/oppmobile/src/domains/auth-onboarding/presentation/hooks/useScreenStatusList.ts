import { useQuery } from '@tanstack/react-query';

import { MockScreenStatusRepository } from '../../data/repositories/MockScreenStatusRepository';
import { queryKeys } from '../../../../shared/query/queryKeys';

const repository = new MockScreenStatusRepository();

export function useScreenStatusList() {
  return useQuery({
    queryKey: queryKeys.delivery.screenStatus,
    queryFn: () => repository.list(),
  });
}
