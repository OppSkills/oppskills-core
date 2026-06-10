import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getEventRegistrationsBySlug } from "@/lib/api/eventApi";

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
 * Query key for event registrations by slug.
 */
export function getEventRegistrationsBySlugQueryKey(slug: string | null) {
  return ["event-registrations-by-slug", slug] as const;
}

/**
 * Fetches event registrations by slug (owner/manager/admin only).
 */
export function useEventRegistrationsBySlug(
  slug: string | null | undefined,
  params: { page?: number; take?: number } = {},
) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery({
    queryKey: [...getEventRegistrationsBySlugQueryKey(safeSlug), params],
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Event slug is required.");
      }
      const token = requireToken(await getToken());
      return getEventRegistrationsBySlug(token, safeSlug, params);
    },
  });
}
