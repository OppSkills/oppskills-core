import { buildAuthHeaders, createApiClient } from "./apiClient";
import type { CommunityIndustryValue } from "@oppskills/types/enums";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid response: missing "${key}"`);
  }
  return value;
}

function optionalString(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const value = obj[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid response: invalid "${key}"`);
  }
  return value;
}

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

export async function listCommunityMembers(
  token: string,
  communityId: string,
): Promise<any[]> {
  const res = await API.get(`/${communityId}/members`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as any[];
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
