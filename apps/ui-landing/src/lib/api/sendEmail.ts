import { createApiClient } from "./apiClient";

const API = createApiClient("/emails");

export interface SendDirectMessagePayload {
    userId: string;
    email: string;
    firstName?: string;
    eventId: string;
    eventName: string;
    eventSlug: string;
    body: string;
}

export async function sendEmail(payload: SendDirectMessagePayload): Promise<unknown> {
    const res = await API.post("/messages/direct", payload);
    return res.data as unknown;
}