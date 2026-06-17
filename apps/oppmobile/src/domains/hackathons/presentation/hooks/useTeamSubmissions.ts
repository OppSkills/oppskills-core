import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface RoundSubmissionFile {
  mediaId?: string;
  url: string;
  name: string;
  mimeType: string;
}

export interface RoundSubmission {
  id: string;
  roundId: string;
  teamId: string;
  files: RoundSubmissionFile[];
  note?: string;
}

export interface MyTeamSubmissionsResponse {
  team: {
    id: string;
    name: string;
  };
  submissions: Record<string, RoundSubmission>;
}

export function useMyTeamSubmissions(hackathonSlug: string) {
  return useQuery<MyTeamSubmissionsResponse>({
    queryKey: ['teamSubmissions', hackathonSlug],
    queryFn: async () => {
      return apiClient.get(`/hackathons/by-slug/${hackathonSlug}/my-team/submissions`);
    },
    enabled: !!hackathonSlug,
  });
}

export function useUpsertRoundSubmission(hackathonSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      files,
      note,
    }: {
      roundId: string;
      files: RoundSubmissionFile[];
      note?: string;
    }) => {
      return apiClient.put(
        `/hackathons/by-slug/${hackathonSlug}/rounds/${roundId}/submission`,
        { files, note }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSubmissions', hackathonSlug] });
    },
  });
}
