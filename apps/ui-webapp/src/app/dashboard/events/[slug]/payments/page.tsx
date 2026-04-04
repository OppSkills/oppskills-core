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
  X,
  Search,
  GraduationCap,
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
import { format } from "date-fns";

type FeeBearer = "ORGANISER" | "PARTICIPANT";
type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface SelectedCollege {
  id: string;
  name: string;
}

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

interface PricingState {
  isFree: boolean;
  feeBearer: FeeBearer;
  entryFeeAmount: string;
  freeCollegeIds: string[];
}

function serializePricing(state: PricingState): string {
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
  const [entryFeeAmount, setEntryFeeAmount] = useState<string>("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [selectedColleges, setSelectedColleges] = useState<SelectedCollege[]>(
    [],
  );
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [collegeSearchResults, setCollegeSearchResults] = useState<
    SelectedCollege[]
  >([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const collegeSearchRef = useRef<HTMLDivElement>(null);
  const collegeSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  const { data: payoutDetails, isLoading: payoutLoading } = usePayoutDetails();
  const upsertPayoutDetails = useUpsertPayoutDetails();
  const { data: earnings } = useEventEarnings(slug ?? "");
  const updatePricing = useUpdateEventPricing(slug ?? "");

  const currentPricing = useMemo(
    (): PricingState => ({
      isFree: !isPaid,
      feeBearer,
      entryFeeAmount,
      freeCollegeIds: selectedColleges.map((c) => c.id),
    }),
    [isPaid, feeBearer, entryFeeAmount, selectedColleges],
  );

  const latestPricingRef = useRef<PricingState>(currentPricing);
  useEffect(() => {
    latestPricingRef.current = currentPricing;
  }, [currentPricing]);

  useEffect(() => {
    if (eventData && !hasHydrated) {
      setEventId(eventData.id);
      setIsPaid(!eventData.isFree);
      setFeeBearer((eventData.feeBearer as FeeBearer) || "ORGANISER");
      setEntryFeeAmount(eventData.entryFeeAmount?.toString() || "");

      // Hydrate freeCollegeIds - fetch actual college names
      if (eventData.freeCollegeIds && eventData.freeCollegeIds.length > 0) {
        const fetchCollegeNames = async () => {
          try {
            const token = await getToken();
            if (!token) return;
            const collegeIds = eventData.freeCollegeIds || [];
            const colleges = await getCollegesByIds(token, collegeIds);
            setSelectedColleges(
              colleges.map((c) => ({
                id: c.id,
                name: c.name,
              })),
            );
          } catch (error) {
            console.error("Failed to fetch college names:", error);
            const collegeIds = eventData.freeCollegeIds || [];
            setSelectedColleges(
              collegeIds.map((id) => ({
                id,
                name: `College ${id.slice(-6)}`,
              })),
            );
          }
        };
        fetchCollegeNames();
      }

      const initialState: PricingState = {
        isFree: eventData.isFree,
        feeBearer: (eventData.feeBearer as FeeBearer) || "ORGANISER",
        entryFeeAmount: eventData.entryFeeAmount?.toString() || "",
        freeCollegeIds: eventData.freeCollegeIds || [],
      };
      lastSavedSnapshotRef.current = serializePricing(initialState);
      lastSavedAtRef.current = Date.now();
      setAutoSaveStatus("saved");
      setHasHydrated(true);
    }
  }, [eventData, hasHydrated, getToken]);

  // College search effect
  useEffect(() => {
    if (collegeSearchDebounceRef.current) {
      clearTimeout(collegeSearchDebounceRef.current);
    }

    if (collegeSearchQuery.trim().length < 2) {
      setCollegeSearchResults([]);
      setIsSearchingColleges(false);
      return;
    }

    setIsSearchingColleges(true);
    collegeSearchDebounceRef.current = setTimeout(async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const results = await searchColleges(token, collegeSearchQuery);
        setCollegeSearchResults(
          results
            .filter((r) => !selectedColleges.some((sc) => sc.id === r.id))
            .map((r) => ({ id: r.id, name: r.name })),
        );
      } catch {
        setCollegeSearchResults([]);
      } finally {
        setIsSearchingColleges(false);
      }
    }, 300);

    return () => {
      if (collegeSearchDebounceRef.current) {
        clearTimeout(collegeSearchDebounceRef.current);
      }
    };
  }, [collegeSearchQuery, getToken, selectedColleges]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        collegeSearchRef.current &&
        !collegeSearchRef.current.contains(event.target as Node)
      ) {
        setShowCollegeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCollege = (college: SelectedCollege) => {
    if (selectedColleges.length >= 5) {
      toast.error("Maximum 5 colleges allowed");
      return;
    }
    if (selectedColleges.some((c) => c.id === college.id)) return;
    setSelectedColleges((prev) => [...prev, college]);
    setCollegeSearchQuery("");
    setCollegeSearchResults([]);
    setShowCollegeDropdown(false);
  };

  const handleRemoveCollege = (collegeId: string) => {
    setSelectedColleges((prev) => prev.filter((c) => c.id !== collegeId));
  };

  const runSaveMutation = useCallback((): void => {
    if (updatePricing.isPending) {
      saveQueuedRef.current = true;
      return;
    }

    setAutoSaveStatus("saving");
    savingSnapshotRef.current = serializePricing(latestPricingRef.current);

    const pricing = latestPricingRef.current;
    const feeAmount = pricing.entryFeeAmount.trim();
    const parsedFee = feeAmount ? parseFloat(feeAmount) : null;

    updatePricing.mutate(
      {
        isFree: pricing.isFree,
        feeBearer: pricing.isFree ? undefined : pricing.feeBearer,
        entryFeeAmount: pricing.isFree
          ? undefined
          : parsedFee !== null && !isNaN(parsedFee)
            ? parsedFee.toFixed(2)
            : undefined,
        freeCollegeIds: pricing.isFree ? undefined : pricing.freeCollegeIds,
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
        onError: () => {
          setAutoSaveStatus("error");
          savingSnapshotRef.current = null;
          toast.error("Failed to save pricing settings");
        },
      },
    );
  }, [updatePricing, queryClient, slug]);

  useEffect(() => {
    if (!hasHydrated || !eventId) return;

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
    eventId,
    autoSaveStatus,
    runSaveMutation,
  ]);

  if (!slug) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid event</p>
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

  const registrationStarted = eventData && eventData.registrationCount > 0;
  const isPricingLifecycleEditable =
    eventData &&
    eventData.status !== "COMPLETED" &&
    eventData.status !== "CANCELLED";
  const canEditPricing =
    !!isPricingLifecycleEditable && !registrationStarted;

  return (
    <div className="flex flex-col items-start gap-5 p-10 w-full flex-1 self-stretch min-h-[600px] rounded-[20px] bg-background border border-transparent shadow-sm">
      {/* Auto-save status indicator */}
      <div className="w-full flex items-center justify-between px-2 py-2 bg-muted/30 rounded-lg">
        <div className="text-xs font-medium">
          {autoSaveStatus === "saving" ? (
            <span className="text-primary flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          ) : autoSaveStatus === "dirty" ? (
            <span className="text-amber-600">Unsaved changes</span>
          ) : autoSaveStatus === "error" ? (
            <span className="text-destructive">Save failed</span>
          ) : (
            <span className="text-emerald-600">Saved</span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {typeof lastSavedAtRef.current === "number"
            ? `Last saved: ${new Date(lastSavedAtRef.current).toLocaleTimeString()}`
            : ""}
        </div>
      </div>

      <p className="font-sans text-muted-foreground text-sm font-normal">
        Set up event fees for participants (if applicable). Configure payment
        settings and payout account details.
      </p>

      {/* REGISTRATION STARTED WARNING */}
      {registrationStarted && (
        <div className="w-full p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Pricing Fields Locked
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Cannot change pricing fields (isFree, entryFeeAmount) after
                registration has started.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IS EVENT PAID */}
      <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
        <div className="flex flex-col items-start gap-3">
          <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
            Is The Event Paid
          </h6>
          {!canEditPricing && (
            <p className="text-sm text-muted-foreground">
              {registrationStarted
                ? "Pricing cannot be changed after registration has started."
                : "Pricing cannot be edited for this status."}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => canEditPricing && setIsPaid(true)}
            disabled={!canEditPricing}
            variant="ghost"
            className={cn(
              "flex min-w-[100px] px-4 py-2 justify-center items-center gap-2.5 rounded-full flex-1 h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
              isPaid
                ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
            )}
          >
            Yes
          </Button>

          <Button
            onClick={() => canEditPricing && setIsPaid(false)}
            disabled={!canEditPricing}
            variant="ghost"
            className={cn(
              "flex min-w-[100px] px-4 py-2 justify-center items-center gap-2.5 rounded-full flex-1 h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
              !isPaid
                ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
            )}
          >
            No
          </Button>
        </div>
      </div>

      {/* PAID CONFIGURATION */}
      {isPaid && (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-top-2 duration-300">
          <PayoutDetailsForm
            onSave={handlePayoutDetailsSave}
            isOpen={isPayoutFormOpen}
            onClose={() => setIsPayoutFormOpen(false)}
            initialData={
              payoutDetails
                ? {
                  accountHolderName: payoutDetails.accountHolderName,
                  accountNumber: "",
                  ifsc: payoutDetails.ifsc,
                  upiId: payoutDetails.upiId || "",
                }
                : undefined
            }
            isLoading={upsertPayoutDetails.isPending}
          />

          {/* EARNINGS OVERVIEW */}
          {earnings && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <div className="flex flex-col p-5 gap-2 rounded-2xl border border-border bg-card">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> Total Payment Collected
                </span>
                <span className="text-2xl font-semibold text-primary">
                  ₹{parseFloat(String(earnings.totalGross)).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {earnings.capturedPaymentsCount} payment
                  {earnings.capturedPaymentsCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-col p-5 gap-2 rounded-2xl border border-border bg-card">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Pending Payout
                </span>
                <span className="text-2xl font-semibold">
                  ₹{parseFloat(String(earnings.pendingPayout)).toFixed(2)}
                </span>
                {!earnings.isEligibleNow && earnings.eligibleAt && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
                    Available {format(new Date(earnings.eligibleAt), "MMM d")}
                  </span>
                )}
              </div>

              <div className="flex flex-col p-5 gap-2 rounded-2xl border border-border bg-card">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> Paid Out
                </span>
                <span className="text-2xl font-semibold text-green-600">
                  ₹{parseFloat(String(earnings.paidOut)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* FEE BEARER */}
          <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Who Pays the Processing Fee?
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                The processing fee is 2% + 18% GST (= 2.36%). Choose who bears
                it.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => canEditPricing && setFeeBearer("ORGANISER")}
                disabled={!canEditPricing}
                variant="ghost"
                className={cn(
                  "flex min-w-[180px] px-4 py-2 justify-center items-center gap-2.5 rounded-full h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
                  feeBearer === "ORGANISER"
                    ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                    : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
                )}
              >
                Organiser (default)
              </Button>

              <Button
                onClick={() => canEditPricing && setFeeBearer("PARTICIPANT")}
                disabled={!canEditPricing}
                variant="ghost"
                className={cn(
                  "flex min-w-[180px] px-4 py-2 justify-center items-center gap-2.5 rounded-full h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
                  feeBearer === "PARTICIPANT"
                    ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                    : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
                )}
              >
                Participant
              </Button>
            </div>

            {feeBearer === "PARTICIPANT" && (
              <p className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 px-3 py-2 rounded-lg">
                Participants will be charged the entry fee + 2.36% processing
                fee at checkout.
              </p>
            )}
          </div>

          {/* ENTRY FEE */}
          <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Entry Fee Amount
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                Amount charged per participant
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-medium">₹</span>
              <Input
                type="number"
                value={entryFeeAmount}
                onChange={(e) =>
                  canEditPricing && setEntryFeeAmount(e.target.value)
                }
                disabled={!canEditPricing}
                placeholder="Enter amount"
                className="max-w-[200px]"
              />
            </div>
          </div>

          {/* FREE FOR COLLEGES */}
          <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Free for Select Colleges
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                Students from these colleges will get free entry (max 5).
              </p>
            </div>

            {/* Selected colleges */}
            {selectedColleges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedColleges.map((college) => (
                  <div
                    key={college.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span className="max-w-[200px] truncate">
                      {college.name}
                    </span>
                    {canEditPricing && (
                      <button
                        onClick={() => handleRemoveCollege(college.id)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* College search */}
            {canEditPricing && selectedColleges.length < 5 && (
              <div
                ref={collegeSearchRef}
                className="relative w-full max-w-[400px]"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={collegeSearchQuery}
                    onChange={(e) => {
                      setCollegeSearchQuery(e.target.value);
                      setShowCollegeDropdown(true);
                    }}
                    onFocus={() => setShowCollegeDropdown(true)}
                    placeholder="Search colleges..."
                    className="pl-9"
                  />
                  {isSearchingColleges && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showCollegeDropdown &&
                  collegeSearchQuery.trim().length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                      {isSearchingColleges ? (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                          Searching...
                        </div>
                      ) : collegeSearchResults.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                          No colleges found
                        </div>
                      ) : (
                        collegeSearchResults.map((college) => (
                          <button
                            key={college.id}
                            onClick={() => handleAddCollege(college)}
                            className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
                          >
                            <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{college.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>
            )}

            {selectedColleges.length >= 5 && (
              <p className="text-sm text-muted-foreground">
                Maximum 5 colleges allowed
              </p>
            )}
          </div>

          {/* FEE BREAKDOWN */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Fee Breakdown
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                {feeBearer === "PARTICIPANT"
                  ? "Participant pays the entry fee plus Razorpay processing (2% + 18% GST on that fee). You receive the full entry fee — there is no separate platform cut."
                  : "Participant pays only the entry fee. Razorpay processing (2% + 18% GST on that fee) is deducted from your payout."}
              </p>
            </div>

            <div className="flex items-start gap-[15px] w-full flex-wrap">
              {feeBearer === "PARTICIPANT" ? (
                <CalculationCard
                  title="Participant View"
                  isSelected={true}
                  onClick={() => { }}
                  totalRowLabel="Participant pays total"
                  values={(() => {
                    const entryFee = parseFloat(entryFeeAmount || "0");
                    const rz = Math.round(entryFee * 0.02 * 100) / 100;
                    const gstOnRz = Math.round(rz * 0.18 * 100) / 100;
                    const processingTotal = rz + gstOnRz;
                    const participantPays = entryFee + processingTotal;

                    return {
                      reg: `₹ ${entryFee.toFixed(2)}`,
                      platformFee: `₹ ${rz.toFixed(2)}`,
                      gst: `₹ ${gstOnRz.toFixed(2)}`,
                      totalDeduction: `₹ ${participantPays.toFixed(2)}`,
                      youGet: `₹ ${entryFee.toFixed(2)}`,
                    };
                  })()}
                />
              ) : (
                <CalculationCard
                  title="Fee Structure"
                  isSelected={true}
                  onClick={() => { }}
                  totalRowLabel="Total Razorpay processing"
                  values={(() => {
                    const entryFee = parseFloat(entryFeeAmount || "0");
                    const rz = Math.round(entryFee * 0.02 * 100) / 100;
                    const gstOnRz = Math.round(rz * 0.18 * 100) / 100;
                    const processingTotal = rz + gstOnRz;
                    const youGet = entryFee - processingTotal;

                    return {
                      reg: `₹ ${entryFee.toFixed(2)}`,
                      platformFee: `₹ ${rz.toFixed(2)}`,
                      gst: `₹ ${gstOnRz.toFixed(2)}`,
                      totalDeduction: `₹ ${processingTotal.toFixed(2)}`,
                      youGet: `₹ ${youGet.toFixed(2)}`,
                    };
                  })()}
                />
              )}
            </div>
          </div>

          {/* PAYOUT ACCOUNT DETAILS */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex justify-between items-center self-stretch">
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-3">
                  <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                    Payout Account Details
                  </h6>
                  {payoutDetails ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                      <AlertCircle className="w-4 h-4" />
                      Not Set
                    </div>
                  )}
                </div>
                <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                  Bank details for receiving payouts from paid registrations
                </p>
              </div>

              <button
                className="flex w-9 h-9 justify-center items-center rounded-full hover:bg-muted transition-colors"
                onClick={() => setIsPayoutFormOpen(true)}
              >
                <Pencil
                  className="w-5 h-5 text-muted-foreground"
                  strokeWidth={2}
                />
              </button>
            </div>

            {payoutLoading ? (
              <div className="flex items-center justify-center p-8 w-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : !payoutDetails ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl w-full">
                <p className="text-muted-foreground mb-4">
                  Set up your payout account to receive payments
                </p>
                <Button onClick={() => setIsPayoutFormOpen(true)}>
                  Set Up Payout Account
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-2.5 self-stretch">
                <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                  Account Holder
                </div>
                <div className="font-sans text-foreground text-base font-normal leading-relaxed">
                  {payoutDetails.accountHolderName}
                </div>
                <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                  Account Number
                </div>
                <div className="font-sans text-foreground text-base font-normal leading-relaxed">
                  xxxx-xxxx-{payoutDetails.accountNumberLast4}
                </div>
                <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                  IFSC Code
                </div>
                <div className="font-sans text-foreground text-base font-normal leading-relaxed">
                  {payoutDetails.ifsc}
                </div>
                {payoutDetails.upiId && (
                  <>
                    <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                      UPI ID
                    </div>
                    <div className="font-sans text-foreground text-base font-normal leading-relaxed">
                      {payoutDetails.upiId}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CalculationCardProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
  totalRowLabel?: string;
  values: {
    reg: string;
    platformFee: string;
    gst: string;
    totalDeduction: string;
    youGet: string;
  };
}

const CalculationCard = ({
  title,
  isSelected,
  onClick,
  totalRowLabel = "Total processing",
  values,
}: CalculationCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full max-w-[362px] p-5 flex-col items-start gap-3 rounded-2xl border bg-background transition-all duration-200",
        isSelected
          ? "border-primary-500 shadow-[0_0_12px_0_rgba(149,0,213,0.3)]"
          : "border-primary/20 cursor-pointer",
      )}
    >
      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-foreground text-xl font-medium leading-relaxed">
          {title}
        </span>
        {isSelected ? (
          <CheckCircle className="w-6 h-6 fill-primary-500 text-background" />
        ) : (
          <Circle className="w-6 h-6 text-primary/30" />
        )}
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            Entry Fee:
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.reg}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            Razorpay fee (2%):
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.platformFee}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            GST on Razorpay fee:
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.gst}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            {totalRowLabel}:
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.totalDeduction}
          </span>
        </div>
      </div>

      <div className="w-full h-[1px] bg-muted-foreground/50"></div>

      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
          You receive
        </span>
        <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
          {values.youGet}
        </span>
      </div>
    </div>
  );
};

