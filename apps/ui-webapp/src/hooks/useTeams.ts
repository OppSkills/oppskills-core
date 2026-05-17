import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamsByHackathon,
  getTeamById,
} from "@/lib/api/teamApi";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import type { CreateTeamDto } from "@oppskills/types";

import type { JoinTeamDto } from "@/lib/api/teamApi";

import { getSafeToken } from "@/lib/auth-utils";

/**
 * Ensures we have a token for authenticated API calls.
 */
function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

export const useTeams = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // ▌GET TEAMS OF A HACKATHON
  const useTeamsByHackathon = (hackathonId: string) =>
    useQuery({
      queryKey: ["teams", hackathonId],
      queryFn: async () => {
        const token = requireToken(await getSafeToken(getToken));
        return getTeamsByHackathon(token, hackathonId);
      },
      enabled: !!hackathonId,
    });

  // ▌GET SINGLE TEAM
  const useTeamById = (teamId: string) =>
    useQuery({
      queryKey: ["team", teamId],
      queryFn: async () => {
        const token = requireToken(await getSafeToken(getToken));
        return getTeamById(token, teamId);
      },
      enabled: !!teamId,
    });

  // ▌CREATE
  const create = useMutation({
    mutationFn: async (payload: CreateTeamDto) => {
      const token = requireToken(await getSafeToken(getToken));
      return createTeam(token, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  // ▌JOIN
  const join = useMutation({
    mutationFn: async (payload: JoinTeamDto) => {
      const token = requireToken(await getSafeToken(getToken));
      return joinTeam(token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  // ▌LEAVE
  const leave = useMutation({
    mutationFn: async (teamId: string) => {
      const token = requireToken(await getSafeToken(getToken));
      return leaveTeam(token, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  return {
    teamsByHackathon: useTeamsByHackathon,
    teamById: useTeamById,
    create,
    join,
    leave,
  };
};
