import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import type { CreateTeamDto } from '@oppskills/types';

export function useCreateTeam() {
  return useMutation({
    mutationFn: async (dto: CreateTeamDto) => {
      return apiClient.post('/hackathons/create-team', dto);
    },
  });
}
