import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import type { RequestJoinTeamDto, RespondJoinRequestDto } from '@oppskills/types';

// Hook to request joining a team
export function useRequestJoinTeam() {
  return useMutation({
    mutationFn: async (dto: RequestJoinTeamDto) => {
      return apiClient.post('/hackathons/request-join-team', dto);
    },
  });
}

export interface TeamJoinRequestResponse {
  id: string;
  teamId: string;
  userId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  };
}

// Hook to fetch join requests for a team (leader only)
export function useTeamJoinRequests(teamId: string) {
  return useQuery<TeamJoinRequestResponse[]>({
    queryKey: ['teamJoinRequests', teamId],
    queryFn: async () => {
      return apiClient.getAuth(`/hackathons/team/${teamId}/requests`);
    },
    enabled: !!teamId,
  });
}

// Hook to respond to a join request (leader only)
export function useRespondJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      dto,
    }: {
      requestId: string;
      dto: RespondJoinRequestDto;
    }) => {
      return apiClient.post(`/hackathons/team/requests/${requestId}/respond`, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamJoinRequests'] });
      queryClient.invalidateQueries({ queryKey: ['teamDetails'] });
      queryClient.invalidateQueries({ queryKey: ['myTeam'] });
    },
  });
}

// Hook to leave a team (for members and leaders who want to disband)
export function useLeaveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      return apiClient.delete(`/hackathons/leave-team/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeam'] });
      queryClient.invalidateQueries({ queryKey: ['teamDetails'] });
    },
  });
}

// Hook to kick a member from the team (leader only)
export function useKickMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return apiClient.delete(`/hackathons/leave-team/${teamId}/member/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamDetails'] });
      queryClient.invalidateQueries({ queryKey: ['myTeam'] });
    },
  });
}

// Hook to change the team leader (current leader/creator only)
export function useChangeLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, newLeaderId }: { teamId: string; newLeaderId: string }) => {
      return apiClient.patch(`/hackathons/team/${teamId}/leader`, { newLeaderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamDetails'] });
      queryClient.invalidateQueries({ queryKey: ['myTeam'] });
    },
  });
}
