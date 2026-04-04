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

// =====================
// Public API Functions (no auth required)
// =====================

/**
 * Lists all public events (PUBLISHED/ONGOING + APPROVED, no auth required).
 * Returns sanitized data without participants or registrant PII.
 * This is used for the public /events listing page and landing page.
 */
export async function getPublicEvents(
  params: {
    page?: number;
    appendResults?: boolean;
    q?: string;
    festival_id?: string;
    modes?: string[];
    status?: string[];
    eventDates?: string[];
    eligibility?: string[];
    sort?: string;
  } = {},
): Promise<{ items: any[]; further: boolean }> {
  const res = await API.get("/public", { params });
  return res.data as { items: any[]; further: boolean };
}

/**
 * Fetches a single public event by slug (no auth required).
 * Returns sanitized data without participants or registrant PII.
 * This is used for the public /events/[slug] detail page.
 */
export async function getPublicEventBySlug(slug: string): Promise<unknown> {
  const safeSlug = slug.trim();
  if (safeSlug.length === 0) {
    throw new Error("Event slug is required.");
  }
  const res = await API.get(`/public/by-slug/${encodeURIComponent(safeSlug)}`);
  return res.data as unknown;
}

/**
 * Fetches a single public event by ID (no auth required).
 * Returns sanitized data without participants or registrant PII.
 */
export async function getPublicEventById(id: string): Promise<unknown> {
  const safeId = id.trim();
  if (safeId.length === 0) {
    throw new Error("Event ID is required.");
  }
  const res = await API.get(`/public/${encodeURIComponent(safeId)}`);
  return res.data as unknown;
}

/**
 * Lists upcoming public events (Deadline > Now or Null).
 */
export async function getPublicUpcomingEvents(
  params: {
    page?: number;
    appendResults?: boolean;
    q?: string;
    festival_id?: string;
    modes?: string[];
    status?: string[];
    eventDates?: string[];
    eligibility?: string[];
    sort?: string;
  } = {},
): Promise<{ items: any[]; further: boolean }> {
  const res = await API.get("/public/upcoming", { params });
  return res.data as { items: any[]; further: boolean };
}


// =====================
// Authenticated API Functions
// =====================

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
  id: string,
): Promise<unknown> {
  const res = await API.get(`/${id}`, { headers: buildAuthHeaders(token) });
  return res.data as unknown;
}

/**
 * Fetches a single event by slug.
 */
export async function getEventBySlug(
  token: string,
  slug: string,
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
  data: CreateEventDto,
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
  data: UpdateEventDto,
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
  data: UpdateEventAdditionalInfoPayload,
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
  data: UpdateEventRegistrationFormPayload,
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
  data: UpdateEventPrizeBreakdownPayload,
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
  data: UpdateEventMaxUsersPayload,
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
  id: string,
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
  data: AddEventRoleDto,
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
  data: RemoveEventRoleDto,
): Promise<{ message: string }> {
  const res = await API.delete(`/${id}/roles`, {
    headers: buildAuthHeaders(token),
    data, // axios supports body in DELETE via data property
  });
  return res.data as { message: string };
}

// =====================
// Approval Workflow Functions
// =====================

type SubmitForApprovalPayload = {
  note?: string;
};

type UpdateApprovalStatusPayload = {
  approvalStatus: "APPROVED" | "REJECTED";
  note?: string;
};

type UpdateEventStatusPayload = {
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
};

type UpdateRegistrationPausedPayload = {
  isRegistrationPaused: boolean;
};

/**
 * Organizer-first publish: sets status to PUBLISHED and approvalStatus to PENDING
 * until an admin approves. (UI: “Publish event”.)
 */
