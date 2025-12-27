import axios from "axios";

import type { CreateTeamDto } from "@oppskills/types/frontend";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/hackathons");

// =====================
// Types
// =====================

export interface TeamMemberUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
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
  members: TeamMember[];
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
  },
): Promise<TeamDetailResponse> {
  const res = await API.post("/create-team", data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TeamDetailResponse;
}

/**
 * Joins a team by ID or invitation code.
 */
export async function joinTeam(
  token: string,
  data: JoinTeamDto,
): Promise<unknown> {
  const res = await API.post("/join-team", data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Joins a team by invitation code.
 */
export async function joinTeamByCode(
  token: string,
  invitationCode: string,
  answers?: Array<{ fieldId: string; value: string | number | string[] }>,
): Promise<unknown> {
  const res = await API.post(
    "/join-team",
    { invitationCode, answers },
    {
      headers: buildAuthHeaders(token),
    },
  );
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
): Promise<TeamDetailResponse & { invitationCode: string }> {
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
  },
): Promise<unknown> {
  const res = await API.post(`/${hackathonSlug}/teams/draft/join`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}
