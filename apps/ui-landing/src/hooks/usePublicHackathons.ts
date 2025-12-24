import { useQuery } from "@tanstack/react-query";
import {
  getPublicHackathons,
  type PublicHackathonListItem,
} from "@/lib/api/hackathonApi";

/**
 * Fetches public hackathons (no auth required).
 * Returns hackathons that are PUBLISHED/ONGOING and APPROVED.
 */
export function usePublicHackathons(festivalId?: string) {
  return useQuery<PublicHackathonListItem[]>({
    queryKey: ["public-hackathons", festivalId],
    queryFn: () => getPublicHackathons(festivalId),
  });
}

/**
 * Get the query key for public hackathons (for cache invalidation).
 */
export function getPublicHackathonsQueryKey(festivalId?: string) {
  return ["public-hackathons", festivalId];
}
