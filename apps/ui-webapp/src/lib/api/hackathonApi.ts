import type {
  CreateHackathonDto,
  PrizeBreakdownDto,
  RegistrationFormDto,
  UpdateHackathonAdditionalInfoDto,
  UpdateHackathonDto,
  UpdateHackathonRoundsDto,
  AddHackathonRoleDto,
  RemoveHackathonRoleDto,
  HackathonRolesResponse,
  TeamInvitePreviewResponse,
  SendTeamEmailDto,
} from "@oppskills/types";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/hackathons");

// =====================
// Public Endpoints (no auth required)
// =====================

/**
 * Type for public hackathon list items.
 */
export interface PublicHackathonListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  approvalStatus: string;
  mode: string;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  lowestTicketPrice?: number | null;
  highestTicketPrice?: number | null;
  prizeTotalWorthAmount: number | null;
  hackathonType: string;
  participantType: string;
  registrationCount: number;
  maxTeams: number | null;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
  attendeeEligibility: string[];
}

/**
 * Fetches public hackathons (PUBLISHED/ONGOING + APPROVED).
 * No authentication required.
 */
export async function getPublicHackathons(
  params: {
    festival_id?: string;
    page?: number;
    q?: string;
    modes?: string[];
    status?: string[];
    eventDates?: string[];
    eligibility?: string[];
    sort?: string;
    sortOrder?: "asc" | "desc";
    take?: number;
  } = {},
): Promise<{
  items: PublicHackathonListItem[];
  totalPages: number;
  total: number;
  page: number;
}> {
  const res = await API.get("/public", {
    params: {
      festival_id: params.festival_id,
      page: params.page,
      q: params.q,
      modes: params.modes,
      status: params.status,
      eventDates: params.eventDates,
      eligibility: params.eligibility,
      sort: params.sort,
      sortOrder: params.sortOrder,
      take: params.take,
    },
  });
  return res.data;
}

/**
 * Fetches upcoming public hackathons (Deadline > Now or Null).
 */
export async function getPublicUpcomingHackathons(
  params: {
    festival_id?: string;
    page?: number;
    appendResults?: boolean;
    q?: string;
    modes?: string[];
    status?: string[];
    eventDates?: string[];
    eligibility?: string[];
    sort?: string;
    sortOrder?: "asc" | "desc";
    take?: number;
  } = {},
): Promise<{
  items: PublicHackathonListItem[];
  totalPages: number;
  total: number;
  page: number;
}> {
  const res = await API.get("/public/upcoming", {
    params: {
      festival_id: params.festival_id,
      page: params.page,
      q: params.q,
      modes: params.modes,
      status: params.status,
      eventDates: params.eventDates,
      eligibility: params.eligibility,
      sort: params.sort,
      sortOrder: params.sortOrder,
      take: params.take,
    },
  });
  return res.data;
}

/**
 * Fetches a public hackathon by slug.
 * No authentication required.
 */
export async function getPublicHackathonBySlug(slug: string): Promise<unknown> {
  const res = await API.get(`/public/by-slug/${encodeURIComponent(slug)}`);
  return res.data as unknown;
}

/**
 * Public preview for a team invite link (no auth). Validates code + hackathon slug.
 */
export async function getTeamInvitePreview(
  code: string,
  slug: string,
): Promise<TeamInvitePreviewResponse> {
  const res = await API.get("/public/team-invite/preview", {
    params: {
      code: code.trim().toUpperCase(),
      slug: slug.trim(),
    },
  });
  return res.data as TeamInvitePreviewResponse;
}

// =====================
// Authenticated Endpoints
// =====================

/**
 * Fetches hackathons visible to the current user.
 */
