import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/referrals");
const PUBLIC_API = createApiClient("/referrals/public");

export type ReferralEntityType =
  | "HACKATHON"
  | "EVENT"
  | "FESTIVAL"
  | "COMMUNITY";

export interface ReferralListItem {
  id: string;
  code: string;
  clicksCount: number;
  registrationsCount: number;
  clicksRecent?: number;
  registrationsRecent?: number;
  referrer: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    institution?: string;
    location?: string;
    profession?: string;
    registrationDate?: string;
  };
}

export interface ReferralAnalytics {
  totalClicks: number;
  humanClicks: number;
  referredParticipants: number;
  totalRegistrations: number;
  activeReferrers: number;
  totalReferrers: number;
  linksGenerated: number;
}

export async function createReferral(
  token: string,
  payload: {
    entityType: ReferralEntityType;
    entityId: string;
    referrerEmail: string;
    sendEmail?: boolean;
  },
) {
  const res = await API.post("", payload, { headers: buildAuthHeaders(token) });
  return res.data;
}

export async function listReferrals(
  token: string,
  query: {
    entityType: ReferralEntityType;
    entityId: string;
    page?: number;
    pageSize?: number;
  },
) {
  const res = await API.get("", {
    params: query,
    headers: buildAuthHeaders(token),
  });
  return res.data as {
    data: ReferralListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function getReferralAnalytics(
  token: string,
  query: { entityType: ReferralEntityType; entityId: string },
) {
  const res = await API.get("/analytics", {
    params: query,
    headers: buildAuthHeaders(token),
  });
  return res.data as ReferralAnalytics;
}

export async function getReferralById(token: string, id: string) {
  const res = await API.get(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data;
}

export async function getReferralRegistrations(
  token: string,
  id: string,
  page = 1,
  pageSize = 20,
) {
  const res = await API.get(`/${id}/registrations`, {
    params: { page, pageSize },
    headers: buildAuthHeaders(token),
  });
  return res.data as {
    data: ReferredUser[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function deleteReferral(token: string, id: string) {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as { success: boolean };
}

export interface OrganizerReferrerDetails {
  referrer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    institution: string;
    location: string;
    profession: string;
    registrationDate: string;
  };
  opportunities: {
    id: string;
    entityType: ReferralEntityType;
    entityId: string;
    entityName: string;
    slug: string;
    image: string | null;
    dashboardUrl: string;
    clicks: number;
    clicksLast24h: number;
    registrations: number;
    registrationsLast24h: number;
    isActive: boolean;
  }[];
  summary: {
    totalReferrals: number;
    totalClicks: number;
    clicksLast24h: number;
    totalRegistrations: number;
    registrationsLast24h: number;
    activeLinks: number;
  };
}

export async function getReferrerDetails(token: string, id: string) {
  const res = await API.get(`/${id}/referrer-details`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as OrganizerReferrerDetails;
}

export async function lookupReferrerUser(
  token: string,
  params: { email: string; entityType: ReferralEntityType; entityId: string },
) {
  const res = await API.get("/user-lookup", {
    params,
    headers: buildAuthHeaders(token),
  });
  return res.data as {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  };
}

export async function resolveReferralPublic(code: string) {
  const res = await PUBLIC_API.get(`/resolve/${encodeURIComponent(code)}`);
  return res.data as {
    entityType: ReferralEntityType;
    slug: string;
    isActive: boolean;
  };
}

export async function trackReferralClick(payload: {
  code: string;
  source?: string;
}) {
  const res = await PUBLIC_API.post("/track-click", payload);
  return res.data;
}

export interface ReferralPerformanceItem {
  id: string;
  code: string;
  entityType: ReferralEntityType;
  entityId: string;
  title: string;
  organization: string;
  thumbnail: string;
  slug: string;
  clicks: number;
  clicksLast24h: number;
  registrations: number;
  registrationsLast24h: number;
  createdAt: string;
  isActive: boolean;
}

export interface ReferralPerformanceResponse {
  summary: {
    linksGenerated: number;
    activeLinks: number;
    totalImpressions: number;
    impressions24h: number;
    totalRegistrations: number;
    registrations24h: number;
  };
  referrals: ReferralPerformanceItem[];
}

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  registrationDate: string;
  institution: string;
  location: string;
  profession: string;
}

export async function getMyReferralPerformance(token: string) {
  const res = await API.get("/my/performance", {
    headers: buildAuthHeaders(token),
  });
  return res.data as ReferralPerformanceResponse;
}

export async function getMyReferredUsers(token: string) {
  const res = await API.get("/my/referred-users", {
    headers: buildAuthHeaders(token),
  });
  return res.data as ReferralPerformanceResponse["referrals"];
}
