
import { getPublicEvents } from "@/lib/api/eventApi";

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
export function useEvents(search?: string) {
  return useInfiniteQuery<EventListItem[], Error>({
    queryKey: ["events", search] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getPublicEvents({
        page: pageParam as number,
        q: search,
        appendResults: true, // we want 20 items per page potentially if backend supports it, defaulting to 10 otherwise
      });
      return data as EventListItem[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Backend returns a list. If list is empty or < 10 (or < 20 if appendResults), no more pages.
      // We assume backend page size is 10 by default, 20 if appendResults=true.
      // Let's assume standard behavior: if returns empty list, stop.
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
  });
}
