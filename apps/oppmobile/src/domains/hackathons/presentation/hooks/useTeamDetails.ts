import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import type { TeamListResponse } from './useHackathonTeams';

export function useTeamDetails(teamId: string) {
  return useQuery<TeamListResponse>({
    queryKey: ['teamDetails', teamId],
    queryFn: async () => {
      return apiClient.getAuth(`/hackathons/team/${teamId}`);
    },
    enabled: !!teamId,
  });
}
