
import {
  getPublicEvents,
  getPublicUpcomingEvents,
  getPublicPastEvents,
} from "@/lib/api/eventApi";

/**
 * Event data type for the public listing page.
 * Matches the sanitized response from GET /events/public.
 * Note: owner.email is NOT included for privacy (sanitized from public endpoints).
 */
export interface EventListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  status: string;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  visibility: string;
  eventType: string | null;
  registrationCount: number;
  maxUsers: number | null;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  /** Owner info - email is NOT included for privacy */
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * Query key for the public events list.
 */
export function getEventsQueryKey() {
  return ["events"] as const;
}

/**
 * Fetches all public events (no auth required).
 * Used for the /events listing page.
 */
import { useInfiniteQuery } from "@tanstack/react-query";

// ...

/**
 * Fetches all public events (no auth required).
 * Used for the /events listing page.
 */
export function useEvents(
  festivalId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<EventListItem[], Error>({
    queryKey: ["events", festivalId, search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getPublicEvents({
        festival_id: festivalId,
        page: pageParam as number,
        q: search,
      });
      return data as EventListItem[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Backend returns a list. If list is empty or < 10 (or < 20 if appendResults), no more pages.
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
    enabled: options?.enabled,
  });
}

/**
 * Fetches upcoming public events.
 */
export function useUpcomingEvents(
  festivalId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<EventListItem[], Error>({
    queryKey: ["events", "upcoming", festivalId, search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getPublicUpcomingEvents({
        festival_id: festivalId,
        page: pageParam as number,
        q: search,
      });
      return data as EventListItem[];
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
 * Fetches past public events.
 */
export function usePastEvents(
  festivalId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<EventListItem[], Error>({
    queryKey: ["events", "past", festivalId, search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getPublicPastEvents({
        festival_id: festivalId,
        page: pageParam as number,
        q: search,
      });
      return data as EventListItem[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
    enabled: options?.enabled,
  });
}
