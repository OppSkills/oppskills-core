import { buildAuthHeaders, createApiClient } from "./apiClient";

const PaymentsAPI = createApiClient("/payments");
const HackathonsAPI = createApiClient("/hackathons");

export interface RouteOnboardingParams {
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType: string;
  contactName: string;
  profile: {
    category: string;
    subcategory: string;
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  legalInfo?: {
    pan?: string;
    gst?: string;
  };
  stakeholder: {
    name: string;
    email: string;
    phone?: {
      primary: string;
      secondary?: string;
    };
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    kyc?: {
      pan: string;
    };
    notes?: Record<string, string>;
  };
  settlements: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
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

export interface CreateDiscountCodeParams {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  maxRedemptions?: number;
  maxPerUser?: number;
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
  totalGross: number;
  totalPlatformFee: number;
  totalOrganizerShare: number;
  totalRefunded: number;
  netEarnings: number;
  paidOut: number;
  pendingPayout: number;
  eligibleAt: string | null;
  isEligibleNow: boolean;
  capturedPaymentsCount: number;
  currency: string;
}

export interface PayoutDetails {
  userId: string;
  accountHolderName: string;
  accountNumberLast4: string;
  ifsc: string;
  upiId: string | null;
  updatedAt: string;
}

export interface PayoutDetailsInput {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}

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
  params: { accountNumber: string; ifscCode: string; beneficiaryName: string },
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
  params: CreateDiscountCodeParams,
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
  params: Partial<CreateDiscountCodeParams & { active: boolean }>,
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

export async function createPaymentOrder(
  token: string,
  hackathonSlug: string,
  params: { teamId?: string; discountCode?: string },
): Promise<PaymentOrder> {
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/payment/order`,
    params,
    {
      headers: buildAuthHeaders(token),
    },
  );
  return res.data;
}

export async function verifyPayment(
  token: string,
  hackathonSlug: string,
  params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
): Promise<{ success: boolean; paymentId: string }> {
  const res = await HackathonsAPI.post(
    `/${hackathonSlug}/payment/verify`,
    params,
    {
      headers: buildAuthHeaders(token),
    },
  );
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
  params: { paymentId: string; amount?: number; reason?: string },
): Promise<{ success: boolean; refundId: string }> {
  const res = await HackathonsAPI.post(`/${hackathonSlug}/refunds`, params, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function submitRegistration(
  token: string,
  hackathonSlug: string,
  answers: Array<{ fieldId: string; value: string }>,
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

export async function getPayoutDetails(
  token: string,
): Promise<PayoutDetails | null> {
  const res = await PaymentsAPI.get("/payout-details", {
    headers: buildAuthHeaders(token),
  });
  return res.data;
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
