import axios from "axios";
import type { MeetJoinTokenResponse, MeetPreviewResponse } from "@oppskills/types";

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
