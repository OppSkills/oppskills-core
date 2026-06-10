import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getPublicCommunities,
  getPublicCommunityMembers,
} from "@/lib/api/communityApi";

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

export function usePublicCommunityMembers(
  handle: string,
  filters: { search?: string; take?: number },
  options?: { enabled?: boolean },
) {
  const take = filters.take ?? 20;
  return useInfiniteQuery({
    queryKey: [
      "community-public-members",
      handle,
      filters.search,
      take,
    ] as const,
    queryFn: async ({ pageParam }) => {
      return await getPublicCommunityMembers(handle, {
        page: pageParam as number | undefined,
        take,
        search: filters.search || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined;
      return lastPage.page + 1;
    },
    enabled: options?.enabled !== false && !!handle,
  });
}
