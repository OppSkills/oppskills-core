import { toast } from "sonner";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/email");
const NOTIFICATION_API = createApiClient("/notification");

export interface SendDirectMessagePayload {
  userId: string;
  email: string;
  firstName?: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  htmlBody: string;
}

export interface SendBulkEmailPayload {
  eventId?: string;
  eventSlug?: string;
  hackathonId?: string;
  hackathonSlug?: string;
  communityId?: string;
  htmlBody: string;
  scheduledAt?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export async function sendEmail(
  token: string | null,
  payload: SendDirectMessagePayload,
): Promise<ApiResponse> {
  if (!token) {
    const errorMsg = "User is not authenticated";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
  const res = await API.post("/messages/direct", payload, {
    headers: buildAuthHeaders(token),
  });
  return res.data as ApiResponse;
}

export async function sendBulkEmail(
  token: string | null,
  payload: SendBulkEmailPayload,
): Promise<ApiResponse> {
  if (!token) {
    const errorMsg = "User is not authenticated";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  const mappedPayload = {
    eventId: payload.eventId || undefined,
    eventSlug: payload.eventSlug || undefined,
    hackathonId: payload.hackathonId || undefined,
    hackathonSlug: payload.hackathonSlug || undefined,
    communityId: payload.communityId || undefined,
    content: payload.htmlBody,
    scheduleType: payload.scheduledAt ? "CUSTOM" : "IMMEDIATELY",
    scheduledAt: payload.scheduledAt
      ? new Date(payload.scheduledAt).toISOString()
      : undefined,
  };

  const res = await NOTIFICATION_API.post("/schedule", mappedPayload, {
    headers: buildAuthHeaders(token),
  });
  return res.data as ApiResponse;
}
