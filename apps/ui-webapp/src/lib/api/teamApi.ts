import axios from "axios";

import type { CreateTeamDto } from "@oppskills/types/frontend";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/hackathons");

function getReferralCodeFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)oppskills_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

// =====================
// Types
// =====================

export interface TeamMemberUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  onboardingProfile?: {
    userCategory: string;
    schoolName: string | null;
    schoolClass: string | null;
    college: {
      id: string;
      name: string;
      city: string;
      state: string;
      country: string;
    } | null;
    collegeCurrentYear: string | null;
    collegePassoutYear: number | null;
    companyName: string | null;
    jobTitle: string | null;
    locationCity: string;
    locationState: string;
    locationCountry: string;
  } | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  joinedAt: string;
  user: TeamMemberUser;
}

export interface TeamLeader {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  onboardingProfile?: TeamMemberUser["onboardingProfile"];
}

export interface TeamDetailResponse {
  id: string;
  name: string;
  hackathonId: string;
  leaderId: string;
  maxSize: number;
  invitationCode: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  leader: TeamLeader;
  /** May be omitted on some create/join responses; treat as [] when missing */
  members?: TeamMember[];
  hackathon?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface JoinTeamDto {
  teamId?: string;
  invitationCode?: string;
  answers?: Array<{ fieldId: string; value: string | number | string[] }>;
  referralCode?: string;
}

// =====================
// API Functions
// =====================

/**
 * Creates a team for a hackathon.
 */
export async function createTeam(
  token: string,
  data: CreateTeamDto & {
    answers?: Array<{ fieldId: string; value: string | number | string[] }>;
    referralCode?: string;
  },
): Promise<TeamDetailResponse> {
  const referralCode = data.referralCode ?? getReferralCodeFromCookie();
  const payload = { ...data, ...(referralCode ? { referralCode } : {}) };
  const res = await API.post("/create-team", payload, {
    headers: buildAuthHeaders(token),
  });
  if (typeof document !== "undefined" && referralCode) {
    document.cookie = "oppskills_ref=; Path=/; Max-Age=0";
  }
  return res.data as TeamDetailResponse;
}

/**
 * Joins a team by ID or invitation code.
 */
export async function joinTeam(
  token: string,
  data: JoinTeamDto,
): Promise<unknown> {
  const referralCode = data.referralCode ?? getReferralCodeFromCookie();
  const payload = { ...data, ...(referralCode ? { referralCode } : {}) };
  const res = await API.post("/join-team", payload, {
    headers: buildAuthHeaders(token),
  });
  if (typeof document !== "undefined" && referralCode) {
    document.cookie = "oppskills_ref=; Path=/; Max-Age=0";
  }
  return res.data as unknown;
}

/**
 * Joins a team by invitation code.
 */
export async function joinTeamByCode(
  token: string,
  invitationCode: string,
  answers?: Array<{ fieldId: string; value: string | number | string[] }>,
  referralCode?: string,
): Promise<unknown> {
  const code = referralCode ?? getReferralCodeFromCookie();
  const res = await API.post(
    "/join-team",
    { invitationCode, answers, ...(code ? { referralCode: code } : {}) },
    {
      headers: buildAuthHeaders(token),
    },
  );
  if (typeof document !== "undefined" && code) {
    document.cookie = "oppskills_ref=; Path=/; Max-Age=0";
  }
  return res.data as unknown;
}

/**
 * Leaves a team.
 */
export async function leaveTeam(
  token: string,
  teamId: string,
): Promise<unknown> {
  const res = await API.delete(`/leave-team/${teamId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

export async function removeMember(
  token: string,
  teamId: string,
  userId: string,
): Promise<{ message: string }> {
  const res = await API.delete(`/leave-team/${teamId}/member/${userId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

/**
 * Lists open teams for a given hackathon.
 */
export async function getTeamsByHackathon(
  token: string,
  hackathonId: string,
): Promise<TeamDetailResponse[]> {
  const res = await API.get(`/teams/${hackathonId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TeamDetailResponse[];
}

/**
 * Fetches a single team by id.
 */
export async function getTeamById(
  token: string,
  teamId: string,
): Promise<TeamDetailResponse> {
  const res = await API.get(`/team/${teamId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TeamDetailResponse;
}

/**
 * Check if the current user is already in a team for a hackathon.
 * Returns the team if found, null otherwise.
 */
export async function checkMyHackathonTeam(
  token: string,
  hackathonId: string,
): Promise<TeamDetailResponse | null> {
  try {
    const res = await API.get(`/my-team`, {
      params: { hackathonId },
      headers: buildAuthHeaders(token),
    });
    return res.data as TeamDetailResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface DraftTeamResponse {
  team: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    maxSize: number;
    invitationCode: string;
    isOpen: boolean;
    hackathonId: string;
    creatorId: string;
    leaderId: string;
    leader: TeamLeader;
  };
  hackathon: {
    id: string;
    slug: string;
    name: string;
  };
  invitationCode: string;
}

/**
 * Creates a draft team (for paid hackathons).
 */
export async function createDraftTeam(
  token: string,
  hackathonSlug: string,
  data: {
    name: string;
    maxSize?: number;
  },
): Promise<DraftTeamResponse> {
  const res = await API.post(`/${hackathonSlug}/teams/draft`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

/**
 * Joins a draft team (for paid hackathons).
 */
export async function joinDraftTeam(
  token: string,
  hackathonSlug: string,
  data: {
    teamId?: string;
    invitationCode?: string;
    /** Defaults to the `oppskills_ref` cookie when not provided. */
    referralCode?: string;
  },
): Promise<unknown> {
  const referralCode = data.referralCode ?? getReferralCodeFromCookie();
  const payload = { ...data, ...(referralCode ? { referralCode } : {}) };
  const res = await API.post(`/${hackathonSlug}/teams/draft/join`, payload, {
    headers: buildAuthHeaders(token),
  });
  if (typeof document !== "undefined" && referralCode) {
    document.cookie = "oppskills_ref=; Path=/; Max-Age=0";
  }
  return res.data;
}

/**
 * PER_USER paid hackathons: true if user already completed entry fee for this hackathon
 * (join another team without paying again).
 */
export async function getPerUserFeePaidStatus(
  token: string,
  hackathonSlug: string,
): Promise<{ hasPaid: boolean }> {
  const res = await API.get(
    `/${hackathonSlug}/teams/draft/per-user-fee-status`,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data as { hasPaid: boolean };
}
