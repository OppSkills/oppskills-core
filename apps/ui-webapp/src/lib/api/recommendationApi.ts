import { buildAuthHeaders, createApiClient } from "./apiClient";
import type { LocationSuggestionDto } from "@oppskills/types";

const API = createApiClient("/recommendation/location");

/**
 * Get autocomplete suggestions for a location query string.
 */
export async function autocompleteLocation(
  token: string,
  query: string,
): Promise<LocationSuggestionDto[]> {
  const safeQuery = query.trim();
  if (safeQuery.length === 0) {
    return [];
  }

  try {
    const res = await API.get("/autocomplete", {
      headers: buildAuthHeaders(token),
      params: { q: safeQuery },
    });

    return res.data as LocationSuggestionDto[];
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    throw new Error("Failed to load location suggestions. Please try again.");
  }
}

