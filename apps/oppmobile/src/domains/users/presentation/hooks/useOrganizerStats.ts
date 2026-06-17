import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface OrganizerStats {
  readonly total_participants: number;
  readonly event: {
    readonly active: number;
    readonly total: number;
  };
  readonly hackathon: {
    readonly active: number;
    readonly total: number;
  };
  readonly festival: {
    readonly active: number;
    readonly total: number;
  };
}

export function useOrganizerStats(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'stats'],
    queryFn: () => apiClient.getAuth<OrganizerStats>('/analytics/organizer-stats'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
