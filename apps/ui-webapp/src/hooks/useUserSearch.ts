import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { searchUsers, type UserSearchResult } from "@/lib/api/usersApi";

/**
 * Ensures we have a token for authenticated API calls.
 */
function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

/**
 * Query key for user search.
 */
export function getUserSearchQueryKey(query: string) {
  return ["users", "search", query] as const;
}

/**
 * Hook to search users by email using React Query.
 * Only runs when enabled is true and query has at least 2 characters.
 *
 * @param query - Search query string
 * @param enabled - Whether the query should be enabled
 */
export function useUserSearch(query: string, enabled: boolean = true) {
  const { getToken } = useAuth();
  const trimmedQuery = query.trim();
  const shouldFetch = enabled && trimmedQuery.length >= 2;

  return useQuery<UserSearchResult[]>({
    queryKey: getUserSearchQueryKey(trimmedQuery),
    enabled: shouldFetch,
    staleTime: 30000, // 30 seconds
    queryFn: async () => {
      if (trimmedQuery.length < 2) {
        return [];
      }
      const token = requireToken(await getToken());
      return searchUsers(token, trimmedQuery);
    },
  });
}
