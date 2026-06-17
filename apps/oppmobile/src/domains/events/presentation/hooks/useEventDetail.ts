import { useQuery } from '@tanstack/react-query';
import { eventDetailRepository } from '../../data/repositories';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export function useEventDetail(eventId: string) {
  return useQuery<OpportunityDetailModel, Error>({
    queryKey: ['event-detail', eventId],
    queryFn: () => eventDetailRepository.getDetail(eventId),
    staleTime: 60 * 1000,
    enabled: !!eventId,
  });
}
