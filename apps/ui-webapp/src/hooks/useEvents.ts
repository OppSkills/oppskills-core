
import {
  getPublicEvents,
  getPublicUpcomingEvents,
} from "@/lib/api/eventApi";
import { getPublicPastOpportunities } from "@/lib/api/opportunityApi";

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

import { FilterState } from "@/components/common/GenericFilterSidebar";

/**
 * Fetches all public events (no auth required).
 * Used for the /events listing page.
 */
export function useEvents(
  festivalId?: string,
  filters?: FilterState,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<{ items: EventListItem[]; further: boolean }, Error>({
    queryKey: ["events", festivalId, filters] as const,
    queryFn: async ({ pageParam = 1 }) => {
      return await getPublicEvents({
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
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.further ? allPages.length + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}

/**
 * Fetches upcoming public events.
 */
export function useUpcomingEvents(
  festivalId?: string,
  filters?: FilterState,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<{ items: EventListItem[]; further: boolean }, Error>({
    queryKey: ["events", "upcoming", festivalId, filters] as const,
    queryFn: async ({ pageParam = 1 }) => {
      return await getPublicUpcomingEvents({
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
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.further ? allPages.length + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}

import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";

/**
 * Union type for the combined past events and hackathons listing.
 */
export type PastOpportunityItem =
  | (EventListItem & { type: "EVENT" })
  | (PublicHackathonListItem & { type: "HACKATHON" });

/**
 * Shape returned by the backend's merged past-opportunities endpoint.
 */
export interface PastOpportunitiesPage {
  items: PastOpportunityItem[];
  hasMore: boolean;
  total: number;
  page: number;
}

/**
 * Fetches past public events + hackathons (merged, globally sorted, paginated).
 */
export function usePastEvents(
  festivalId?: string,
  filters?: FilterState,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery<PastOpportunitiesPage, Error>({
    queryKey: ["events", "past", festivalId, filters] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getPublicPastOpportunities({
        festival_id: festivalId,
        page: pageParam as number,
        q: filters?.search,
      });
      return data as PastOpportunitiesPage;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}
