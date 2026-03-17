import { buildAuthHeaders, createApiClient } from "./apiClient";
import type {
  MeResponseDto,
  CreateOnboardingDto,
} from "@oppskills/types/frontend";

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

  try {
    const res = await API.get("/search", {
      headers: buildAuthHeaders(token),
      params: { q: safeQuery },
    });

    return res.data as UserSearchResult[];
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users. Please try again.");
  }
}

/**
 * Get current user profile with onboarding status.
 */
export async function getMe(token: string): Promise<MeResponseDto> {
  try {
    const res = await API.get("/me", {
      headers: buildAuthHeaders(token),
    });

    return res.data as MeResponseDto;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile. Please try again.");
  }
}

/**
 * Submit or update onboarding profile.
 */
export async function submitOnboarding(
  token: string,
  data: CreateOnboardingDto
): Promise<{ success: boolean; message: string; onboardingProfile: unknown }> {
  try {
    const res = await API.put("/onboarding", data, {
      headers: buildAuthHeaders(token),
    });

    return res.data;
  } catch (error) {
    console.error("Error submitting onboarding:", error);
    throw new Error("Failed to submit onboarding. Please try again.");
  }
}

/**
 * Get full profile data including stats/achievements.
 */
export async function getFullProfile(token: string): Promise<any> {
  try {
    const res = await API.get("/profile", {
      headers: buildAuthHeaders(token),
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching full profile:", error);
    throw new Error("Failed to fetch full profile. Please try again.");
  }
}

/**
 * Update user skills.
 */
export async function updateSkills(
  token: string,
  skills: string[]
): Promise<{ success: boolean }> {
  try {
    const res = await API.patch(
      "/skills",
      { skills },
      {
        headers: buildAuthHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating skills:", error);
    throw new Error("Failed to update skills. Please try again.");
  }
}

/**
 * Update user interests.
 */
export async function updateInterests(
  token: string,
  interests: string[]
): Promise<{ success: boolean }> {
  try {
    const res = await API.patch(
      "/interests",
      { interests },
      {
        headers: buildAuthHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating interests:", error);
    throw new Error("Failed to update interests. Please try again.");
  }
}

/**
 * Update comprehensive user profile.
 */
export async function updateProfile(
  token: string,
  data: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    userCategory?: string;
  }
): Promise<{ success: boolean }> {
  try {
    const res = await API.patch("/profile", data, {
      headers: buildAuthHeaders(token),
    });
    return res.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile. Please try again.");
  }
}/**
 * Update user education info.
 */
export async function updateEducation(
  token: string,
  data: {
    collegeId?: string;
    course?: string;
    courseSpecialization?: string;
    startYear?: string;
    endYear?: number;
    rollNumber?: string;
    cgpa?: string;
  }
): Promise<{ success: boolean }> {
  try {
    const res = await API.patch("/education", data, {
      headers: buildAuthHeaders(token),
    });
    return res.data;
  } catch (error) {
    console.error("Error updating education:", error);
    throw new Error("Failed to update education. Please try again.");
  }
}

