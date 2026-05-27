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

const locationAPI = createApiClient("/location");

/**
 * Send user coordinates to the backend to be logged.
 */
export async function sendUserLocation(
  token: string | null | undefined,
  coords: { latitude: number; longitude: number },
): Promise<{ success: boolean }> {
  try {
    const res = await locationAPI.post("", coords, {
      headers: token ? buildAuthHeaders(token) : {},
    });
    return res.data;
  } catch (error) {
    console.error("Error sending user location:", error);
    throw new Error("Failed to send user location.");
  }
}
