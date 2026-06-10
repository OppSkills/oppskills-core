import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getFestivalBySlug } from "@/lib/api/festivalApi";

/**
 * Ensures we have a usable slug.
 */
function normalizeSlug(slug: string | null | undefined): string | null {
  if (typeof slug !== "string") return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Fetches a festival by slug.
 */
export function useFestivalBySlug(slug: string | null | undefined) {
  const { getToken } = useAuth();
  const safeSlug = normalizeSlug(slug);

  return useQuery({
    queryKey: ["festival-by-slug", safeSlug],
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Festival slug is required.");
      }
      const token = await getToken();
      return getFestivalBySlug(token, safeSlug);
    },
  });
}

/**
 * Get the query key for a festival by slug (for cache invalidation).
 */
export function getFestivalBySlugQueryKey(slug: string) {
  return ["festival-by-slug", slug];
}
