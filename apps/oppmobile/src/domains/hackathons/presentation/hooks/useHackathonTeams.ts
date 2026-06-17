import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

export interface TeamListResponse {
  id: string;
  name: string;
  leaderId: string;
  maxSize: number;
  isOpen: boolean;
  invitationCode: string | null;
  leader: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  leaderPhone?: string;
  members: TeamMember[];
}

export function useHackathonTeams(hackathonId: string) {
  return useQuery<TeamListResponse[]>({
    queryKey: ['hackathonTeams', hackathonId],
    queryFn: async () => {
      return apiClient.get(`/hackathons/teams/${hackathonId}`);
    },
    enabled: !!hackathonId,
  });
}
