import {
  buildAuthHeaders,
  createApiClient,
  isRecord,
  requireString,
  optionalString,
} from "./apiClient";
import type { CommunityIndustryValue } from "@oppskills/types/enums";
import type {
  CommunityMemberTypesResponse,
  PaginatedCommunityMembers,
  CommunityMember,
  PublicCommunityListResponse,
  PublicCommunityProfile,
  UpdateCommunityDto,
  PaginatedPublicCommunityMembers,
  PublicCommunityListItem,
} from "@oppskills/types";

const API = createApiClient("/communities");

export type CreateCommunityRequest = Readonly<{
  name: string;
  handle: string;
  description?: string;
  website?: string;
  industry: CommunityIndustryValue;
  coverImage?: string;
  avatarImage?: string;
}>;

export type CommunityResponse = Readonly<{
  id: string;
  name: string;
  handle: string;
  description: string | null;
  website: string | null;
  industry: CommunityIndustryValue;
  coverImage: string | null;
  avatarImage: string | null;
  ownerId: string;
  createdAt: string;
}>;

export type CommunityMyRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "READ_ONLY"
  | "FOLLOWER";

export const COMMUNITY_ROSTER_TAB = "Community Roster";
export const FOLLOWERS_TAB = "Followers";
export const INTERNAL_MEMBERS_TAB = "Internal Members";

export type MyCommunityListItem = Readonly<{
  id: string;
  name: string;
  handle: string;
  coverImage: string | null;
  avatarImage: string | null;
  industry: CommunityIndustryValue;
  myRole: CommunityMyRole;
  createdAt: string;
}>;

export type CommunityStatsResponse = Readonly<{
  totalMembers: number;
  followerCount: number;
  rosterCount: number;
  newMembers30Days: number;
  pageImpressions: number;
  postImpressions: number;
  postViews: number;
  adminCount: number;
  moderatorCount: number;
}>;

// ---------------------------------------------------------------------------
// Community CRUD
// ---------------------------------------------------------------------------

export async function createCommunity(
  token: string,
  data: CreateCommunityRequest,
): Promise<CommunityResponse> {
  const res = await API.post("", data, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    id: requireString(raw, "id"),
    name: requireString(raw, "name"),
    handle: requireString(raw, "handle"),
    description: optionalString(raw, "description"),
    website: optionalString(raw, "website"),
    industry: requireString(raw, "industry") as CommunityIndustryValue,
    coverImage: optionalString(raw, "coverImage"),
    avatarImage: optionalString(raw, "avatarImage"),
    ownerId: requireString(raw, "ownerId"),
    createdAt: requireString(raw, "createdAt"),
  };
}

export async function getMyCommunities(
  token: string,
  includeFollowed?: boolean,
): Promise<ReadonlyArray<MyCommunityListItem>> {
  const res = await API.get("/my", {
    headers: buildAuthHeaders(token),
    params:
      includeFollowed !== undefined
        ? { includeFollowed: String(includeFollowed) }
        : undefined,
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }
  const items = raw["items"];
  if (!Array.isArray(items)) {
    throw new Error('Invalid response: missing "items" array.');
  }

  return items.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Invalid response: expected community object.");
    }
    return {
      id: requireString(entry, "id"),
      name: requireString(entry, "name"),
      handle: requireString(entry, "handle"),
      coverImage: optionalString(entry, "coverImage"),
      avatarImage: optionalString(entry, "avatarImage"),
      industry: requireString(entry, "industry") as CommunityIndustryValue,
      myRole: requireString(entry, "myRole") as CommunityMyRole,
      createdAt: requireString(entry, "createdAt"),
    };
  });
}

export async function getCommunity(
  token: string,
  id: string,
): Promise<CommunityResponse> {
  const res = await API.get(`/${id}`, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    id: requireString(raw, "id"),
    name: requireString(raw, "name"),
    handle: requireString(raw, "handle"),
    description: optionalString(raw, "description"),
    website: optionalString(raw, "website"),
    industry: requireString(raw, "industry") as CommunityIndustryValue,
    coverImage: optionalString(raw, "coverImage"),
    avatarImage: optionalString(raw, "avatarImage"),
    ownerId: requireString(raw, "ownerId"),
    createdAt: requireString(raw, "createdAt"),
  };
}

