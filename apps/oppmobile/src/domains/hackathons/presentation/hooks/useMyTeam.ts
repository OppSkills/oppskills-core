import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import type { TeamListResponse } from './useHackathonTeams';

export function useMyTeam(hackathonId: string) {
  return useQuery<TeamListResponse | null>({
    queryKey: ['myTeam', hackathonId],
    queryFn: async () => {
      return apiClient.getAuth(`/hackathons/my-team?hackathonId=${hackathonId}`);
    },
    enabled: !!hackathonId,
  });
}
