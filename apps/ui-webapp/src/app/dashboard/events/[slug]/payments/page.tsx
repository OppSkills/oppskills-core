"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getApiErrorMessage } from "@/lib/utils";
import {
  Pencil,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Banknote,
  IndianRupee,
} from "lucide-react";
import PayoutDetailsForm from "@/components/ui/payment-side/PayoutDetailsForm";
import {
  usePayoutDetails,
  useUpsertPayoutDetails,
} from "@/hooks/usePayments";
import {
  useEventEarnings,
  useUpdateEventPricing,
} from "@/hooks/useEventPayments";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import { getEventBySlug } from "@/lib/api/eventApi";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";
import {
  PaymentManagementLayout,
  type FeeBearer,
  type AutoSaveStatus,
} from "@/app/dashboard/_components/payments/PaymentManagementLayout";

interface EventData {
  id: string;
  slug: string;
  status: string;
  isFree: boolean;
  entryFeeAmount: number | null;
  feeBearer: FeeBearer;
  freeCollegeIds?: string[];
  registrationCount: number;
  ownerId: string;
}

function serializePricing(state: any): string {
  return JSON.stringify(state);
}

export default function Page() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [feeBearer, setFeeBearer] = useState<FeeBearer>("ORGANISER");
  const [eventId, setEventId] = useState<string | null>(null);
  const [entryFeeAmount, setEntryFeeAmount] = useState<string>("0");
  const [hasHydrated, setHasHydrated] = useState(false);

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const savingSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueuedRef = useRef<boolean>(false);
  const lastSavedAtRef = useRef<number | null>(null);

  // Fetch event data
  const { data: eventData } = useQuery<EventData>({
    queryKey: ["event", slug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getEventBySlug(token, slug ?? "") as Promise<EventData>;
    },
    enabled: !!slug,
  });

  const { data: payoutDetails, isLoading: payoutLoading } = usePayoutDetails(eventData?.id);
  const upsertPayoutDetails = useUpsertPayoutDetails(eventData?.id);
  const { data: earnings } = useEventEarnings(slug ?? "");
  const updatePricing = useUpdateEventPricing(slug ?? "");

  const currentPricing = useMemo(
    () => ({
      isFree: !isPaid,
      feeBearer,
      entryFeeAmount: isPaid ? entryFeeAmount : "0",
    }),
    [isPaid, feeBearer, entryFeeAmount],
  );

  const latestPricingRef = useRef<any>(currentPricing);
  useEffect(() => {
    latestPricingRef.current = currentPricing;
  }, [currentPricing]);

  useEffect(() => {
    if (eventData && !hasHydrated) {
      setEventId(eventData.id);
      setIsPaid(!eventData.isFree);
      setFeeBearer((eventData.feeBearer as FeeBearer) || "ORGANISER");
      setEntryFeeAmount(eventData.entryFeeAmount?.toString() || "0");

      const initialState = {
        isFree: eventData.isFree,
        feeBearer: (eventData.feeBearer as FeeBearer) || "ORGANISER",
        entryFeeAmount: !eventData.isFree ? (eventData.entryFeeAmount?.toString() || "0") : "0",
      };
      lastSavedSnapshotRef.current = serializePricing(initialState);
      lastSavedAtRef.current = Date.now();
      setAutoSaveStatus("saved");
      setHasHydrated(true);
    }
  }, [eventData, hasHydrated, getToken]);



  const runSaveMutation = useCallback((): void => {
    if (updatePricing.isPending) {
      saveQueuedRef.current = true;
      return;
    }

    setAutoSaveStatus("saving");
    savingSnapshotRef.current = serializePricing(latestPricingRef.current);

    const pricing = latestPricingRef.current;
    updatePricing.mutate(
      {
        isFree: pricing.isFree,
        feeBearer: pricing.isFree ? undefined : pricing.feeBearer,
        entryFeeAmount: pricing.isFree ? "0" : pricing.entryFeeAmount,
      },
      {
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

          queryClient.invalidateQueries({ queryKey: ["event", slug] });

          if (saveQueuedRef.current) {
            saveQueuedRef.current = false;
            setTimeout(() => runSaveMutation(), 0);
          }
        },
        onError: (err) => {
          setAutoSaveStatus("error");
          savingSnapshotRef.current = null;
          toast.error(getApiErrorMessage(err, "Failed to save pricing settings"));
        },
      },
    );
  }, [updatePricing, queryClient, slug]);

  useEffect(() => {
    if (!hasHydrated || !eventId) return;

    const snapshot = serializePricing(currentPricing);
    if (snapshot === lastSavedSnapshotRef.current) {
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
  }, [currentPricing, hasHydrated, eventId]);

  if (!slug) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid event</p>
      </div>
    );
  }

  const handlePayoutDetailsSave = async (data: PayoutDetailsInput) => {
    try {
      await upsertPayoutDetails.mutateAsync({ ...data, eventId: eventData?.id });
      toast.success("Payout details saved successfully");
      setIsPayoutFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        getApiErrorMessage(error, "Failed to save payout details"),
      );
    }
  };

  const registrationStarted = !!(eventData && eventData.registrationCount > 0);
  const isPricingLifecycleEditable =
    eventData &&
    eventData.status !== "COMPLETED" &&
    eventData.status !== "CANCELLED";
  const canEditPricing =
    !!isPricingLifecycleEditable && !registrationStarted;

  return (
    <div className="w-full p-4 sm:p-8 min-h-screen">
      <PaymentManagementLayout
        opportunityType="Event"
        isPaid={isPaid}
        setIsPaid={setIsPaid}
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


