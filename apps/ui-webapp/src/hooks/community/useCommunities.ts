import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getPublicCommunities,
  getPublicCommunityMembers,
  getTrendingCommunities,
  getPostableCommunities,
  followCommunity,
  unfollowCommunity,
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

export function useTrendingCommunities(
  token?: string,
  limit?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      "communities",
      "public",
      "trending",
      token || "anonymous",
      limit,
    ] as const,
    queryFn: async () => {
      return await getTrendingCommunities(token, limit);
    },
    enabled: options?.enabled,
  });
}

export function usePostableCommunities(
  token?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["communities", "postable", token] as const,
    queryFn: async () => {
      if (!token)
        throw new Error("Authentication required for postable communities");
      return await getPostableCommunities(token);
    },
    enabled: options?.enabled !== false && !!token,
  });
}

export function useFollowCommunity() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to follow communities.");
      return followCommunity(token, communityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}

export function useUnfollowCommunity() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to unfollow communities.");
      return unfollowCommunity(token, communityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}
