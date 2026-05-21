import { createApiClient, buildAuthHeaders } from "./apiClient";

const API = createApiClient("/waitlist");

export interface AddToWaitlistResponse {
  success: boolean;
  message: string;
}

export interface WaitlistStatusResponse {
  isOnWaitlist: boolean;
}

/**
 * Add user to waitlist for a feature.
 */
export async function addToWaitlist(
  token: string,
  feature: string,
): Promise<AddToWaitlistResponse> {
  try {
    const res = await API.post(
      "/",
      { feature },
      {
        headers: buildAuthHeaders(token),
      },
    );
    return res.data as AddToWaitlistResponse;
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    throw new Error("Failed to add to waitlist. Please try again.");
  }
}

/**
 * Check if user is on waitlist for a feature.
 */
export async function checkWaitlistStatus(
  token: string,
  feature: string,
): Promise<WaitlistStatusResponse> {
  try {
    const res = await API.get(`/${encodeURIComponent(feature)}`, {
      headers: buildAuthHeaders(token),
    });
    return res.data as WaitlistStatusResponse;
  } catch (error) {
    console.error("Error checking waitlist status:", error);
    throw new Error("Failed to check waitlist status. Please try again.");
  }
}
