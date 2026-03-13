import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getHackathonRoles,
  addHackathonRole,
  removeHackathonRole,
} from "@/lib/api/hackathonApi";
import type {
  HackathonRolesResponse,
  AddHackathonRoleDto,
  RemoveHackathonRoleDto,
} from "@oppskills/types/frontend";

/**
 * Ensures we have a token for authenticated API calls.
 */
function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

/**
 * Query key for hackathon roles.
 */
export function getHackathonRolesQueryKey(hackathonId: string | null) {
  return ["hackathon-roles", hackathonId] as const;
}

/**
 * Fetches roles for a hackathon (owner + managers + evaluators).
 * Only runs when hackathonId is provided.
 */
export function useHackathonRoles(hackathonId: string | null) {
  const { getToken } = useAuth();

  return useQuery<HackathonRolesResponse>({
    queryKey: getHackathonRolesQueryKey(hackathonId),
    enabled: hackathonId !== null,
    queryFn: async () => {
      if (hackathonId === null) {
        throw new Error("Hackathon ID is required.");
      }
      const token = requireToken(await getToken());
      return getHackathonRoles(token, hackathonId);
    },
  });
}

/**
 * Mutation to add a role to a hackathon.
 * Invalidates the roles query on success.
 */
export function useAddHackathonRoleMutation(hackathonId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddHackathonRoleDto) => {
      if (hackathonId === null) {
        throw new Error("Hackathon ID is required.");
      }
      const token = requireToken(await getToken());
      return addHackathonRole(token, hackathonId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getHackathonRolesQueryKey(hackathonId),
      });
    },
  });
}

/**
 * Mutation to remove a role from a hackathon.
 * Invalidates the roles query on success.
 */
export function useRemoveHackathonRoleMutation(hackathonId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RemoveHackathonRoleDto) => {
      if (hackathonId === null) {
        throw new Error("Hackathon ID is required.");
      }
      const token = requireToken(await getToken());
      return removeHackathonRole(token, hackathonId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getHackathonRolesQueryKey(hackathonId),
      });
    },
  });
}
