import { buildAuthHeaders, createApiClient } from "./apiClient";

const AUTH_API = createApiClient("/skills");

export interface Skill {
  id: string;
  name: string;
  slug: string;
  platformScore: number;
}

/**
 * Fetches skills from the backend in-memory cache.
 * - Empty `q` returns the top N skills by platformScore (use for initial load).
 * - Non-empty `q` returns a keyword-filtered list (use for autocomplete on
 *   skills not present in the locally cached list).
 */
export async function searchSkills(
  token: string,
  q: string,
  limit?: number,
): Promise<Skill[]> {
  const res = await AUTH_API.get("/search", {
    params: { q: q || undefined, limit },
    headers: buildAuthHeaders(token),
  });
  return res.data as Skill[];
}
