import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";

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
 * Fetches a hackathon by slug (dashboard routes prefer slug).
 */
export function useHackathonBySlug(slug: string | null | undefined) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery({
    queryKey: ["hackathon-by-slug", safeSlug],
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Hackathon slug is required.");
      }
      const token = requireToken(await getToken());
      return getHackathonBySlug(token, safeSlug);
    },
  });
}

/**
 * Get the query key for a hackathon by slug (for cache invalidation).
 */
export function getHackathonBySlugQueryKey(slug: string) {
  return ["hackathon-by-slug", slug];
}
