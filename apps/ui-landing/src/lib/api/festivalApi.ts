import type { CreateFestivalDto, UpdateFestivalDto } from "@oppskills/types/frontend";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/festivals");

/**
 * Lists festivals.
 */
export async function getFestivals(token: string | null): Promise<unknown> {
  const headers = token ? buildAuthHeaders(token) : {};
  const res = await API.get("", { headers });
  return res.data as unknown;
}

/**
 * Lists festivals organized by the current user.
 */
export async function getMyFestivals(token: string): Promise<unknown> {
  const res = await API.get("/my", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Creates a new festival.
 */
export async function createFestival(token: string, data: CreateFestivalDto): Promise<unknown> {
  const res = await API.post("", data, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Updates a festival.
 */
export async function updateFestival(
  token: string,
  id: string,
  data: UpdateFestivalDto,
): Promise<unknown> {
  const res = await API.put(`/${id}`, data, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Updates a festival's status.
 */
export async function updateFestivalStatus(
  token: string,
  id: string,
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED",
): Promise<unknown> {
  const res = await API.patch(
    `/${id}/status`,
    { status },
    { headers: buildAuthHeaders(token) },
  );
  return res.data as unknown;
}

/**
 * Deletes a festival.
 */
export async function deleteFestival(token: string, id: string): Promise<unknown> {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Gets a festival by slug.
 */
export async function getFestivalBySlug(token: string | null, slug: string): Promise<unknown> {
  const headers = token ? buildAuthHeaders(token) : {};
  const res = await API.get(`/slug/${slug}`, { headers });
  return res.data as unknown;
}


