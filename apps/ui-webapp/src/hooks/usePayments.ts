import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getRouteStatus,
  submitRouteOnboarding,
  updateRouteSettlements,
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getHackathonEarnings,
  getHackathonPayments,
  requestRefund,
  getPayoutDetails,
  upsertPayoutDetails,
  type RouteOnboardingParams,
  type CreateDiscountCodeParams,
  type PayoutDetailsInput,
} from "@/lib/api/paymentsApi";

export function useRouteStatus() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["route-status"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getRouteStatus(token);
    },
  });
}

export function useRouteOnboarding() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RouteOnboardingParams) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return submitRouteOnboarding(token, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-status"] });
    },
  });
}

export function useUpdateRouteSettlements() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      accountNumber: string;
      ifscCode: string;
      beneficiaryName: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateRouteSettlements(token, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-status"] });
    },
  });
}

export function useDiscountCodes(hackathonSlug: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["discount-codes", hackathonSlug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getDiscountCodes(token, hackathonSlug);
    },
    enabled: !!hackathonSlug,
  });
}

export function useCreateDiscountCode(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDiscountCodeParams) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createDiscountCode(token, hackathonSlug, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount-codes", hackathonSlug],
      });
    },
  });
}

export function useUpdateDiscountCode(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codeId,
      ...params
    }: { codeId: string } & Partial<
      CreateDiscountCodeParams & { active: boolean }
    >) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateDiscountCode(token, hackathonSlug, codeId, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount-codes", hackathonSlug],
      });
    },
  });
}

export function useDeleteDiscountCode(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteDiscountCode(token, hackathonSlug, codeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount-codes", hackathonSlug],
      });
    },
  });
}

export function useHackathonEarnings(hackathonSlug: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["hackathon-earnings", hackathonSlug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getHackathonEarnings(token, hackathonSlug);
    },
    enabled: !!hackathonSlug,
  });
}

export function useHackathonPayments(hackathonSlug: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["hackathon-payments", hackathonSlug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getHackathonPayments(token, hackathonSlug);
    },
    enabled: !!hackathonSlug,
  });
}

export function useRequestRefund(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      paymentId: string;
      amount?: number;
      reason?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return requestRefund(token, hackathonSlug, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hackathon-payments", hackathonSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["hackathon-earnings", hackathonSlug],
      });
    },
  });
}

export function usePayoutDetails(eventId?: string, hackathonId?: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["payout-details", eventId, hackathonId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getPayoutDetails(token, eventId, hackathonId);
    },
    enabled: !!eventId || !!hackathonId,
  });
}

export function useUpsertPayoutDetails(eventId?: string, hackathonId?: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PayoutDetailsInput) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return upsertPayoutDetails(token, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-details"] });
      queryClient.invalidateQueries({ queryKey: ["payout-details", eventId, hackathonId] });
    },
  });
}

// =============================================================================
// TICKET TIERS
// =============================================================================

import {
  getHackathonTicketTiers,
  createHackathonTicketTier,
  updateHackathonTicketTier,
  deleteHackathonTicketTier,
  toggleHackathonTicketTierActive,
  getEventTicketTiers,
  createEventTicketTier,
  updateEventTicketTier,
  deleteEventTicketTier,
  toggleEventTicketTierActive,
  type CreateTicketTierParams,
} from "@/lib/api/paymentsApi";

/** ------------------------------------------------------------------
 * HACKATHON TICKET TIERS
 * ----------------------------------------------------------------- */

export function useHackathonTicketTiers(hackathonSlug: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["ticket-tiers", "hackathon", hackathonSlug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getHackathonTicketTiers(token, hackathonSlug);
    },
    enabled: !!hackathonSlug,
  });
}

export function useCreateHackathonTicketTier(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTicketTierParams) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createHackathonTicketTier(token, hackathonSlug, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "hackathon", hackathonSlug],
      });
    },
  });
}

export function useUpdateHackathonTicketTier(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tierId,
      params,
    }: {
      tierId: string;
      params: Partial<CreateTicketTierParams>;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateHackathonTicketTier(token, hackathonSlug, tierId, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "hackathon", hackathonSlug],
      });
    },
  });
}

export function useDeleteHackathonTicketTier(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tierId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteHackathonTicketTier(token, hackathonSlug, tierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "hackathon", hackathonSlug],
      });
    },
  });
}

export function useToggleHackathonTicketTierActive(hackathonSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tierId,
      isActive,
    }: {
      tierId: string;
      isActive: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return toggleHackathonTicketTierActive(
        token,
        hackathonSlug,
        tierId,
        isActive,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "hackathon", hackathonSlug],
      });
    },
  });
}

/** ------------------------------------------------------------------
 * EVENT TICKET TIERS
 * ----------------------------------------------------------------- */

export function useEventTicketTiers(eventSlug: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["ticket-tiers", "event", eventSlug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getEventTicketTiers(token, eventSlug);
    },
    enabled: !!eventSlug,
  });
}

export function useCreateEventTicketTier(eventSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTicketTierParams) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createEventTicketTier(token, eventSlug, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "event", eventSlug],
      });
    },
  });
}

export function useUpdateEventTicketTier(eventSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tierId,
      params,
    }: {
      tierId: string;
      params: Partial<CreateTicketTierParams>;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateEventTicketTier(token, eventSlug, tierId, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "event", eventSlug],
      });
    },
  });
}

export function useDeleteEventTicketTier(eventSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tierId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteEventTicketTier(token, eventSlug, tierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "event", eventSlug],
      });
    },
  });
}

export function useToggleEventTicketTierActive(eventSlug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tierId,
      isActive,
    }: {
      tierId: string;
      isActive: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return toggleEventTicketTierActive(token, eventSlug, tierId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-tiers", "event", eventSlug],
      });
    },
  });
}

