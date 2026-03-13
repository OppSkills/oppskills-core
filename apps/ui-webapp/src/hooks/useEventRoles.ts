import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getEventRoles,
  addEventRole,
  removeEventRole,
} from "@/lib/api/eventApi";
import type {
  EventRolesResponse,
  AddEventRoleDto,
  RemoveEventRoleDto,
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
 * Query key for event roles.
 */
export function getEventRolesQueryKey(eventId: string | null) {
  return ["event-roles", eventId] as const;
}

/**
 * Fetches roles for an event (owner + managers + evaluators).
 * Only runs when eventId is provided.
 */
export function useEventRoles(eventId: string | null) {
  const { getToken } = useAuth();

  return useQuery<EventRolesResponse>({
    queryKey: getEventRolesQueryKey(eventId),
    enabled: eventId !== null,
    queryFn: async () => {
      if (eventId === null) {
        throw new Error("Event ID is required.");
      }
      const token = requireToken(await getToken());
      return getEventRoles(token, eventId);
    },
  });
}

/**
 * Mutation to add a role to an event.
 * Invalidates the roles query on success.
 */
export function useAddEventRoleMutation(eventId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddEventRoleDto) => {
      if (eventId === null) {
        throw new Error("Event ID is required.");
      }
      const token = requireToken(await getToken());
      return addEventRole(token, eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventRolesQueryKey(eventId),
      });
    },
  });
}

/**
 * Mutation to remove a role from an event.
 * Invalidates the roles query on success.
 */
export function useRemoveEventRoleMutation(eventId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RemoveEventRoleDto) => {
      if (eventId === null) {
        throw new Error("Event ID is required.");
      }
      const token = requireToken(await getToken());
      return removeEventRole(token, eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventRolesQueryKey(eventId),
      });
    },
  });
}
