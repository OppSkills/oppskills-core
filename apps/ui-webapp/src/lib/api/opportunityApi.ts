import { createApiClient } from "./apiClient";

const API = createApiClient("/opportunity");

/**
 * Fetches past public opportunities (merged events + hackathons).
 */
export async function getPublicPastOpportunities(params: {
  festival_id?: string;
  page?: number;
  appendResults?: boolean;
  q?: string;
}) {
  const res = await API.get("/public/past", { params });
  return res.data;
}

/**
 * Search opportunities by query string.
 * Returns { hackathons: [], events: [], topOpportunities: [] }
 */
export async function searchOpportunities(q: string) {
  const res = await API.get("/search", { params: { q } });
  return res.data as {
    hackathons: any[];
    events: any[];
    topOpportunities: any[];
  };
}
