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
