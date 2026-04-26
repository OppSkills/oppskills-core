import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getHackathonRegistrationsBySlug,
  getHackathonTeamRegistration,
  type HackathonRegistrationsBySlugResponse,
} from "@/lib/api/hackathonApi";

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

/**
 * Ensures we have a usable slug.
 */
function normalizeSlug(slug: string | null | undefined): string | null {
  if (typeof slug !== "string") return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Fetches hackathon team registrations by slug (for organizer dashboard).
 * Includes rounds info and team submissions.
 */
export function useHackathonRegistrationsBySlug(
  slug: string | null | undefined,
  params: { page?: number; take?: number } = {},
) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery<HackathonRegistrationsBySlugResponse>({
    queryKey: ["hackathon-registrations-by-slug", safeSlug, params],
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Hackathon slug is required.");
      }
      const token = requireToken(await getSafeToken(getToken));
      return getHackathonRegistrationsBySlug(token, safeSlug, params);
    },
  });
}

/**
 * Fetches a specific team's registration for a hackathon by slug.
 */
export function useHackathonTeamRegistration(
  slug: string | null | undefined,
  teamId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery({
    queryKey: ["hackathon-team-registration", safeSlug, teamId],
    enabled: safeSlug !== null && !!teamId,
    queryFn: async () => {
      if (safeSlug === null || !teamId) {
        throw new Error("Hackathon slug and team ID are required.");
      }
      const token = requireToken(await getSafeToken(getToken));
      return getHackathonTeamRegistration(token, safeSlug, teamId);
    },
  });
}
