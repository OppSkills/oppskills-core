"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReferral,
  deleteReferral,
  getReferralAnalytics,
  getReferralById,
  getReferralRegistrations,
  listReferrals,
  lookupReferrerUser,
  getReferrerDetails,
  type ReferralEntityType,
} from "@/lib/api/referralApi";

async function tokenOrThrow(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

export function useReferrals(entityType: ReferralEntityType, entityId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrals", entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: async () =>
      listReferrals(await tokenOrThrow(getToken), { entityType, entityId }),
  });
}

export function useReferralAnalytics(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral-analytics", entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: async () =>
      getReferralAnalytics(await tokenOrThrow(getToken), {
        entityType,
        entityId,
      }),
  });
}

export function useCreateReferral(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      referrerEmail: string;
      sendEmail?: boolean;
    }) =>
      createReferral(await tokenOrThrow(getToken), {
        ...payload,
        entityType,
        entityId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["referrals", entityType, entityId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["referral-analytics", entityType, entityId],
        }),
      ]);
    },
  });
}

export function useDeleteReferral(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      deleteReferral(await tokenOrThrow(getToken), id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["referrals", entityType, entityId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["referral-analytics", entityType, entityId],
        }),
      ]);
    },
  });
}

export function useReferrerLookup(
  entityType: ReferralEntityType,
  entityId: string,
  email: string,
  enabled: boolean,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrer-lookup", entityType, entityId, email],
    enabled: enabled && email.length > 0,
    retry: false,
    /**
     * Keep the result fresh for a minute so re-focusing the window or
     * re-mounting the modal doesn't re-hit the API for the same email.
     */
    staleTime: 60_000,
    queryFn: async () =>
      lookupReferrerUser(await tokenOrThrow(getToken), {
        entityType,
        entityId,
        email,
      }),
  });
}

export function useReferralRegistrations(
  referralId: string | null,
  page = 1,
  pageSize = 10,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral-registrations", referralId, page, pageSize],
    enabled: Boolean(referralId),
    queryFn: async () =>
      getReferralRegistrations(
        await tokenOrThrow(getToken),
        referralId!,
        page,
        pageSize,
      ),
  });
}

export function useReferralById(referralId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral", referralId],
    enabled: Boolean(referralId),
    queryFn: async () =>
      getReferralById(await tokenOrThrow(getToken), referralId),
  });
}

export function useReferrerDetailsForOrganizer(referralId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrer-details", referralId],
    enabled: Boolean(referralId),
    queryFn: async () =>
      getReferrerDetails(await tokenOrThrow(getToken), referralId!),
  });
}
