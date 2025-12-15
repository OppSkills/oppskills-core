import type { CreateFestivalDto, UpdateFestivalDto } from "@oppskills/types";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/festivals");

/**
 * Lists festivals.
 */
export async function getFestivals(token: string): Promise<unknown> {
  const res = await API.get("", { headers: buildAuthHeaders(token) });
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
 * Deletes a festival.
 */
export async function deleteFestival(token: string, id: string): Promise<unknown> {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}


