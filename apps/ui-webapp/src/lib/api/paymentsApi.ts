import { buildAuthHeaders, createApiClient } from "./apiClient";
import type {
  OnboardRouteDto,
  UpsertPayoutDetailsDto,
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  SaveHackathonRegistrationCheckoutDraftDto,
  CreateOrderDto,
  VerifyPaymentDto,
  SubmitRegistrationDto,
  CreateRefundDto,
  CreateTicketTierDto,
  UpdateTicketTierDto,
  UpdateSettlementsDto,
} from "@oppskills/types";

export type RouteOnboardingParams = OnboardRouteDto;
export type PayoutDetailsInput = UpsertPayoutDetailsDto;

const PaymentsAPI = createApiClient("/payments");
const HackathonsAPI = createApiClient("/hackathons");

/**
 * Read the referral code from the `oppskills_ref` cookie set by
 * `/r/<code>` redirects. Returns undefined in SSR or when absent.
 *
 * **Native / mobile:** pass `referralCode` explicitly on the same request bodies
 * when this returns undefined — see `docs/referral-native-mobile.md`.
 */
function getReferralCodeFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)oppskills_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Clear the referral cookie after successful registration. */
function clearReferralCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "oppskills_ref=; Path=/; Max-Age=0";
}

export interface RouteStatus {
  hasAccount: boolean;
  status:
    | "CREATED"
    | "UNDER_REVIEW"
    | "NEEDS_CLARIFICATION"
    | "ACTIVATED"
    | "SUSPENDED"
    | null;
  razorpayAccountId: string | null;
  routeProductId: string | null;
  requirements: unknown[] | null;
  resolutionUrl: string | null;
}

