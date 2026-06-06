import { buildAuthHeaders, createApiClient, isRecord, requireString, optionalString } from "./apiClient";
import type { CommunityIndustryValue } from "@oppskills/types/enums";
import type { PaginatedCommunityMembers, CommunityMember } from "@oppskills/types";


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

export type CommunityMyRole = "OWNER" | "ADMIN" | "MODERATOR" | "READ_ONLY";

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
): Promise<ReadonlyArray<MyCommunityListItem>> {
  const res = await API.get("/my", {
    headers: buildAuthHeaders(token),
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

export async function getUniqueMemberTypes(
  token: string,
  communityId: string,
): Promise<string[]> {
  const res = await API.get(`/${communityId}/members/types`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as string[];
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

export type CommunityStatsResponse = Readonly<{
  totalMembers: number;
  newMembers30Days: number;
  pageImpressions: number;
  postImpressions: number;
  adminCount: number;
  moderatorCount: number;
}>;

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
    newMembers30Days:
      typeof raw.newMembers30Days === "number" ? raw.newMembers30Days : 0,
    pageImpressions:
      typeof raw.pageImpressions === "number" ? raw.pageImpressions : 0,
    postImpressions:
      typeof raw.postImpressions === "number" ? raw.postImpressions : 0,
    adminCount: typeof raw.adminCount === "number" ? raw.adminCount : 0,
    moderatorCount:
      typeof raw.moderatorCount === "number" ? raw.moderatorCount : 0,
  };
}

export async function getPublicCommunityByHandle(
  handle: string,
): Promise<CommunityResponse> {
  const safeHandle = handle.trim();
  if (safeHandle.length === 0) {
    throw new Error("Community handle is required.");
  }
  const res = await API.get(`/public/by-handle/${encodeURIComponent(safeHandle)}`);
  return res.data as CommunityResponse;
}

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
