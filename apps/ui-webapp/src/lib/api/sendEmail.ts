import { toast } from "sonner";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/email");

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
  hackathonId?: string;
  htmlBody: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export async function sendEmail(
  token: string | null,
  payload: SendDirectMessagePayload
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
  payload: SendBulkEmailPayload
): Promise<ApiResponse> {
  if (!token) {
    const errorMsg = "User is not authenticated";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
  const res = await API.post("/bulk", payload, {
    headers: buildAuthHeaders(token),
  });
  return res.data as ApiResponse;
}