export interface DiscountCode {
  id: string;
  hackathonId: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  active: boolean;
  maxRedemptions: number | null;
  maxPerUser: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrder {
  // Backend primary fields
  paymentId: string;
  razorpayKeyId: string | null;
  razorpayOrderId: string | null;

  amountPaise: number;
  currency: string;
  hackathonName: string;

  // When discount makes total 0, backend returns a zero-amount payment
  zeroAmountPayment?: boolean;

  // Backward compatibility (older frontend used these)
  keyId?: string;
  orderId?: string;
}

export interface EarningsData {
  hackathonId: string;
  hackathonName: string;
  totalGross: string | number;
  totalPlatformFee: string | number;
  totalOrganizerShare: string | number;
  totalRefunded: string | number;
  netEarnings: string | number;
  paidOut: string | number;
  pendingPayout: string | number;
  eligibleAt: string | null;
  isEligibleNow: boolean;
  capturedPaymentsCount: number;
  currency: string;
}

export interface PayoutDetails {
  userId: string;
  accountHolderName: string;
  accountNumberLast4: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  panNumber?: string | null;
  gstNumber?: string | null;
  upiId: string | null;
  pinCode?: string | null;
  city?: string | null;
  state?: string | null;
  address1?: string | null;
  address2?: string | null;
  phone?: string | null;
  email?: string | null;
  updatedAt: string;
  razorpayBankName?: boolean | null;
}

/** Backend may return `{ exists: false }` when the user has not saved details yet. */
export type PayoutDetailsApiResponse =
  | { exists: false }
  | ({ exists: true } & PayoutDetails);

export interface PaymentRecord {
  id: string;
  payerName: string | null;
  payerEmail: string | null;
  grossAmount: number;
  platformFeeAmount: number;
  organizerShareAmount: number;
  currency: string;
  paymentStatus: string;
  capturedAt: string | null;
  createdAt: string;
}

export async function getRouteStatus(token: string): Promise<RouteStatus> {
  const res = await PaymentsAPI.get("/route/status", {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function submitRouteOnboarding(
  token: string,
  params: RouteOnboardingParams,
): Promise<RouteStatus> {
  const res = await PaymentsAPI.post("/route/onboard", params, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function updateRouteSettlements(
  token: string,
  params: UpdateSettlementsDto,
): Promise<RouteStatus> {
  const res = await PaymentsAPI.patch("/route/settlements", params, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getDiscountCodes(
  token: string,
  hackathonSlug: string,
): Promise<DiscountCode[]> {
  const res = await HackathonsAPI.get(`/${hackathonSlug}/discount-codes`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function createDiscountCode(
  token: string,
  hackathonSlug: string,
  params: CreateDiscountCodeDto,
): Promise<DiscountCode> {
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/discount-codes`,
    params,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function updateDiscountCode(
  token: string,
  hackathonSlug: string,
  codeId: string,
  params: Partial<UpdateDiscountCodeDto>,
): Promise<DiscountCode> {
  const res = await HackathonsAPI.patch(
    `/${hackathonSlug}/discount-codes/${codeId}`,
    params,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function deleteDiscountCode(
  token: string,
  hackathonSlug: string,
  codeId: string,
): Promise<void> {
  await HackathonsAPI.delete(`/${hackathonSlug}/discount-codes/${codeId}`, {
    headers: buildAuthHeaders(token),
  });
}

/**
 * Save paid hackathon registration answers before Razorpay checkout (then open /hackathons/:slug/checkout).
 */
export async function saveHackathonRegistrationCheckoutDraft(
  token: string,
  hackathonSlug: string,
  params: SaveHackathonRegistrationCheckoutDraftDto,
): Promise<{
  success: boolean;
  hackathonSlug: string;
  checkoutPath: string;
  teamId: string;
}> {
  const referralCode = params.referralCode ?? getReferralCodeFromCookie();
  const body = { ...params, ...(referralCode ? { referralCode } : {}) };
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/registration/checkout-draft`,
    body,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function createPaymentOrder(
  token: string,
  hackathonSlug: string,
  params: CreateOrderDto,
): Promise<PaymentOrder & { teamId?: string }> {
  const referralCode = params.referralCode ?? getReferralCodeFromCookie();
  const body = { ...params, ...(referralCode ? { referralCode } : {}) };
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/payment/order`,
    body,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function verifyPayment(
  token: string,
  hackathonSlug: string,
  params: VerifyPaymentDto,
): Promise<{ success: boolean; paymentId: string; teamId?: string }> {
  const referralCode = params.referralCode ?? getReferralCodeFromCookie();
  const body = { ...params, ...(referralCode ? { referralCode } : {}) };
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/payment/verify`,
    body,
    {
      headers: buildAuthHeaders(token),
    },
  );
  // On successful capture, clear the cookie so we don't re-attribute again.
  if (res.data?.success) {
    clearReferralCookie();
  }
  return res.data;
}

export async function getHackathonEarnings(
  token: string,
  hackathonSlug: string,
): Promise<EarningsData> {
  const res = await HackathonsAPI.get(`/${hackathonSlug}/earnings`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getHackathonPayments(
  token: string,
  hackathonSlug: string,
): Promise<PaymentRecord[]> {
  const res = await HackathonsAPI.get(`/${hackathonSlug}/payments`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function requestRefund(
  token: string,
  hackathonSlug: string,
  params: CreateRefundDto,
): Promise<{ success: boolean; refundId: string }> {
  const res = await HackathonsAPI.post(`/${hackathonSlug}/refunds`, params, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function submitRegistration(
  token: string,
  hackathonSlug: string,
  answers: SubmitRegistrationDto['answers'],
): Promise<{ success: boolean; submissionId: string }> {
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/registrations/submit`,
    { answers },
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export interface HackathonRegistrationStatus {
  hasTeam: boolean;
  teamId: string | null;
  teamName: string | null;
  isLeader: boolean;
  hasSubmitted: boolean;
  /** True if a hackathon_registration_submission row exists (may be a shell with no answers). */
  hasRegistrationRecord?: boolean;
  submissionId: string | null;
  paymentStatus: string | null;
  paymentCompleted: boolean;
  isPaidButIncomplete: boolean;
  canCompleteRegistrationWithoutPayment: boolean;
  isRegistrationIncomplete: boolean;
  /** True when the user has a CREATED Razorpay order and has not completed payment. */
  awaitingCheckout?: boolean;
  /** Saved answers to prefill the registration modal before completing checkout. */
  draftAnswers?: Array<{ fieldId: string; value: unknown }> | null;
  /** Paid tier from successful payment (when applicable). */
  ticketTierId?: string | null;
  ticketTierName?: string | null;
}

export async function getHackathonRegistrationStatus(
  token: string,
  hackathonSlug: string,
): Promise<HackathonRegistrationStatus> {
  const res = await HackathonsAPI.get(
    `/${hackathonSlug}/registrations/status`,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data as HackathonRegistrationStatus;
}

export async function getPayoutDetails(
  token: string,
  eventId?: string,
  hackathonId?: string,
): Promise<PayoutDetails | null> {
  const params: Record<string, string> = {};
  if (eventId) params.eventId = eventId;
  if (hackathonId) params.hackathonId = hackathonId;

  const res = await PaymentsAPI.get("/payout-details", {
    headers: buildAuthHeaders(token),
    params,
  });
  const data = res.data as PayoutDetailsApiResponse;
  if (data && typeof data === "object" && "exists" in data && data.exists === false) {
    return null;
  }
  if (data && typeof data === "object" && "exists" in data && data.exists === true) {
    const { exists: _e, ...rest } = data;
    return rest as PayoutDetails;
  }
  return res.data as PayoutDetails | null;
}

export async function upsertPayoutDetails(
  token: string,
  params: PayoutDetailsInput,
): Promise<PayoutDetails> {
  const res = await PaymentsAPI.put("/payout-details", params, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

// =============================================================================
// TICKET TIERS
// =============================================================================

export interface TicketTier {
  id: string;
  eventId?: string | null;
  hackathonId?: string | null;
  name: string;
  description?: string | null;
  price: string | number;
  currency?: string;
  capacity: number | null;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    eventPayments?: number;
    hackathonPayments?: number;
  };
}

export type CreateTicketTierParams = CreateTicketTierDto;

const EventsAPI = createApiClient("/events");

// Hackathon Ticket Tiers
export async function getHackathonTicketTiers(
  token: string,
  hackathonSlug: string,
): Promise<TicketTier[]> {
  const res = await HackathonsAPI.get(`/${hackathonSlug}/tickets`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function createHackathonTicketTier(
  token: string,
  hackathonSlug: string,
  params: CreateTicketTierParams,
): Promise<TicketTier> {
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/tickets`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function updateHackathonTicketTier(
  token: string,
  hackathonSlug: string,
  tierId: string,
  params: Partial<UpdateTicketTierDto>,
): Promise<TicketTier> {
  const res = await HackathonsAPI.patch(
    `/${hackathonSlug}/tickets/${tierId}`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function deleteHackathonTicketTier(
  token: string,
  hackathonSlug: string,
  tierId: string,
): Promise<void> {
  await HackathonsAPI.delete(`/${hackathonSlug}/tickets/${tierId}`, {
    headers: buildAuthHeaders(token),
  });
}

export async function toggleHackathonTicketTierActive(
  token: string,
  hackathonSlug: string,
  tierId: string,
  isActive: boolean,
): Promise<TicketTier> {
  return updateHackathonTicketTier(token, hackathonSlug, tierId, { isActive });
}

// Event Ticket Tiers
export async function getEventTicketTiers(
  token: string,
  eventSlug: string,
): Promise<TicketTier[]> {
  const res = await EventsAPI.get(`/${eventSlug}/tickets`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function createEventTicketTier(
  token: string,
  eventSlug: string,
  params: CreateTicketTierParams,
): Promise<TicketTier> {
  const res = await EventsAPI.post(
    `/${eventSlug}/tickets`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function updateEventTicketTier(
  token: string,
  eventSlug: string,
  tierId: string,
  params: Partial<UpdateTicketTierDto>,
): Promise<TicketTier> {
  const res = await EventsAPI.patch(
    `/${eventSlug}/tickets/${tierId}`,
    params,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function deleteEventTicketTier(
  token: string,
  eventSlug: string,
  tierId: string,
): Promise<void> {
  await EventsAPI.delete(`/${eventSlug}/tickets/${tierId}`, {
    headers: buildAuthHeaders(token),
  });
}

export async function toggleEventTicketTierActive(
  token: string,
  eventSlug: string,
  tierId: string,
  isActive: boolean,
): Promise<TicketTier> {
  return updateEventTicketTier(token, eventSlug, tierId, { isActive });
}