export async function submitEventForApproval(
  token: string,
  id: string,
  data?: SubmitForApprovalPayload,
): Promise<unknown> {
  const res = await API.post(`/${id}/submit-approval`, data ?? {}, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Update event approval status (admin only).
 */
export async function updateEventApprovalStatus(
  token: string,
  id: string,
  data: UpdateApprovalStatusPayload,
): Promise<unknown> {
  const res = await API.patch(`/${id}/approval`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Update event status (lifecycle).
 */
export async function updateEventStatus(
  token: string,
  id: string,
  data: UpdateEventStatusPayload,
): Promise<unknown> {
  const res = await API.patch(`/${id}/status`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Pause/unpause event registrations.
 */
export async function updateEventRegistrationPaused(
  token: string,
  id: string,
  data: UpdateRegistrationPausedPayload,
): Promise<unknown> {
  const res = await API.patch(`/${id}/registration`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

// =====================
// Registration / Join
// =====================

export interface JoinEventPayload {
  answers?: Array<{
    fieldId: string;
    value: string | number | string[];
  }>;
}

/**
 * Join an event with optional registration form answers.
 */
export async function joinEvent(
  token: string,
  id: string,
  data?: JoinEventPayload,
): Promise<unknown> {
  const res = await API.post(`/${id}/join`, data ?? {}, {
    headers: buildAuthHeaders(token),
  });
  return res.data as unknown;
}

/**
 * Response from the my-registration check endpoint.
 */
export interface MyRegistrationResponse {
  isRegistered: boolean;
  isPaidButIncomplete: boolean;
  hasRegistrationAnswers: boolean;
  paymentCompleted: boolean;
  participantId: string | null;
  registeredAt: string | null;
}

/**
 * Check if the current user is registered for an event.
 */
export async function checkMyRegistration(
  token: string,
  id: string,
): Promise<MyRegistrationResponse> {
  const res = await API.get(`/${id}/my-registration`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as MyRegistrationResponse;
}

/**
 * Submit missing registration answers for paid users.
 * Use this when payment is complete but registration form was not saved.
 */
export async function submitMissingRegistrationAnswers(
  token: string,
  eventId: string,
  answers: Array<{ fieldId: string; value: string | number | string[] }>,
): Promise<{ success: boolean; message: string; participantId: string }> {
  const res = await API.post(
    `/${eventId}/complete-registration`,
    { answers },
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { success: boolean; message: string; participantId: string };
}

/**
 * Single registration record for event dashboard.
 */
export interface EventRegistration {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  university: string;
  location: string;
  course: string;
  gender: string | null;
  status: "Completed" | "Incomplete";
  registeredOn: string;
  approved: boolean;
  passEmailSent: boolean;
  passEmailSentAt?: string;
  approvedAt?: string;
}

/**
 * Get all registrations for an event by slug (owner/manager/admin only).
 */
export async function getEventRegistrationsBySlug(
  token: string,
  slug: string,
): Promise<EventRegistration[]> {
  const res = await API.get(`/by-slug/${slug}/registrations`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as EventRegistration[];
}

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
  order: number;
  options: string[] | null;
  required: boolean;
}

export interface RegistrationAnswer {
  fieldId: string;
  value: string | number | string[] | null;
}

export interface ParticipantRegistrationAnswersResponse {
  participant: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  fields: RegistrationField[];
  answers: RegistrationAnswer[];
}

export async function getParticipantRegistrationAnswers(
  token: string,
  slug: string,
  participantId: string,
): Promise<ParticipantRegistrationAnswersResponse> {
  const res = await API.get(
    `/by-slug/${encodeURIComponent(slug)}/registrations/${encodeURIComponent(participantId)}`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as ParticipantRegistrationAnswersResponse;
}

/**
 * Approve a participant for an event (owner/manager/admin only).
 */
export async function approveParticipant(
  token: string,
  eventSlug: string,
  participantId: string,
): Promise<void> {
  await API.post(
    `/by-slug/${encodeURIComponent(eventSlug)}/participants/${encodeURIComponent(participantId)}/approve`,
    {},
    { headers: buildAuthHeaders(token) },
  );
}

// =====================
// Event Pass API Functions
// =====================

import type { EventPassDto, ScanResultDto, ScanEventPassDto, PublicPassLookupDto } from '@oppskills/types';

const EVENT_PASS_API = createApiClient('/event-pass');
const EVENT_PASS_SCAN_API = createApiClient('/events');

/**
 * Protected lookup of event pass by token
 * Requires authentication and organizer permissions
 */
export async function lookupPassByToken(
  authToken: string,
  passToken: string,
): Promise<PublicPassLookupDto> {
  const response = await EVENT_PASS_API.get(`/lookup/${encodeURIComponent(passToken)}`, {
    headers: buildAuthHeaders(authToken),
  });
  return response.data as PublicPassLookupDto;
}

/**
 * Validate and mark pass as used (requires authentication + event permission)
 * This is called by organizers after scanning
 */
export async function validateEventPass(
  authToken: string,
  eventId: string,
  passToken: string,
): Promise<ScanResultDto> {
  const response = await EVENT_PASS_SCAN_API.post(
    `/${encodeURIComponent(eventId)}/passes/scan`,
    { token: passToken } as ScanEventPassDto,
    { headers: buildAuthHeaders(authToken) },
  );
  return response.data as ScanResultDto;
}

/**
 * Get event pass by ID (authenticated, user must own the pass)
 */
export async function getEventPass(
  token: string,
  passId: string,
): Promise<EventPassDto> {
  const response = await EVENT_PASS_API.get(`/${encodeURIComponent(passId)}`, {
    headers: buildAuthHeaders(token),
  });
  return response.data as EventPassDto;
}

/**
 * Get all event passes for authenticated user
 */
export async function getMyEventPasses(
  token: string,
): Promise<EventPassDto[]> {
  const response = await EVENT_PASS_API.get('/my-passes', {
    headers: buildAuthHeaders(token),
  });
  return response.data as EventPassDto[];
}

/**
 * Scan and validate event pass token
 * Only event owners/managers can scan passes
 */
export async function scanEventPass(
  token: string,
  eventId: string,
  passToken: string,
): Promise<ScanResultDto> {
  const response = await EVENT_PASS_SCAN_API.post(
    `/${encodeURIComponent(eventId)}/passes/scan`,
    { token: passToken } as ScanEventPassDto,
    { headers: buildAuthHeaders(token) },
  );
  return response.data as ScanResultDto;
}

// =====================
// Event Payment API Functions
// =====================

/**
 * Event payment order response.
 */
export interface EventPaymentOrderResponse {
  paymentId: string;
  razorpayKey: string | null;
  razorpayOrderId: string | null;
  amountPaise: number;
  currency: string;
  eventName: string;
  eventSlug: string;
  originalAmount: number;
  finalAmount: number;
  discountAmount?: number;
  zeroAmountPayment?: boolean;
  isCollegeFree?: boolean;
}

/**
 * Event payment verification response.
 */
export interface EventPaymentVerifyResponse {
  success: boolean;
  paymentId: string;
  participantId: string;
}

/**
 * Event earnings data for organizer dashboard.
 */
export interface EventEarningsData {
  totalGross: string;
  totalPlatformFees: string;
  totalOrganizerShare: string;
  pendingPayout: string;
  paidOut: string;
  capturedPaymentsCount: number;
  isEligibleNow: boolean;
  eligibleAt: string | null;
}

/**
 * Event discount code data.
 */
export interface EventDiscountCode {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  active: boolean;
  maxRedemptions: number | null;
  maxPerUser: number;
  validFrom: string | null;
  validUntil: string | null;
  redemptionCount: number;
  createdAt: string;
}

/**
 * Event pricing data.
 */
export interface EventPricingData {
  isFree: boolean;
  entryFeeAmount: string | null;
  currency: string;
  freeCollegeIds: string[];
  feeBearer: "ORGANISER" | "PARTICIPANT";
}

/**
 * Create a payment order for event registration.
 */
export async function createEventPaymentOrder(
  token: string,
  eventSlug: string,
  params: {
    discountCode?: string;
    answers?: Array<{ fieldId: string; value: string }>;
  },
): Promise<EventPaymentOrderResponse> {
  const res = await API.post(
    `/${encodeURIComponent(eventSlug)}/payment/order`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventPaymentOrderResponse;
}

/**
 * Verify event payment and complete registration.
 */
export async function verifyEventPayment(
  token: string,
  eventSlug: string,
  params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    answers?: Array<{ fieldId: string; value: string | number | string[] }>;
  },
): Promise<EventPaymentVerifyResponse> {
  const res = await API.post(
    `/${encodeURIComponent(eventSlug)}/payment/verify`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventPaymentVerifyResponse;
}

/**
 * Get event earnings (organizer only).
 */
export async function getEventEarnings(
  token: string,
  eventSlug: string,
): Promise<EventEarningsData> {
  const res = await API.get(`/${encodeURIComponent(eventSlug)}/earnings`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as EventEarningsData;
}

/**
 * Update event pricing settings.
 */
export async function updateEventPricing(
  token: string,
  eventSlug: string,
  params: {
    isFree?: boolean;
    entryFeeAmount?: string;
    freeCollegeIds?: string[];
    feeBearer?: "ORGANISER" | "PARTICIPANT";
  },
): Promise<EventPricingData> {
  const res = await API.patch(
    `/${encodeURIComponent(eventSlug)}/pricing`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventPricingData;
}

/**
 * Create a discount code for event.
 */
export async function createEventDiscountCode(
  token: string,
  eventSlug: string,
  params: {
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    maxRedemptions?: number;
    maxPerUser?: number;
    validFrom?: string;
    validUntil?: string;
    active?: boolean;
  },
): Promise<EventDiscountCode> {
  const res = await API.post(
    `/${encodeURIComponent(eventSlug)}/discount-codes`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventDiscountCode;
}

/**
 * Get all discount codes for event.
 */
export async function getEventDiscountCodes(
  token: string,
  eventSlug: string,
): Promise<EventDiscountCode[]> {
  const res = await API.get(
    `/${encodeURIComponent(eventSlug)}/discount-codes`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventDiscountCode[];
}

/**
 * Update a discount code.
 */
export async function updateEventDiscountCode(
  token: string,
  eventSlug: string,
  codeId: string,
  params: {
    active?: boolean;
    maxRedemptions?: number;
    validUntil?: string;
  },
): Promise<EventDiscountCode> {
  const res = await API.patch(
    `/${encodeURIComponent(eventSlug)}/discount-codes/${encodeURIComponent(codeId)}`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as EventDiscountCode;
}

/**
 * Delete a discount code.
 */
export async function deleteEventDiscountCode(
  token: string,
  eventSlug: string,
  codeId: string,
): Promise<{ success: boolean }> {
  const res = await API.delete(
    `/${encodeURIComponent(eventSlug)}/discount-codes/${encodeURIComponent(codeId)}`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { success: boolean };
}
