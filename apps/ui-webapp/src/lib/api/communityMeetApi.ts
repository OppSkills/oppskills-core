import {
  buildAuthHeaders,
  createApiClient,
  isRecord,
  requireString,
  optionalString,
} from "./apiClient";
import type {
  CommunityMeetResponse,
  CreateCommunityMeetDto,
  MeetJoinTokenResponse,
  MeetPreviewResponse,
} from "@oppskills/types";

const COMMUNITY_MEETS_API = createApiClient("/communities");
const MEETS_API = createApiClient("/meets");

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
    // Build from frontend base URL config to avoid backend fallback leaking localhost.
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

export async function listCommunityMeets(
  token: string,
  communityId: string,
): Promise<ReadonlyArray<CommunityMeetResponse>> {
  const res = await COMMUNITY_MEETS_API.get(`/${communityId}/meets`, {
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
      throw new Error("Invalid response: expected meet object.");
    }
    return parseMeetResponse(entry);
  });
}

export async function getMeetPreview(
  token: string,
  inviteCode: string,
): Promise<MeetPreviewResponse> {
  const res = await MEETS_API.get(`/${inviteCode}`, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    inviteCode: requireString(raw, "inviteCode"),
    title: requireString(raw, "title"),
    description: optionalString(raw, "description"),
    kind: requireString(raw, "kind") as MeetPreviewResponse["kind"],
    status: requireString(raw, "status") as MeetPreviewResponse["status"],
    scheduledStartAt: optionalString(raw, "scheduledStartAt"),
    communityName: optionalString(raw, "communityName"),
    hostName: requireString(raw, "hostName"),
    hostUserId: requireString(raw, "hostUserId"),
    audienceScope: requireString(
      raw,
      "audienceScope",
    ) as MeetPreviewResponse["audienceScope"],
  };
}

export async function getMeetJoinToken(
  token: string,
  inviteCode: string,
): Promise<MeetJoinTokenResponse> {
  const res = await MEETS_API.post(
    `/${inviteCode}/token`,
    {},
    {
      headers: buildAuthHeaders(token),
    },
  );

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    token: requireString(raw, "token"),
    livekitUrl: requireString(raw, "livekitUrl"),
    roomName: requireString(raw, "roomName"),
    participantName: requireString(raw, "participantName"),
    participantIdentity: requireString(raw, "participantIdentity"),
  };
}

export function toCommunityMeetUi(
  meet: CommunityMeetResponse,
): import("@oppskills/types").CommunityMeet {
  const scheduled = meet.scheduledStartAt
    ? new Date(meet.scheduledStartAt)
    : new Date(meet.createdAt);

  return {
    id: meet.id,
    title: meet.title,
    date: scheduled.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: scheduled.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    inviteCode: meet.inviteCode,
    link: meet.meetUrl,
    description: meet.description ?? undefined,
    kind: meet.kind,
    audienceScope: meet.audienceScope,
    status: meet.status,
    hostName: meet.hostName,
  };
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
