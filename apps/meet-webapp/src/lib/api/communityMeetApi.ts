import { buildAuthHeaders, createApiClient } from "./apiClient";
import type {
  CommunityMeetResponse,
  CreateCommunityMeetDto,
} from "@oppskills/types";

const COMMUNITY_MEETS_API = createApiClient("/communities");

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

export function getMeetBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_MEET_BASE_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/g, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://meet.oppskills.com";
  }
  return "http://localhost:3003";
}

export function buildMeetUrl(inviteCode: string): string {
  return `${getMeetBaseUrl()}/${inviteCode}`;
}

function parseMeetResponse(
  raw: Record<string, unknown>,
): CommunityMeetResponse {
  const inviteCode = requireString(raw, "inviteCode");
  const communityId = raw["communityId"];
  return {
    id: requireString(raw, "id"),
    communityId:
      typeof communityId === "string" && communityId.trim().length > 0
        ? communityId
        : null,
    inviteCode,
    kind: requireString(raw, "kind") as CommunityMeetResponse["kind"],
    title: requireString(raw, "title"),
    description: optionalString(raw, "description"),
    scheduledStartAt: optionalString(raw, "scheduledStartAt"),
    audienceScope: requireString(
      raw,
      "audienceScope",
    ) as CommunityMeetResponse["audienceScope"],
    audienceFilter: optionalString(raw, "audienceFilter"),
    hostUserId: requireString(raw, "hostUserId"),
    hostName: requireString(raw, "hostName"),
    status: requireString(raw, "status") as CommunityMeetResponse["status"],
    meetUrl: buildMeetUrl(inviteCode),
    createdAt: requireString(raw, "createdAt"),
  };
}

export async function createCommunityMeet(
  token: string,
  communityId: string,
  data: CreateCommunityMeetDto,
): Promise<CommunityMeetResponse> {
  const res = await COMMUNITY_MEETS_API.post(`/${communityId}/meets`, data, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }
  return parseMeetResponse(raw);
}
