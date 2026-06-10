import { useQuery } from "@tanstack/react-query";
import { searchOpportunities } from "@/lib/api/opportunityApi";
import type { EventListItem } from "@/hooks/events/useEvents";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";

/**
 * Hook to search for opportunities (hackathons, events, and top results).
 */
export function useSearch(query: string) {
  const q = query.trim();

  return useQuery({
    queryKey: ["search", q],
    queryFn: () => searchOpportunities(q),
    enabled: q.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type SearchResults = {
  hackathons: PublicHackathonListItem[];
  events: EventListItem[];
  topOpportunities: (
    | (EventListItem & { type: "EVENT" })
    | (PublicHackathonListItem & { type: "HACKATHON" })
  )[];
};