export async function updateCommunity(
  token: string,
  id: string,
  data: UpdateCommunityDto,
): Promise<CommunityResponse> {
  const res = await API.patch(`/${id}`, data, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    id: requireString(raw, "id"),
    name: requireString(raw, "name"),
    handle: requireString(raw, "handle"),
    description: optionalString(raw, "description"),
    website: optionalString(raw, "website"),
    industry: requireString(raw, "industry") as CommunityIndustryValue,
    coverImage: optionalString(raw, "coverImage"),
    avatarImage: optionalString(raw, "avatarImage"),
    ownerId: requireString(raw, "ownerId"),
    createdAt: requireString(raw, "createdAt"),
  };
}

// ---------------------------------------------------------------------------
// Handle utilities
// ---------------------------------------------------------------------------

export async function checkCommunityHandleAvailability(
  handle: string,
): Promise<{ available: boolean }> {
  const res = await API.get("/handles/check", {
    params: { handle },
  });
  const raw = res.data as unknown;
  if (!isRecord(raw) || typeof raw.available !== "boolean") {
    throw new Error('Invalid response: missing "available".');
  }
  return { available: raw.available };
}

export async function suggestCommunityHandles(
  name: string,
): Promise<{ suggestions: string[] }> {
  const res = await API.get("/handles/suggest", {
    params: { name },
  });
  const raw = res.data as unknown;
  if (!isRecord(raw) || !Array.isArray(raw.suggestions)) {
    throw new Error('Invalid response: missing "suggestions".');
  }
  return {
    suggestions: raw.suggestions.filter(
      (item): item is string => typeof item === "string",
    ),
  };
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

function parseMemberTypesResponse(data: unknown): CommunityMemberTypesResponse {
  if (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as CommunityMemberTypesResponse).types) &&
    Array.isArray((data as CommunityMemberTypesResponse).storedLabels)
  ) {
    return data as CommunityMemberTypesResponse;
  }
  throw new Error("Invalid response: expected member types object.");
}

export async function getUniqueMemberTypes(
  token: string,
  communityId: string,
): Promise<CommunityMemberTypesResponse> {
  const res = await API.get(`/${communityId}/members/types`, {
    headers: buildAuthHeaders(token),
  });
  return parseMemberTypesResponse(res.data);
}

export async function createMemberType(
  token: string,
  communityId: string,
  role: string,
): Promise<CommunityMemberTypesResponse> {
  const res = await API.post(
    `/${communityId}/members/types`,
    { role },
    {
      headers: buildAuthHeaders(token),
    },
  );
  return parseMemberTypesResponse(res.data);
}

export async function deleteMemberType(
  token: string,
  communityId: string,
  role: string,
): Promise<CommunityMemberTypesResponse> {
  const res = await API.delete(`/${communityId}/members/types`, {
    headers: buildAuthHeaders(token),
    data: { role },
  });
  return parseMemberTypesResponse(res.data);
}

