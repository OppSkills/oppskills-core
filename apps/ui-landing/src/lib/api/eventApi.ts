import type {
  CreateEventDto,
  UpdateEventDto,
  AddEventRoleDto,
  RemoveEventRoleDto,
  EventRolesResponse,
  EventPrizeBreakdownDto,
  EventRegistrationFormDto,
  EventAdditionalInfoDto,
} from "@oppskills/types/frontend";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/events");

/**
 * Lists all events visible to the current user.
 */
export async function getEvents(token: string): Promise<unknown> {
  const res = await API.get("", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches events visible on the dashboard for the current user:
 * - Owned events
 * - Events where the user is a MANAGER
 *
 * Note: Evaluator-only events are intentionally excluded for now.
 */
export async function getMyEvents(token: string): Promise<unknown> {
  const res = await API.get("/my", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single event by id.
 */
export async function getEventById(
  token: string,
  id: string
): Promise<unknown> {
  const res = await API.get(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single event by slug.
 */
export async function getEventBySlug(
  token: string,
  slug: string
): Promise<unknown> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Event slug is required.");
  }
  const res = await API.get(`/by-slug/${encodeURIComponent(safeSlug)}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Creates a new event (server creates it as DRAFT).
 */
export async function createEvent(
  token: string,
  data: CreateEventDto
): Promise<unknown> {
  const res = await API.post("", data, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Updates an event.
 *
 * NOTE: Backend uses PUT for full/partial updates; we keep this as PUT to match.
 */
export async function updateEvent(
  token: string,
  id: string,
  data: UpdateEventDto
): Promise<unknown> {
  const res = await API.put(`/${id}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

// =====================
// Nested Update Functions
// =====================

type UpdateEventAdditionalInfoPayload = {
  additionalInfo: EventAdditionalInfoDto;
};

type UpdateEventRegistrationFormPayload = {
  registrationForm: EventRegistrationFormDto;
};

type UpdateEventPrizeBreakdownPayload = {
  prizeBreakdown: EventPrizeBreakdownDto[];
};

type UpdateEventMaxUsersPayload = {
  maxUsers: number | null;
};

/**
 * Updates contact + optionally replaces attachments (DRAFT-only).
 */
export async function updateEventAdditionalInfo(
  token: string,
  id: string,
  data: UpdateEventAdditionalInfoPayload
): Promise<unknown> {
  const res = await API.put(`/${id}/additional-info`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Replaces the registration form (externalFormLink OR internal fields) (DRAFT-only).
 */
export async function updateEventRegistrationForm(
  token: string,
  id: string,
  data: UpdateEventRegistrationFormPayload
): Promise<unknown> {
  const res = await API.put(`/${id}/registration-form`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Replaces the prize breakdown list (DRAFT-only).
 */
export async function updateEventPrizeBreakdown(
  token: string,
  id: string,
  data: UpdateEventPrizeBreakdownPayload
): Promise<unknown> {
  const res = await API.put(`/${id}/prize-breakdown`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Updates the max users limit (DRAFT-only).
 * - `null` means unlimited.
 */
export async function updateEventMaxUsers(
  token: string,
  id: string,
  data: UpdateEventMaxUsersPayload
): Promise<unknown> {
  const res = await API.put(`/${id}/max-users`, data, {
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

// =====================
// Role Management
// =====================

/**
 * Get all roles for an event (owner + managers + evaluators).
 */
export async function getEventRoles(
  token: string,
  id: string
): Promise<EventRolesResponse> {
  const res = await API.get(`/${id}/roles`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as EventRolesResponse;
}

/**
 * Add a role to an event (owner/admin only).
 */
export async function addEventRole(
  token: string,
  id: string,
  data: AddEventRoleDto
): Promise<{ message: string; alreadyExists: boolean }> {
  const res = await API.post(`/${id}/roles`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as { message: string; alreadyExists: boolean };
}

/**
 * Remove a role from an event (owner/admin only).
 */
export async function removeEventRole(
  token: string,
  id: string,
  data: RemoveEventRoleDto
): Promise<{ message: string }> {
  const res = await API.delete(`/${id}/roles`, {
    headers: buildAuthHeaders(token),
    data, // axios supports body in DELETE via data property
  });
  return res.data as { message: string };
}

