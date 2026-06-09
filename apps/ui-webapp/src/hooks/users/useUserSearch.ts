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
 * True when the input looks like a complete email (local@domain.tld).
 * Used for Google Docs–style sharing: search only fires after a full address.
 */
export function looksLikeCompleteEmail(input: string): boolean {
  const s = input.trim();
  if (s.length < 5) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(s);
}

export type UseUserSearchOptions = {
  /**
   * When true, only runs the search once the query looks like a full email address.
   * When false (default), runs after 2+ characters (legacy partial-email search).
   */
  requireCompleteEmail?: boolean;
};

/**
 * Query key for user search.
 */
export function getUserSearchQueryKey(query: string) {
  return ["users", "search", query] as const;
}

/**
 * Hook to search users by email using React Query.
 * By default runs when enabled is true and query has at least 2 characters.
 * With `requireCompleteEmail: true`, runs only when the query looks like a full email.
 *
 * @param query - Search query string
 * @param enabled - Whether the query should be enabled
 */
export function useUserSearch(
  query: string,
  enabled: boolean = true,
  options?: UseUserSearchOptions,
) {
  const { getToken } = useAuth();
  const requireCompleteEmail = options?.requireCompleteEmail === true;
  const trimmedQuery = query.trim();
  const shouldFetch = enabled
    ? requireCompleteEmail
      ? looksLikeCompleteEmail(trimmedQuery)
      : trimmedQuery.length >= 2
    : false;

  return useQuery<UserSearchResult[]>({
    queryKey: getUserSearchQueryKey(trimmedQuery),
    enabled: shouldFetch,
    staleTime: 30000, // 30 seconds
    queryFn: async () => {
      if (requireCompleteEmail) {
        if (!looksLikeCompleteEmail(trimmedQuery)) {
          return [];
        }
      } else if (trimmedQuery.length < 2) {
        return [];
      }
      const token = requireToken(await getToken());
      return searchUsers(token, trimmedQuery);
    },
  });
}
