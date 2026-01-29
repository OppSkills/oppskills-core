
import {
  getPublicHackathons,
  type PublicHackathonListItem,
} from "@/lib/api/hackathonApi";

/**
 * Fetches public hackathons (no auth required).
 * Returns hackathons that are PUBLISHED/ONGOING and APPROVED.
 */
import { useInfiniteQuery } from "@tanstack/react-query";

// ...

/**
 * Fetches public hackathons (no auth required).
 * Returns hackathons that are PUBLISHED/ONGOING and APPROVED.
 */
export function usePublicHackathons(
  festivalId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<PublicHackathonListItem[], Error>({
    queryKey: ["public-hackathons", festivalId, search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      return getPublicHackathons({
        festival_id: festivalId,
        page: pageParam as number,
        q: search,
        appendResults: true,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
    enabled: options?.enabled,
  });
}

/**
 * Fetches upcoming public hackathons.
 */
export function useUpcomingHackathons(
  festivalId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<PublicHackathonListItem[], Error>({
    queryKey: ["public-hackathons", "upcoming", festivalId, search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      // Import dynamically to avoid circular dependencies if any, or just ensure import is at top
      const { getPublicUpcomingHackathons } = await import("@/lib/api/hackathonApi");
      return getPublicUpcomingHackathons({
        festival_id: festivalId,
        page: pageParam as number,
        q: search,
        appendResults: true,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
    enabled: options?.enabled,
  });
}

/**
 * Get the query key for public hackathons (for cache invalidation).
 */
export function getPublicHackathonsQueryKey(festivalId?: string) {
  return ["public-hackathons", festivalId];
}
