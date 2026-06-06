import { useQuery } from "@tanstack/react-query";
import { getPublicCommunities } from "@/lib/api/communityApi";

export interface CommunityFilterState {
  search: string;
  industry: string[];
  sort: string;
  sortOrder: "asc" | "desc";
}

export function usePublicCommunitiesPaged(
  filters: CommunityFilterState & { page?: number; perPage?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["communities", "public", "paged", filters] as const,
    queryFn: async () => {
      return await getPublicCommunities({
        page: filters.page,
        take: filters.perPage,
        q: filters.search || undefined,
        industry: filters.industry.length > 0 ? filters.industry : undefined,
        sort: filters.sort,
        sortOrder: filters.sortOrder,
      });
    },
    enabled: options?.enabled,
  });
}
