import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getHackathonRegistrationsBySlug,
  type HackathonRegistrationsBySlugResponse,
} from "@/lib/api/hackathonApi";

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
) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery<HackathonRegistrationsBySlugResponse>({
    queryKey: ["hackathon-registrations-by-slug", safeSlug],
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Hackathon slug is required.");
      }
      const token = requireToken(await getToken());
      return getHackathonRegistrationsBySlug(token, safeSlug);
    },
  });
}
