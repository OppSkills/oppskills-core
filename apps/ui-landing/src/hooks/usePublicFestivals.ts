import { useInfiniteQuery } from "@tanstack/react-query";
import { getFestivals } from "@/lib/api/festivalApi";
import type { FestivalListItem } from "@/components/landingpage/_components/FestivalCard";

/**
 * Fetches public festivals (no auth required).
 */
export function usePublicFestivals(options?: { enabled?: boolean }) {
  return useInfiniteQuery<FestivalListItem[], Error>({
    queryKey: ["public-festivals"] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await getFestivals(null);
      // API returns array or { data: [] }
      if (Array.isArray(data)) return data as FestivalListItem[];
      const inner = (data as any)?.data;
      if (Array.isArray(inner)) return inner as FestivalListItem[];
      return [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return undefined; // No pagination needed for home page festivals
    },
    enabled: options?.enabled,
  });
}
