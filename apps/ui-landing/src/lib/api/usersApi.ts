import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/user-accounts");

/**
 * User search result from the API.
 */
export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Search users by email (partial match, case-insensitive).
 * Returns up to 10 matching users.
 */
export async function searchUsers(
  token: string,
  query: string
): Promise<UserSearchResult[]> {
  const safeQuery = query.trim();
  if (safeQuery.length === 0) {
    return [];
  }

  const res = await API.get("/search", {
    headers: buildAuthHeaders(token),
    params: { q: safeQuery },
  });

  return res.data as UserSearchResult[];
}
