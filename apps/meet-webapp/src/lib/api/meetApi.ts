import axios from "axios";
import type {
  CommunityMeetResponse,
  CreateCommunityMeetDto,
  MeetJoinTokenResponse,
  MeetPreviewResponse,
} from "@oppskills/types";
import { buildMeetUrl } from "@/lib/api/communityMeetApi";

function getApiRootUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/g, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://api.oppskills.com";
  }
  return "http://localhost:3001";
}

const client = axios.create({
  baseURL: `${getApiRootUrl()}/meets`,
});

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
    hostUserId: requireString(raw, "hostUserId"),
    hostName: requireString(raw, "hostName"),
    status: requireString(raw, "status") as CommunityMeetResponse["status"],
    meetUrl: buildMeetUrl(inviteCode),
    createdAt: requireString(raw, "createdAt"),
  };
}

export async function createMeet(
  token: string,
  data: CreateCommunityMeetDto,
): Promise<CommunityMeetResponse> {
  const res = await client.post("", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }
  return parseMeetResponse(raw);
}

export async function getMeetPreview(
  token: string,
  inviteCode: string,
): Promise<MeetPreviewResponse> {
  const res = await client.get(`/${inviteCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as MeetPreviewResponse;
}

export async function getMeetJoinToken(
  token: string,
  inviteCode: string,
): Promise<MeetJoinTokenResponse> {
  const res = await client.post(
    `/${inviteCode}/token`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data as MeetJoinTokenResponse;
}
