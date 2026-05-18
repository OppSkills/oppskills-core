import { buildAuthHeaders, createApiClient } from "./apiClient";
import type { CollegeSearchResultDto } from "@oppskills/types";

const API = createApiClient("/colleges");

/**
 * Search colleges by name for autocomplete combobox.
 * Returns up to 15 matching colleges.
 */
export async function searchColleges(
  token: string,
  query: string
): Promise<CollegeSearchResultDto[]> {
  const safeQuery = query.trim();
  if (safeQuery.length === 0) {
    return [];
  }

  try {
    const res = await API.get("/search", {
      headers: buildAuthHeaders(token),
      params: { q: safeQuery },
    });

    return res.data as CollegeSearchResultDto[];
  } catch (error) {
    console.error("Error searching colleges:", error);
    throw new Error("Failed to search colleges. Please try again.");
  }
}

/**
 * Get colleges by their IDs.
 * Returns colleges matching the provided IDs.
 */
export async function getCollegesByIds(
  token: string,
  ids: string[]
): Promise<CollegeSearchResultDto[]> {
  if (ids.length === 0) {
    return [];
  }

  try {
    const res = await API.get("/by-ids", {
      headers: buildAuthHeaders(token),
      params: { ids: ids.join(",") },
    });

    return res.data as CollegeSearchResultDto[];
  } catch (error) {
    console.error("Error fetching colleges by IDs:", error);
    throw new Error("Failed to fetch colleges. Please try again.");
  }
}
