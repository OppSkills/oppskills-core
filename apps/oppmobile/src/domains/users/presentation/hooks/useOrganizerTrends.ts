import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface OrganizerTrends {
  readonly registrationTrend: Record<string, { events: number; hackathon: number }>;
  readonly genderRegistrationTrend: Record<string, { male: number; female: number }>;
}

export function useOrganizerTrends(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'trends'],
    queryFn: () => apiClient.getAuth<OrganizerTrends>('/analytics/organizer-trends'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
