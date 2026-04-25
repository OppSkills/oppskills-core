
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

import { FilterState } from "@/components/common/GenericFilterSidebar";

/**
 * Fetches public hackathons (no auth required).
 * Returns hackathons that are PUBLISHED/ONGOING and APPROVED.
 */
export function usePublicHackathons(
  festivalId?: string,
  filters?: FilterState,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<
    {
      items: PublicHackathonListItem[];
      totalPages: number;
      total: number;
      page: number;
    },
    Error
  >({
    queryKey: ["public-hackathons", festivalId, filters] as const,
    queryFn: async ({ pageParam = 1 }) => {
      return getPublicHackathons({
        festival_id: festivalId,
        page: pageParam as number,
        q: filters?.search,
        modes: filters?.modes,
        status: filters?.status,
        eventDates: filters?.eventDates,
        eligibility: filters?.eligibility,
        sort: filters?.sort,
        sortOrder: filters?.sortOrder,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}

/**
 * Fetches upcoming public hackathons.
 */
export function useUpcomingHackathons(
  festivalId?: string,
  filters?: FilterState,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<
    {
      items: PublicHackathonListItem[];
      totalPages: number;
      total: number;
      page: number;
    },
    Error
  >({
    queryKey: ["public-hackathons", "upcoming", festivalId, filters] as const,
    queryFn: async ({ pageParam = 1 }) => {
      // Import dynamically to avoid circular dependencies if any, or just ensure import is at top
      const { getPublicUpcomingHackathons } = await import(
        "@/lib/api/hackathonApi"
      );
      return getPublicUpcomingHackathons({
        festival_id: festivalId,
        page: pageParam as number,
        q: filters?.search,
        modes: filters?.modes,
        status: filters?.status,
        eventDates: filters?.eventDates,
        eligibility: filters?.eligibility,
        sort: filters?.sort,
        sortOrder: filters?.sortOrder,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}

import { useQuery } from "@tanstack/react-query";

/**
 * Standard query for public hackathons (not infinite).
 */
export function usePublicHackathonsPaged(
  filters: FilterState & { page?: number; perPage?: number },
  options?: { enabled?: boolean }
) {
  return useQuery<
    {
      items: PublicHackathonListItem[];
      totalPages: number;
      total: number;
      page: number;
    },
    Error
  >({
    queryKey: ["public-hackathons", "paged", filters] as const,
    queryFn: async () => {
      return await getPublicHackathons({
        page: filters.page,
        q: filters.search,
        modes: filters.modes,
        status: filters.status,
        eventDates: filters.eventDates,
        eligibility: filters.eligibility,
        sort: filters.sort,
        sortOrder: filters.sortOrder,
        take: filters.perPage,
      });
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
