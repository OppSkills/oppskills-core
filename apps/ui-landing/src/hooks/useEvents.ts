import { useQuery } from "@tanstack/react-query";
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
export function useEvents() {
  return useQuery<EventListItem[]>({
    queryKey: getEventsQueryKey(),
    queryFn: async () => {
      const data = await getPublicEvents();
      return data as EventListItem[];
    },
  });
}
