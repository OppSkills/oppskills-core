"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Pencil,
  CheckCircle,
  Circle,
  AlertCircle,
  Clock,
  Loader2,
  Banknote,
  IndianRupee,
} from "lucide-react";
import PayoutDetailsForm from "@/components/ui/payment-side/PayoutDetailsForm";
import {
  usePayoutDetails,
  useUpsertPayoutDetails,
  useHackathonEarnings,
} from "@/hooks/usePayments";
import { useHackathonBySlug } from "@/hooks/useHackathonBySlug";
import { toast } from "sonner";
import { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import { format } from "date-fns";

type ChargeMode = "PER_TEAM" | "PER_USER";

// Define a local interface for the hackathon data we expect
interface HackathonData {
  id: string;
  slug: string;
  isFree: boolean;
  entryFeeAmount: number | null;
  chargeMode: ChargeMode;
  registrationCount: number;
  teams: unknown[];
  ownerId: string;
}

export default function Page() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [chargeMode, setChargeMode] = useState<ChargeMode>("PER_TEAM");
  const [entryFeeAmount, setEntryFeeAmount] = useState<string>("");

  const { data: hackathonData } = useHackathonBySlug(slug ?? "");
  const hackathon = hackathonData as HackathonData | undefined;

  const { data: payoutDetails, isLoading: payoutLoading } = usePayoutDetails();
  const upsertPayoutDetails = useUpsertPayoutDetails();
  const { data: earnings, isLoading: earningsLoading } = useHackathonEarnings(
    slug ?? "",
  );

  useEffect(() => {
    if (hackathon) {
      setIsPaid(!hackathon.isFree);
      setChargeMode((hackathon.chargeMode as ChargeMode) || "PER_TEAM");
      setEntryFeeAmount(hackathon.entryFeeAmount?.toString() || "");
    }
  }, [hackathon]);

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
      toast.error("Failed to save payout details");
    }
  };

  const registrationStarted =
    hackathon &&
    (hackathon.registrationCount > 0 ||
      (hackathon.teams && hackathon.teams.length > 0));
  const canEditPricing = !registrationStarted;

  return (
    <div className="flex flex-col items-start gap-5 p-10 w-full flex-1 self-stretch min-h-[600px] rounded-[20px] bg-background border border-transparent shadow-sm">
      <p className="font-sans text-muted-foreground text-sm font-normal">
        Set up opportunity fees for participants (if applicable). Configure
        payment settings and payout account details.
      </p>

      {/* IS HACKATHON PAID */}
      <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
        <div className="flex flex-col items-start gap-3">
          <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
            Is The Hackathon Paid
          </h6>
          {!canEditPricing && (
            <p className="text-sm text-muted-foreground">
              Pricing cannot be changed after registrations have started.
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
                    accountNumber: "", // Don't prefill full account number for security
                    ifsc: payoutDetails.ifsc,
                    upiId: payoutDetails.upiId || "",
                  }
                : undefined
            }
            isLoading={upsertPayoutDetails.isPending}
          />

          {/* EARNINGS OVERVIEW */}
          {earnings && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <div className="flex flex-col p-5 gap-2 rounded-2xl border border-border bg-card">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Pending Payout
                </span>
                <span className="text-2xl font-semibold">
                  ₹{earnings.pendingPayout}
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
                  ₹{earnings.paidOut}
                </span>
              </div>
            </div>
          )}

          {/* CHARGE MODE */}
          <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Charge Mode
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                Choose whether to charge per team or per individual participant
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => canEditPricing && setChargeMode("PER_TEAM")}
                disabled={!canEditPricing}
                variant="ghost"
                className={cn(
                  "flex min-w-[140px] px-4 py-2 justify-center items-center gap-2.5 rounded-full h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
                  chargeMode === "PER_TEAM"
                    ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                    : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
                )}
              >
                Per Team
              </Button>

              <Button
                onClick={() => canEditPricing && setChargeMode("PER_USER")}
                disabled={!canEditPricing}
                variant="ghost"
                className={cn(
                  "flex min-w-[140px] px-4 py-2 justify-center items-center gap-2.5 rounded-full h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
                  chargeMode === "PER_USER"
                    ? "bg-primary-500 text-primary-foreground hover:bg-primary/90"
                    : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80",
                )}
              >
                Per User
              </Button>
            </div>
          </div>

          {/* ENTRY FEE */}
          <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Entry Fee Amount
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                Amount charged{" "}
                {chargeMode === "PER_TEAM" ? "per team" : "per participant"}
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

          {/* FEE BREAKDOWN */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            <div className="flex flex-col items-start gap-3">
              <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                Fee Breakdown
              </h6>
              <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                Platform fee is 2% of the entry fee amount
              </p>
            </div>

            <div className="flex items-start gap-[15px] w-full flex-wrap">
              <CalculationCard
                title="Fee Structure"
                isSelected={true}
                onClick={() => {}}
                values={{
                  reg: `₹ ${entryFeeAmount || "0"}`,
                  service: `₹ ${(
                    parseFloat(entryFeeAmount || "0") * 0.02
                  ).toFixed(2)} (2%)`,
                  userPay: `₹ ${entryFeeAmount || "0"}`,
                  youGet: `₹ ${(
                    parseFloat(entryFeeAmount || "0") * 0.98
                  ).toFixed(2)}`,
                }}
              />
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
  values: {
    reg: string;
    service: string;
    userPay: string;
    youGet: string;
  };
}

const CalculationCard = ({
  title,
  isSelected,
  onClick,
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
            Platform Fee:
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.service}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            User Pays:
          </span>
          <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
            {values.userPay}
          </span>
        </div>
      </div>

      <div className="w-full h-[1px] bg-muted-foreground/50"></div>

      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
          You get
        </span>
        <span className="font-sans text-primary-500 text-base font-normal leading-relaxed">
          {values.youGet}
        </span>
      </div>
    </div>
  );
};
