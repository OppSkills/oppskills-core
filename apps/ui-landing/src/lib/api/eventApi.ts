import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/events");

/**
 * Lists events.
 */
export async function getEvents(token: string): Promise<unknown> {
  const res = await API.get("", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Creates a new event.
 */
export async function createEvent(token: string, data: any): Promise<unknown> {
  const res = await API.post("", data, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Updates an event.
 */
export async function updateEvent(
  token: string,
  id: string,
  data: any
): Promise<unknown> {
  const res = await API.put(`/${id}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Deletes an event.
 */
export async function deleteEvent(token: string, id: string): Promise<unknown> {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}
