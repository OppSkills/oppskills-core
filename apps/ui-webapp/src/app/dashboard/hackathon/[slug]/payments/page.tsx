"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import { cn, getApiErrorMessage } from "@/lib/utils";
import PayoutDetailsForm from "@/components/ui/payment-side/PayoutDetailsForm";
import {
  usePayoutDetails,
  useUpsertPayoutDetails,
  useHackathonEarnings,
} from "@/hooks/usePayments";
import { useHackathonBySlug } from "@/hooks/useHackathonBySlug";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import { updateHackathon } from "@/lib/api/hackathonApi";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";
import {
  PaymentManagementLayout,
  type FeeBearer,
  type ChargeMode,
  type AutoSaveStatus,
} from "@/app/dashboard/_components/payments/PaymentManagementLayout";

function serializePricing(state: any): string {
  return JSON.stringify(state);
}

// Define a local interface for the hackathon data we expect
interface HackathonData {
  id: string;
  slug: string;
  status: string;
  isFree: boolean;
  entryFeeAmount: number | null;
  chargeMode: ChargeMode;
  feeBearer: FeeBearer;
  freeCollegeIds?: string[];
  registrationCount: number;
  teams: unknown[];
  ownerId: string;
}

export default function Page() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [chargeMode, setChargeMode] = useState<ChargeMode>("PER_TEAM");
  const [feeBearer, setFeeBearer] = useState<FeeBearer>("ORGANISER");
  const [entryFeeAmount, setEntryFeeAmount] = useState<string>("0");
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const savingSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueuedRef = useRef<boolean>(false);
  const lastSavedAtRef = useRef<number | null>(null);

  const { data: hackathonData } = useHackathonBySlug(slug ?? "");
  const hackathon = hackathonData as HackathonData | undefined;

  const { data: payoutDetails, isLoading: payoutLoading } = usePayoutDetails();
  const upsertPayoutDetails = useUpsertPayoutDetails();
  const { data: earnings } = useHackathonEarnings(slug ?? "");

  const currentPricing = useMemo(
    () => ({
      isFree: !isPaid,
      chargeMode,
      feeBearer,
      entryFeeAmount: isPaid ? entryFeeAmount : "0",
    }),
    [isPaid, chargeMode, feeBearer, entryFeeAmount],
  );

  const latestPricingRef = useRef<any>(currentPricing);
  useEffect(() => {
    latestPricingRef.current = currentPricing;
  }, [currentPricing]);

  useEffect(() => {
    if (hackathon && !hasHydrated) {
      setHackathonId(hackathon.id);
      setIsPaid(!hackathon.isFree);
      setChargeMode((hackathon.chargeMode as ChargeMode) || "PER_TEAM");
      setFeeBearer((hackathon.feeBearer as FeeBearer) || "ORGANISER");
      setEntryFeeAmount(hackathon.entryFeeAmount?.toString() || "0");

      const initialState = {
        isFree: hackathon.isFree,
        chargeMode: (hackathon.chargeMode as ChargeMode) || "PER_TEAM",
        feeBearer: (hackathon.feeBearer as FeeBearer) || "ORGANISER",
        entryFeeAmount: !hackathon.isFree ? (hackathon.entryFeeAmount?.toString() || "0") : "0",
      };
      lastSavedSnapshotRef.current = serializePricing(initialState);
      lastSavedAtRef.current = Date.now();
      setAutoSaveStatus("saved");
      setHasHydrated(true);
    }
  }, [hackathon, hasHydrated]);



  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hackathonId) throw new Error("Hackathon ID not loaded");
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const pricing = latestPricingRef.current;
      await updateHackathon(token, hackathonId, {
        isFree: pricing.isFree,
        chargeMode: pricing.isFree ? undefined : pricing.chargeMode,
        feeBearer: pricing.isFree ? undefined : pricing.feeBearer,
      });
    },
  });

  const runSaveMutation = useCallback((): void => {
    if (saveMutation.isPending) {
      saveQueuedRef.current = true;
      return;
    }

    setAutoSaveStatus("saving");
    savingSnapshotRef.current = serializePricing(latestPricingRef.current);

    saveMutation.mutate(undefined, {
      onSuccess: () => {
        if (typeof savingSnapshotRef.current === "string") {
          lastSavedSnapshotRef.current = savingSnapshotRef.current;
        }
        savingSnapshotRef.current = null;

        const nowSnapshot = serializePricing(latestPricingRef.current);
        if (nowSnapshot === lastSavedSnapshotRef.current) {
          lastSavedAtRef.current = Date.now();
          setAutoSaveStatus("saved");
        } else {
          setAutoSaveStatus("dirty");
        }

        queryClient.invalidateQueries({ queryKey: ["hackathon", slug] });

        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          setTimeout(() => runSaveMutation(), 0);
        }
      },
      onError: () => {
        setAutoSaveStatus("error");
        savingSnapshotRef.current = null;
        toast.error("Failed to save pricing settings");
      },
    });
  }, [saveMutation, queryClient, slug]);

  useEffect(() => {
    if (!hasHydrated || !hackathonId) return;

    const snapshot = serializePricing(currentPricing);
    if (snapshot === lastSavedSnapshotRef.current) {
      if (autoSaveStatus !== "saving") setAutoSaveStatus("saved");
      return;
    }

    setAutoSaveStatus("dirty");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSaveMutation();
    }, 900);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    currentPricing,
    hasHydrated,
    hackathonId,
    autoSaveStatus,
    runSaveMutation,
  ]);

  if (!slug) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid hackathon</p>
      </div>
    );
  }

  const handlePayoutDetailsSave = async (data: PayoutDetailsInput) => {
    try {
      await upsertPayoutDetails.mutateAsync(data);
      toast.success("Payout details saved successfully");
      setIsPayoutFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        getApiErrorMessage(error, "Failed to save payout details"),
      );
    }
  };

  const registrationStarted = !!(
    hackathon &&
    (hackathon.registrationCount > 0 ||
      (hackathon.teams && hackathon.teams.length > 0))
  );
  const isPricingLifecycleEditable =
    hackathon &&
    hackathon.status !== "COMPLETED" &&
    hackathon.status !== "CANCELLED";
  const canEditPricing =
    !!isPricingLifecycleEditable && !registrationStarted;

  return (
    <div className="w-full p-4 sm:p-8 min-h-screen">
      <PaymentManagementLayout
        opportunityType="Hackathon"
        isPaid={isPaid}
        setIsPaid={setIsPaid}
        chargeMode={chargeMode}
        setChargeMode={setChargeMode}
        feeBearer={feeBearer}
        setFeeBearer={setFeeBearer}
        entryFeeAmount={entryFeeAmount}
        setEntryFeeAmount={setEntryFeeAmount}
        canEditPricing={canEditPricing}
        earnings={earnings}
        payoutDetails={payoutDetails}
        payoutLoading={payoutLoading}
        isPayoutFormOpen={isPayoutFormOpen}
        setIsPayoutFormOpen={setIsPayoutFormOpen}
        onPayoutDetailsSave={handlePayoutDetailsSave}
        autoSaveStatus={autoSaveStatus}
        lastSavedAt={lastSavedAtRef.current}
        upsertPayoutLoading={upsertPayoutDetails.isPending}
      />
    </div>
  );
}