export async function getHackathons(token: string): Promise<unknown> {
  const res = await API.get("", { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches hackathons visible on the dashboard for the current user:
 * - Owned hackathons
 * - Hackathons where the user is a MANAGER
 *
 * Note: Evaluator-only hackathons are intentionally excluded for now.
 */
export async function getMyHackathons(
  token: string,
  params: { page?: number; take?: number } = {},
): Promise<{
  items: any[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
}> {
  const res = await API.get("/my", {
    headers: buildAuthHeaders(token),
    params,
  });
  return res.data;
}

/**
 * Fetches a single hackathon by id.
 */
export async function getHackathonById(
  token: string,
  id: string,
): Promise<unknown> {
  const res = await API.get(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single hackathon by slug.
 */
export async function getHackathonBySlug(
  token: string,
  slug: string,
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
  data: CreateHackathonDto,
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
  data: UpdateHackathonDto,
): Promise<unknown> {
  const res = await API.put(`/${id}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

type UpdateHackathonRegistrationFormPayload = {
  registrationForm: RegistrationFormDto;
};

type UpdateHackathonPrizeBreakdownPayload = {
  prizeBreakdown: PrizeBreakdownDto[];
};

type UpdateHackathonMaxTeamsPayload = {
  maxTeams: number | null;
};

/**
 * Replaces all rounds of a hackathon (DRAFT-only).
 */
export async function updateHackathonRounds(
  token: string,
  id: string,
  data: UpdateHackathonRoundsDto,
): Promise<unknown> {
  const res = await API.put(`/${id}/rounds`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Updates contact + optionally replaces attachments (DRAFT-only).
 */
export async function updateHackathonAdditionalInfo(
  token: string,
  id: string,
  data: UpdateHackathonAdditionalInfoDto,
): Promise<unknown> {
  const res = await API.put(`/${id}/additional-info`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Replaces the registration form (externalFormLink OR internal fields) (DRAFT-only).
 */
export async function updateHackathonRegistrationForm(
  token: string,
  id: string,
  data: UpdateHackathonRegistrationFormPayload,
): Promise<unknown> {
  const res = await API.put(`/${id}/registration-form`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Replaces the prize breakdown list (DRAFT-only).
 */
export async function updateHackathonPrizeBreakdown(
  token: string,
  id: string,
  data: UpdateHackathonPrizeBreakdownPayload,
): Promise<unknown> {
  const res = await API.put(`/${id}/prize-breakdown`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Updates the max teams limit (DRAFT-only).
 * - `null` means unlimited.
 */
export async function updateHackathonMaxTeams(
  token: string,
  id: string,
  data: UpdateHackathonMaxTeamsPayload,
): Promise<unknown> {
  const res = await API.put(`/${id}/max-teams`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Deletes a hackathon.
 */
export async function deleteHackathon(
  token: string,
  id: string,
): Promise<unknown> {
  const res = await API.delete(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Registers the current user for a hackathon.
 */
export async function registerForHackathon(
  token: string,
  id: string,
): Promise<unknown> {
  const res = await API.post(
    `/${id}/register`,
    {},
    { headers: buildAuthHeaders(token) },
  );
  return res.data as unknown;
}

// =====================
// Role Management
// =====================

/**
 * Get all roles for a hackathon (owner + managers + evaluators).
 */
export async function getHackathonRoles(
  token: string,
  id: string,
): Promise<HackathonRolesResponse> {
  const res = await API.get(`/${id}/roles`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as HackathonRolesResponse;
}

/**
 * Add a role to a hackathon (owner/admin only).
 */
export async function addHackathonRole(
  token: string,
  id: string,
  data: AddHackathonRoleDto,
): Promise<{ message: string; alreadyExists: boolean }> {
  const res = await API.post(`/${id}/roles`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as { message: string; alreadyExists: boolean };
}

/**
 * Remove a role from a hackathon (owner/admin only).
 */
export async function removeHackathonRole(
  token: string,
  id: string,
  data: RemoveHackathonRoleDto,
): Promise<{ message: string }> {
  const res = await API.delete(`/${id}/roles`, {
    headers: buildAuthHeaders(token),
    data, // axios supports body in DELETE via data property
  });
  return res.data as { message: string };
}

// =====================
// Registrations (Teams) for Dashboard
// =====================

/**
 * Response type for hackathon registrations (teams) by slug.
 */
export interface HackathonRoundInfo {
  id: string;
  name: string;
  order: number;
  roundType: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface HackathonTeamLeader {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  university: string;
  location: string;
  /** From registration form answers (e.g. PHONE_NO field), not Clerk */
  phone: string;
}

export interface HackathonTeamRoundSubmission {
  submissionId: string;
  submittedAt: string | null;
  payload: unknown;
}

export interface HackathonTeamMemberExport {
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** From that member's registration submission answers */
  phone: string;
}

export interface HackathonTeamRegistration {
  teamId: string;
  teamName: string;
  memberCount: number;
  maxSize: number;
  minSize?: number;
  createdAt: string;
  isOpen: boolean;
  invitationCode: string | null;
  /** Non-leader members, ordered by join time (oldest first). */
  members: HackathonTeamMemberExport[];
  leader: HackathonTeamLeader;
  roundSubmissions: Record<string, HackathonTeamRoundSubmission>;
  roundQualifications: Record<
    string,
    { qualified: boolean; qualifiedAt: string | null }
  >;
}

export interface HackathonRegistrationsBySlugResponse {
  hackathonId: string;
  name: string;
  rounds: HackathonRoundInfo[];
  teams: {
    items: HackathonTeamRegistration[];
    total: number;
    page: number;
    take: number;
    totalPages: number;
  };
}

/**
 * Get all team registrations for a hackathon by slug (owner/manager/admin only).
 */
export async function getHackathonRegistrationsBySlug(
  token: string,
  slug: string,
  params: { page?: number; take?: number } = {},
): Promise<HackathonRegistrationsBySlugResponse> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  const res = await API.get(
    `/by-slug/${encodeURIComponent(safeSlug)}/registrations`,
    {
      headers: buildAuthHeaders(token),
      params,
    },
  );
  return res.data as HackathonRegistrationsBySlugResponse;
}

/**
 * Get a specific team's registration for a hackathon by slug (owner/manager/admin only).
 */
export async function getHackathonTeamRegistration(
  token: string,
  slug: string,
  teamId: string,
): Promise<{
  hackathonId: string;
  name: string;
  rounds: HackathonRoundInfo[];
  team: HackathonTeamRegistration;
}> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  const res = await API.get(
    `/by-slug/${encodeURIComponent(safeSlug)}/teams/${encodeURIComponent(teamId)}/registration`,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

// =====================
// Team Round Qualification (Organizer)
// =====================

export async function setTeamRoundQualification(
  token: string,
  slug: string,
  roundId: string,
  teamId: string,
  qualified: boolean,
): Promise<unknown> {
  const res = await API.put(
    `/by-slug/${encodeURIComponent(slug)}/rounds/${roundId}/teams/${teamId}/qualification`,
    { qualified },
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function bulkSetTeamRoundQualification(
  token: string,
  slug: string,
  roundId: string,
  teamIds: string[],
  qualified: boolean,
): Promise<unknown> {
  const res = await API.put(
    `/by-slug/${encodeURIComponent(slug)}/rounds/${roundId}/bulk-qualification`,
    { teamIds, qualified },
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

// =====================
// Settings & Approval
// =====================

/**
 * Organizer publish: first publish (or after rejection) sets PUBLISHED + PENDING until
 * an admin approves. If already APPROVED, republish from draft only updates lifecycle.
 */
export async function submitHackathonForApproval(
  token: string,
  id: string,
): Promise<unknown> {
  const res = await API.post(
    `/${id}/submit-for-approval`,
    {},
    { headers: buildAuthHeaders(token) },
  );
  return res.data as unknown;
}

/**
 * Update hackathon lifecycle status.
 */
export async function updateHackathonStatus(
  token: string,
  id: string,
  data: {
    status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  },
): Promise<unknown> {
  const res = await API.patch(`/${id}/status`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Update hackathon registration paused status.
 */
export async function updateHackathonRegistrationPaused(
  token: string,
  id: string,
  data: { isRegistrationPaused: boolean },
): Promise<unknown> {
  const res = await API.patch(`/${id}/registration-paused`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

// =====================
// Team Registration Answers
// =====================

export interface TeamRegistrationField {
  id: string;
  label: string;
  type: string;
  order: number;
  options: string[] | null;
  required: boolean;
}

export interface TeamRegistrationAnswer {
  fieldId: string;
  value: string | number | string[] | null;
}

export interface TeamRespondent {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  isLeader: boolean;
  answers: TeamRegistrationAnswer[];
}

export interface TeamRegistrationAnswersResponse {
  fields: TeamRegistrationField[];
  respondents: TeamRespondent[];
}

export async function getTeamRegistrationAnswers(
  token: string,
  slug: string,
  teamId: string,
): Promise<TeamRegistrationAnswersResponse> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  const res = await API.get(
    `/by-slug/${encodeURIComponent(safeSlug)}/teams/${encodeURIComponent(teamId)}/registration-answers`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as TeamRegistrationAnswersResponse;
}

// =====================
// Team Round Submissions (User-facing)
// =====================

export interface SubmissionFile {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface RoundSubmissionInfo {
  id: string;
  teamId: string;
  roundId: string;
  payload: {
    files: SubmissionFile[];
    note: string | null;
  };
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  qualified?: boolean;
  qualifiedAt?: string | null;
}

export interface RoundQualificationInfo {
  roundId: string;
  qualified: boolean;
  qualifiedAt: string | null;
}

export interface MyTeamSubmissionsResponse {
  team: {
    id: string;
    name: string;
    leaderId?: string;
    leader: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  };
  submissions: Record<string, RoundSubmissionInfo>;
  qualifications: Record<string, RoundQualificationInfo>;
}

export async function getMyTeamSubmissions(
  token: string,
  slug: string,
): Promise<MyTeamSubmissionsResponse | null> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  try {
    const res = await API.get(
      `/by-slug/${encodeURIComponent(safeSlug)}/my-team/submissions`,
      { headers: buildAuthHeaders(token) },
    );
    return res.data as MyTeamSubmissionsResponse;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export interface UpsertSubmissionPayload {
  files: SubmissionFile[];
  note?: string | null;
}

export interface SubmissionResponse {
  id: string;
  teamId: string;
  roundId: string;
  submittedAt: string;
  payload: {
    files: SubmissionFile[];
    note: string | null;
  };
}

export async function upsertRoundSubmission(
  token: string,
  slug: string,
  roundId: string,
  data: UpsertSubmissionPayload,
): Promise<SubmissionResponse> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Hackathon slug is required.");
  }
  const res = await API.put(
    `/by-slug/${encodeURIComponent(safeSlug)}/rounds/${encodeURIComponent(roundId)}/submission`,
    data,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as SubmissionResponse;
}

// =====================
// Team Communications
// =====================

/**
 * Send custom email to all members of a specific team (organizer only).
 * Uses Resend Batch API via the backend.
 */
export async function sendTeamEmail(
  token: string,
  hackathonId: string,
  teamId: string,
  data: SendTeamEmailDto,
): Promise<{ message: string; count: number }> {
  const res = await API.post(
    `/${encodeURIComponent(hackathonId)}/teams/${encodeURIComponent(teamId)}/send-email`,
    data,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { message: string; count: number };
}
