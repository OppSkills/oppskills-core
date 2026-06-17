import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface OrganizerTopListing {
  readonly title: string;
  readonly slug: string;
  readonly thumbnail: string | null;
  readonly tregistrations: number;
  readonly type: 'EVENT' | 'HACKATHON';
}

export function useOrganizerTopListings(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'top-listings'],
    queryFn: () => apiClient.getAuth<OrganizerTopListing[]>('/analytics/organizer-top-listings'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
