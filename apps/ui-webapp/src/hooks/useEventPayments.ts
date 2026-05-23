import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import type {
  EventEarningsData,
  EventDiscountCodeResponse,
  CreateEventDiscountCodeDto,
  UpdateEventDiscountCodeDto,
  UpdateEventPricingDto,
} from "@oppskills/types";
import {
  getEventEarnings,
  getEventDiscountCodes,
  createEventDiscountCode,
  updateEventDiscountCode,
  deleteEventDiscountCode,
  updateEventPricing,
  type EventPricingData,
} from "@/lib/api/eventApi";

/**
 * Query key factory for event payments.
 */
export const eventPaymentKeys = {
  all: ["event-payments"] as const,
  earnings: (slug: string) =>
    [...eventPaymentKeys.all, "earnings", slug] as const,
  discountCodes: (slug: string) =>
    [...eventPaymentKeys.all, "discount-codes", slug] as const,
};

/**
 * Hook to fetch event earnings data.
 */
export function useEventEarnings(slug: string) {
  const { getToken } = useAuth();

  return useQuery<EventEarningsData>({
    queryKey: eventPaymentKeys.earnings(slug),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getEventEarnings(token, slug);
    },
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch event discount codes.
 */
export function useEventDiscountCodes(slug: string) {
  const { getToken } = useAuth();

  return useQuery<EventDiscountCodeResponse[]>({
    queryKey: eventPaymentKeys.discountCodes(slug),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getEventDiscountCodes(token, slug);
    },
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create an event discount code.
 */
export function useCreateEventDiscountCode(slug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEventDiscountCodeDto) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createEventDiscountCode(token, slug, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventPaymentKeys.discountCodes(slug),
      });
    },
  });
}

/**
 * Hook to update an event discount code.
 */
export function useUpdateEventDiscountCode(slug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codeId,
      ...params
    }: {
      codeId: string;
    } & Partial<UpdateEventDiscountCodeDto>) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateEventDiscountCode(token, slug, codeId, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventPaymentKeys.discountCodes(slug),
      });
    },
  });
}

/**
 * Hook to delete an event discount code.
 */
export function useDeleteEventDiscountCode(slug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteEventDiscountCode(token, slug, codeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: eventPaymentKeys.discountCodes(slug),
      });
    },
  });
}

/**
 * Hook to update event pricing.
 */
export function useUpdateEventPricing(slug: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: Partial<UpdateEventPricingDto>,
    ): Promise<EventPricingData> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateEventPricing(token, slug, params);
    },
    onSuccess: () => {
      // Invalidate event query to refresh pricing data
      queryClient.invalidateQueries({
        queryKey: ["event", slug],
      });
    },
  });
}
