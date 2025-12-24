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

// =====================
// API Functions
// =====================

/**
 * Creates a team for a hackathon.
 */
export async function createTeam(
  token: string,
  data: CreateTeamDto,
): Promise<unknown> {
  const res = await API.post("/create-team", data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Joins a team (payload depends on backend DTO).
 */
export async function joinTeam(
  token: string,
  data: CreateTeamDto,
): Promise<unknown> {
  const res = await API.post("/join-team", data, {
    headers: buildAuthHeaders(token),
  });
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
 * Lists teams for a given hackathon.
 */
export async function getTeamsByHackathon(
  token: string,
  hackathonId: string,
): Promise<unknown> {
  const res = await API.get(`/teams/${hackathonId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
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
