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
  body: string;
}

export async function sendEmail(
  token: string | null,
  payload: SendDirectMessagePayload
): Promise<unknown> {
  if (!token) return toast.error("User is not authenticated");
  const res = await API.post("/messages/direct", payload, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}
