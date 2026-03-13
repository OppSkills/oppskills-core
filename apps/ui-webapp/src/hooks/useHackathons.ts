import type { CreateHackathonDto, UpdateHackathonDto } from "@oppskills/types/frontend";
import {
  createHackathon,
  deleteHackathon,
  getHackathons,
  registerForHackathon,
  updateHackathon,
} from "@/lib/api/hackathonApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

/**
 * Ensures we have a token for authenticated API calls.
 */
function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

export function useHackathons() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["hackathons"],
    queryFn: async () => {
      const token = requireToken(await getToken());
      return getHackathons(token);
    },
  });

  const create = useMutation({
    mutationFn: async (payload: CreateHackathonDto) => {
      const token = requireToken(await getToken());
      return createHackathon(token, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
  });

  const update = useMutation({
    mutationFn: async (payload: { id: string; data: UpdateHackathonDto }) => {
      const token = requireToken(await getToken());
      return updateHackathon(token, payload.id, payload.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = requireToken(await getToken());
      return deleteHackathon(token, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
  });

  const register = useMutation({
    mutationFn: async (id: string) => {
      const token = requireToken(await getToken());
      return registerForHackathon(token, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathons"] }),
  });

  return { data, isLoading, error, create, update, remove, register };
}
