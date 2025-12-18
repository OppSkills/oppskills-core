import type { CreateHackathonDto, UpdateHackathonDto } from "@oppskills/types";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/hackathons");

/**
 * Fetches hackathons visible to the current user.
 */
export async function getHackathons(token: string): Promise<unknown> {
  const res = await API.get("", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single hackathon by id.
 */
export async function getHackathonById(
  token: string,
  id: string
): Promise<unknown> {
  const res = await API.get(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single hackathon by slug.
 */
export async function getHackathonBySlug(
  token: string,
  slug: string
): Promise<unknown> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  const res = await API.get(`/by-slug/${encodeURIComponent(safeSlug)}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Creates a new hackathon (server creates it as DRAFT).
 */
export async function createHackathon(
  token: string,
  data: CreateHackathonDto
): Promise<unknown> {
  const res = await API.post("", data, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Updates a hackathon.
 *
 * NOTE: Backend uses PUT for full/partial updates; we keep this as PUT to match.
 */
export async function updateHackathon(
  token: string,
  id: string,
  data: UpdateHackathonDto
): Promise<unknown> {
  const res = await API.put(`/${id}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Deletes a hackathon.
 */
export async function deleteHackathon(
  token: string,
  id: string
): Promise<unknown> {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Registers the current user for a hackathon.
 */
export async function registerForHackathon(
  token: string,
  id: string
): Promise<unknown> {
  const res = await API.post(
    `/${id}/register`,
    {},
    { headers: buildAuthHeaders(token) }
  );
  return res.data as unknown;
}
