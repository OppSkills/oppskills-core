import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import { queryKeys } from '../../../../shared/query/queryKeys';

export function useEventParticipation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, answers }: { eventId: string; answers?: Array<{ fieldId: string; value: unknown }> }) => {
      return apiClient.post(`/events/${eventId}/join`, { answers: answers ?? [] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.home.feed });
      qc.invalidateQueries({ queryKey: ['organizer', 'events'] });
      // Invalidate detail view for this eventId if present
      qc.invalidateQueries({ predicate: (q) => q.queryKey?.[0] === 'event-detail' });
    },
  });
}
