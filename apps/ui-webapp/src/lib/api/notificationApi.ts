import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/notification");

export interface NotificationLog {
  id: string;
  level: string;
  message: string;
  meta?: any;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  eventId?: string;
  hackathonId?: string;
  communityId?: string;
  communityAudience?: string | null;
  content: string;
  scheduleType: "IMMEDIATELY" | "CUSTOM";
  scheduledAt?: string;
  status:
    | "DRAFT"
    | "QUEUED"
    | "PROCESSING"
    | "PAUSED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  totalRecipients: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  expectedFinishAt?: string;
  completedAt?: string;
  createdAt: string;
  logs?: NotificationLog[];
}

export async function getNotificationsForEvent(
  token: string | null,
  eventSlugOrId: string,
): Promise<NotificationRecord[]> {
  const res = await API.get(`/event/${eventSlugOrId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getNotificationsForHackathon(
  token: string | null,
  hackathonSlugOrId: string,
): Promise<NotificationRecord[]> {
  const res = await API.get(`/hackathon/${hackathonSlugOrId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getNotificationsForCommunity(
  token: string | null,
  communityId: string,
): Promise<NotificationRecord[]> {
  const res = await API.get(`/community/${communityId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getCommunityNotificationAudienceCount(
  token: string | null,
  communityId: string,
  audience: string,
): Promise<{ audience: string; count: number }> {
  const res = await API.get(`/community/${communityId}/audience-count`, {
    headers: buildAuthHeaders(token),
    params: { audience },
  });
  return res.data;
}

export async function getNotificationDetails(
  token: string | null,
  id: string,
): Promise<NotificationRecord> {
  const res = await API.get(`/${id}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function deleteNotification(
  token: string | null,
  id: string,
): Promise<void> {
  await API.delete(`/${id}`, {
    headers: buildAuthHeaders(token),
  });
}
