import { buildAuthHeaders, createApiClient } from "./apiClient";

const AUTH_API = createApiClient("/skills");

export interface Skill {
  id: string;
  name: string;
  slug: string;
  platformScore: number;
}

export async function searchSkills(
  token: string,
  q: string,
  limit?: number,
): Promise<Skill[]> {
  const res = await AUTH_API.get("/search", {
    params: { q, limit },
    headers: buildAuthHeaders(token),
  });
  return res.data as Skill[];
}

export async function recommendSkills(
  token: string,
  text: string,
  limit?: number,
): Promise<Skill[]> {
  const res = await AUTH_API.post(
    "/recommend",
    { text },
    {
      params: { limit },
      headers: buildAuthHeaders(token),
    },
  );
  return res.data as Skill[];
}