export async function addCommunityMembers(
  token: string,
  communityId: string,
  data: {
    userIds: string[];
    role: string;
    accessControlRole: string;
  },
): Promise<{ success: boolean; count: number }> {
  const res = await API.post(`/${communityId}/members`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as { success: boolean; count: number };
}

export async function updateMemberType(
  token: string,
  communityId: string,
  memberId: string,
  role: string,
): Promise<any> {
  const res = await API.patch(
    `/${communityId}/members/${memberId}/type`,
    { role },
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function updateMemberAccess(
  token: string,
  communityId: string,
  memberId: string,
  accessControlRole: string,
): Promise<any> {
  const res = await API.patch(
    `/${communityId}/members/${memberId}/access-control`,
    { accessControlRole },
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function getMyMemberRecord(
  token: string,
  communityId: string,
): Promise<CommunityMember> {
  const res = await API.get(`/${communityId}/members/me`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as CommunityMember;
}

export async function listCommunityMembers(
  token: string,
  communityId: string,
  params?: {
    page?: number;
    take?: number;
    search?: string;
    role?: string;
    sortDirection?: string | null;
  },
): Promise<PaginatedCommunityMembers> {
  const res = await API.get(`/${communityId}/members`, {
    headers: buildAuthHeaders(token),
    params,
  });
  return res.data as PaginatedCommunityMembers;
}

export async function deleteCommunityMember(
  token: string,
  communityId: string,
  memberId: string,
): Promise<any> {
  const res = await API.delete(`/${communityId}/members/${memberId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getCommunityStats(
  token: string,
  communityId: string,
): Promise<CommunityStatsResponse> {
  const res = await API.get(`/${communityId}/stats`, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    totalMembers: typeof raw.totalMembers === "number" ? raw.totalMembers : 0,
    followerCount:
      typeof raw.followerCount === "number" ? raw.followerCount : 0,
    rosterCount:
      typeof raw.rosterCount === "number"
        ? raw.rosterCount
        : (typeof raw.totalMembers === "number" ? raw.totalMembers : 0) +
          (typeof raw.followerCount === "number" ? raw.followerCount : 0),
    newMembers30Days:
      typeof raw.newMembers30Days === "number" ? raw.newMembers30Days : 0,
    pageImpressions:
      typeof raw.pageImpressions === "number" ? raw.pageImpressions : 0,
    postImpressions:
      typeof raw.postImpressions === "number" ? raw.postImpressions : 0,
    postViews: typeof raw.postViews === "number" ? raw.postViews : 0,
    adminCount: typeof raw.adminCount === "number" ? raw.adminCount : 0,
    moderatorCount:
      typeof raw.moderatorCount === "number" ? raw.moderatorCount : 0,
  };
}

// ---------------------------------------------------------------------------
// Follow / Unfollow
// ---------------------------------------------------------------------------

export async function followCommunity(
  token: string,
  communityId: string,
): Promise<{ following: boolean; memberCount: number }> {
  const res = await API.post(
    `/${communityId}/follow`,
    {},
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { following: boolean; memberCount: number };
}

export async function unfollowCommunity(
  token: string,
  communityId: string,
): Promise<{ following: boolean; memberCount: number }> {
  const res = await API.delete(`/${communityId}/follow`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as { following: boolean; memberCount: number };
}

// ---------------------------------------------------------------------------
// Join
// ---------------------------------------------------------------------------

export async function joinCommunity(
  token: string,
  communityId: string,
  referralCode?: string,
): Promise<{ success: boolean; memberId: string }> {
  const res = await API.post(
    `/${communityId}/join`,
    { referralCode },
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { success: boolean; memberId: string };
}

// ---------------------------------------------------------------------------
// Public endpoints (no auth required)
// ---------------------------------------------------------------------------

export async function getPublicCommunities(
  params: {
    page?: number;
    take?: number;
    q?: string;
    industry?: string[];
    sort?: string;
    sortOrder?: "asc" | "desc";
  } = {},
): Promise<PublicCommunityListResponse> {
  const res = await API.get("/public", { params });
  return res.data as PublicCommunityListResponse;
}

export async function getPublicCommunityByHandle(
  handle: string,
  token?: string,
): Promise<PublicCommunityProfile> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await API.get(`/public/${handle}`, { headers });
  return res.data as PublicCommunityProfile;
}

export async function getPublicCommunityMembers(
  handle: string,
  params?: {
    page?: number;
    take?: number;
    search?: string;
  },
): Promise<PaginatedPublicCommunityMembers> {
  const res = await API.get(`/public/${handle}/members`, { params });
  return res.data as PaginatedPublicCommunityMembers;
}

export async function getTrendingCommunities(
  token?: string,
  limit?: number,
): Promise<ReadonlyArray<PublicCommunityListItem>> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await API.get("/public/trending", {
    headers,
    params: limit !== undefined ? { limit: String(limit) } : undefined,
  });

  const raw = res.data as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Invalid response: expected array.");
  }

  return raw.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Invalid response: expected community object.");
    }
    return {
      id: requireString(entry, "id"),
      name: requireString(entry, "name"),
      handle: requireString(entry, "handle"),
      description: optionalString(entry, "description"),
      industry: requireString(entry, "industry") as CommunityIndustryValue,
      coverImage: optionalString(entry, "coverImage"),
      avatarImage: optionalString(entry, "avatarImage"),
      memberCount:
        typeof entry.memberCount === "number" ? entry.memberCount : 0,
      postCount: typeof entry.postCount === "number" ? entry.postCount : 0,
      createdAt: requireString(entry, "createdAt"),
      myRole: optionalString(entry, "myRole") as CommunityMyRole | undefined,
    };
  });
}

export type PostableCommunity = Readonly<{
  id: string;
  name: string;
  handle: string;
}>;

export async function getPostableCommunities(
  token: string,
): Promise<ReadonlyArray<PostableCommunity>> {
  const res = await API.get("/postable", {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Invalid response: expected array.");
  }

  return raw.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Invalid response: expected community object.");
    }
    return {
      id: requireString(entry, "id"),
      name: requireString(entry, "name"),
      handle: requireString(entry, "handle"),
    };
  });
}
