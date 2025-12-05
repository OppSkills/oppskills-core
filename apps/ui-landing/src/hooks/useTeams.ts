import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamsByHackathon,
  // getTeamById
} from "@/lib/api/teamApi";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export const useTeams = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  // ▌GET TEAMS OF A HACKATHON
  const useTeamsByHackathon = (hackathonId: string) =>
    useQuery({
      queryKey: ["teams", hackathonId],
      queryFn: async () => {
        const token = await getToken();
        return getTeamsByHackathon(token!, hackathonId);
      },
      enabled: !!hackathonId,
    });

     // ▌GET SINGLE TEAM
  // const teamById = (teamId: string) =>
  //   useQuery({
  //     queryKey: ["team", teamId],
  //     queryFn: async () => {
  //       const token = await getToken();
  //       return getTeamById(token!, teamId);
  //     },
  //     enabled: !!teamId,
  //   });

     // ▌CREATE
  const create = useMutation({
    mutationFn: async (payload: unknown) => {
      const token = await getToken();
      return createTeam(token!, payload as Record<string, unknown>);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  // ▌JOIN
  const join = useMutation({
    mutationFn: async (payload: unknown) => {
      const token = await getToken();
      return joinTeam(token!, payload as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

   // ▌LEAVE
  const leave = useMutation({
    mutationFn: async (teamId: string) => {
      const token = await getToken();
      return leaveTeam(token!, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  return { teamsByHackathon: useTeamsByHackathon, create, join, leave };
}