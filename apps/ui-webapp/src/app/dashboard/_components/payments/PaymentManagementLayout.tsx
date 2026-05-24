"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Plus, CheckCircle, Loader2 } from "lucide-react";
import { Container } from "../Container";
import AnalyticCard from "../AnalyticCard";
import PayoutDetailsForm from "@/components/ui/payment-side/PayoutDetailsForm";
import type { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import { Ticket, TrashBinTrash } from "@solar-icons/react";
import { format } from "date-fns";
import {
  useEventTicketTiers,
  useHackathonTicketTiers,
  useDeleteEventTicketTier,
  useDeleteHackathonTicketTier,
} from "@/hooks/usePayments";
import TicketTierDialog from "./TicketTierDialog";

export type FeeBearer = "ORGANISER" | "PARTICIPANT";
export type ChargeMode = "PER_TEAM" | "PER_USER";
export type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface SelectedCollege {
  id: string;
  name: string;
}

interface PaymentManagementLayoutProps {
  slug: string; // Event or hackathon slug
  opportunityType: "Event" | "Hackathon";
  isPaid: boolean;
  setIsPaid: (val: boolean) => void;
  chargeMode?: ChargeMode;
  setChargeMode?: (val: ChargeMode) => void;
  feeBearer: FeeBearer;
  setFeeBearer: (val: FeeBearer) => void;
  canEditPricing: boolean;
  /** Add/edit ticket tiers (allowed after registrations for legacy events migrating to tiers). */
  canManageTicketTiers: boolean;
  earnings: any;
  payoutDetails: any;
  payoutLoading: boolean;
  isPayoutFormOpen: boolean;
  setIsPayoutFormOpen: (open: boolean) => void;
  onPayoutDetailsSave: (data: PayoutDetailsInput) => Promise<void>;
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  upsertPayoutLoading: boolean;
}

export function PaymentManagementLayout({
  slug,
  opportunityType,
  isPaid,
  setIsPaid,
  chargeMode,
  setChargeMode,
  feeBearer,
  setFeeBearer,
  canEditPricing,
  canManageTicketTiers,
  earnings,
  payoutDetails,
  payoutLoading,
  isPayoutFormOpen,
  setIsPayoutFormOpen,
  onPayoutDetailsSave,
  autoSaveStatus,
  lastSavedAt,
  upsertPayoutLoading,
}: PaymentManagementLayoutProps) {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);

  const eventTiersQuery = useEventTicketTiers(
    opportunityType === "Event" ? slug : "",
  );
  const hackTiersQuery = useHackathonTicketTiers(
    opportunityType === "Hackathon" ? slug : "",
  );

  const ticketTiers =
    opportunityType === "Event" ? eventTiersQuery.data : hackTiersQuery.data;
  const isLoadingTiers =
    opportunityType === "Event"
      ? eventTiersQuery.isLoading
      : hackTiersQuery.isLoading;

  const deleteEventTier = useDeleteEventTicketTier(slug);
  const deleteHackTier = useDeleteHackathonTicketTier(slug);

  const handleOpenCreateTicket = () => {
    setEditingTicket(null);
    setIsTicketModalOpen(true);
  };

  const handleEditTicket = (tier: any) => {
    setEditingTicket(tier);
    setIsTicketModalOpen(true);
  };

  const handleDeleteTicket = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      if (opportunityType === "Event") {
        await deleteEventTier.mutateAsync(tierId);
      } else {
        await deleteHackTier.mutateAsync(tierId);
      }
    } catch (e) {
      console.error("Failed to delete tier", e);
      alert("Failed to delete ticket tier.");
    }
  };

  // Example fee breakdown uses the first paid tier (mixed free/paid events).
  let parsedEntryFee = 0;
  if (ticketTiers && ticketTiers.length > 0) {
    const firstPaidTier = ticketTiers.find(
      (t: { isFree?: boolean }) => !t.isFree,
    );
    if (firstPaidTier) {
      const tierPrice = parseFloat(String(firstPaidTier.price));
      if (!isNaN(tierPrice)) parsedEntryFee = tierPrice;
    }
  }

  let feePercentage = 0.02; // 2%
  let taxPercentage = 0.18; // 18% of 2%
  let serviceCharge = Number((parsedEntryFee * feePercentage).toFixed(2));
  let tax = Number((serviceCharge * taxPercentage).toFixed(2));
  let gatewayTotal = serviceCharge + tax;
  let userPaysIfParticipant = parsedEntryFee + gatewayTotal;
  let userPaysIfOrganiser = parsedEntryFee;
  let organiserGetsIfParticipant = parsedEntryFee;
  let organiserGetsIfOrganiser = parsedEntryFee - gatewayTotal;

  return (
    <div className="flex flex-col items-start gap-8 w-full">
      {/* Auto-save status indicator */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 py-2">
        <div className="text-sm font-bold poppins text-neutral-400 shrink-0">
          {autoSaveStatus === "saving" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />{" "}
              Saving...
            </span>
          ) : autoSaveStatus === "error" ? (
            <span className="text-red-500">Save failed</span>
          ) : (
            "Status"
          )}
        </div>
        <div className="hidden sm:block flex-1 h-px bg-neutral-200" />
        <div className="text-xs sm:text-sm font-medium poppins text-neutral-500 shrink-0">
          {lastSavedAt
            ? `Last saved: ${format(new Date(lastSavedAt), "do MMM, hh:mm a")}`
            : "Awaiting changes..."}
        </div>
      </div>

      {/* IS PAID SECTION */}

      <div className="flex flex-col sm:flex-row w-full gap-4 border shadow-sm p-4 sm:p-6 rounded-lg">
        <div className="flex-1 flex items-center">
          <p className="text-neutral-900 text-xl font-bold poppins">
            Is the {opportunityType} Paid?
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setIsPaid(true)}
            disabled={!canEditPricing}
            className={cn(
              "flex-1 sm:px-8 h-12 transition-all font-bold",
              isPaid
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
              !canEditPricing &&
                "opacity-60 cursor-not-allowed bg-neutral-200 hover:bg-neutral-200",
            )}
          >
            Yes
          </Button>
          <Button
            onClick={() => setIsPaid(false)}
            disabled={!canEditPricing}
            className={cn(
              "flex-1 sm:px-8 h-12 transition-all font-bold",
              !isPaid
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
              !canEditPricing &&
                "opacity-60 cursor-not-allowed bg-neutral-200 hover:bg-neutral-200",
            )}
          >
            No
          </Button>
        </div>
      </div>

      {isPaid && (
        <>
          <p className="text-base text-neutral-700">
            Participant prices are set per ticket type below. You can mix free
            and paid tickets on the same {opportunityType.toLowerCase()}.
            Configure who pays the service charge and your payout account here.
          </p>

          {/* Multiple tickets Section */}
          <Container
            heading="Ticket Type"
            description="You can create different types of tickets from here for participants"
            action={
              <button
                onClick={handleOpenCreateTicket}
                disabled={!canManageTicketTiers}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-200 text-neutral-400 transition-all active:scale-95",
                  canManageTicketTiers
                    ? "hover:border-primary-600 hover:text-primary-600"
                    : "opacity-60 cursor-not-allowed",
                )}
              >
                <Plus className="w-6 h-6" />
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              {isLoadingTiers ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : ticketTiers && ticketTiers.length > 0 ? (
                ticketTiers.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className={cn(
                      "flex w-full flex-col sm:flex-row justify-between border-[0.5px] p-4 rounded-xl",
                      ticket.isActive
                        ? "bg-primary-100 border-primary-500"
                        : "bg-neutral-50 border-neutral-300 opacity-70",
                    )}
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <p className="text-lg sm:text-xl font-bold text-neutral-900 poppins">
                        {ticket.name}
                        {!ticket.isActive && (
                          <span className="ml-2 text-xs font-semibold text-neutral-500 uppercase">
                            Inactive
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base">
                        <p className="text-neutral-700 font-medium">
                          {ticket.isFree ? (
                            "Free"
                          ) : (
                            <>
                              ₹ {ticket.price} per{" "}
                              {opportunityType === "Hackathon"
                                ? "team"
                                : "person"}
                            </>
                          )}
                        </p>
                        <span className="hidden sm:inline text-neutral-300">
                          |
                        </span>
                        <p className="text-neutral-500">
                          {ticket.capacity != null
                            ? `${ticket.ticketsSold ?? 0} / ${ticket.capacity} sold`
                            : `${ticket.ticketsSold ?? 0} sold (no cap)`}
                        </p>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-primary-200/50">
                      <button
                        onClick={() => handleEditTicket(ticket)}
                        disabled={!canManageTicketTiers}
                        className={cn(
                          "text-sm font-bold flex items-center gap-2 transition-colors",
                          canManageTicketTiers
                            ? "text-primary-700 hover:text-primary-800"
                            : "text-neutral-400 cursor-not-allowed",
                        )}
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        disabled={!canManageTicketTiers}
                        className={cn(
                          "text-sm font-bold flex items-center gap-2 transition-colors",
                          canManageTicketTiers
                            ? "text-red-600 hover:text-red-700"
                            : "text-neutral-400 cursor-not-allowed",
                        )}
                      >
                        <TrashBinTrash className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex w-full flex-col sm:flex-row gap-2 bg-primary-100 border-[0.5px] border-primary-500 p-4 rounded-xl">
                  <Ticket className="w-6 h-6" />
                  <p className="text-base text-neutral-700">
                    Don’t have any ticket generated as of now.
                    {canManageTicketTiers && (
                      <a
                        className="text-primary-600 hover:underline cursor-pointer ml-1"
                        onClick={handleOpenCreateTicket}
                      >
                        Click here to generate one
                      </a>
                    )}
                  </p>
                </div>
              )}
            </div>

            <TicketTierDialog
              isOpen={isTicketModalOpen}
              onClose={() => setIsTicketModalOpen(false)}
              opportunityType={opportunityType}
              slug={slug}
              editingTier={editingTicket}
            />
          </Container>

          {/* PAID CONFIGURATION */}
          <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-top-4 duration-500">
            {/* EARNINGS OVERVIEW */}
            {earnings && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 lg:gap-4 w-full">
                <AnalyticCard
                  title="Collected"
                  value={`₹${parseFloat(String(earnings.totalGross)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  badge="Registrations"
                  badgeValue={`${earnings.capturedPaymentsCount || 0} successful`}
                  type="highlight"
                />

                <AnalyticCard
                  title="Pending Payout"
                  value={`₹${parseFloat(String(earnings.pendingPayout)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  badge={
                    !earnings.isEligibleNow && earnings.eligibleAt
                      ? "Payout Date"
                      : "Status"
                  }
                  badgeValue={
                    !earnings.isEligibleNow && earnings.eligibleAt
                      ? format(new Date(earnings.eligibleAt), "MMM d, yyyy")
                      : "Available"
                  }
                  type="normal"
                />

                <AnalyticCard
                  title="Paid Out"
                  value={`₹${parseFloat(String(earnings.paidOut)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  badge="Status"
                  badgeValue="Settled"
                  type="normal"
                />
              </div>
            )}

            {/* CHARGE MODE (HACKATHON ONLY) */}
            {opportunityType === "Hackathon" && setChargeMode && (
              <Container
                heading="Charge Mode"
                description="Define if the entry fee applies to the entire team or each individual user."
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setChargeMode("PER_TEAM")}
                    className={cn(
                      "flex-1 max-w-[180px] py-3 rounded-xl font-bold text-base transition-all",
                      chargeMode === "PER_TEAM"
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                        : "bg-neutral-50 border-2 border-neutral-100 text-neutral-500 hover:border-primary-200",
                    )}
                  >
                    Per Team
                  </button>
                  <button
                    onClick={() => setChargeMode("PER_USER")}
                    className={cn(
                      "flex-1 max-w-[180px] py-3 rounded-xl font-bold text-base transition-all",
                      chargeMode === "PER_USER"
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                        : "bg-neutral-50 border-2 border-neutral-100 text-neutral-500 hover:border-primary-200",
                    )}
                  >
                    Per User
                  </button>
                </div>
              </Container>
            )}

            {/* SERVICE CHARGE SECTION */}
            <Container
              heading="Service Charge"
              description="Select who pays service charge user or organizer"
              action={
                <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-200 text-neutral-400 hover:border-primary-600 hover:text-primary-600 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {/* Participant Card */}
                <div
                  onClick={() => setFeeBearer("PARTICIPANT")}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-6",
                    feeBearer === "PARTICIPANT"
                      ? "bg-primary-50 border-primary-500 shadow-md shadow-primary-900/5"
                      : "bg-white border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-neutral-900 poppins">
                      Participant
                    </h3>
                    {feeBearer === "PARTICIPANT" ? (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-200" />
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 text-sm inter">
                        Example
                      </span>
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">
                          Registration Amount:
                        </span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {parsedEntryFee}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">
                          Service Charge:
                        </span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {serviceCharge}({feePercentage * 100}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">Tax:</span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {tax}({taxPercentage * 100}% GST of{" "}
                          {feePercentage * 100}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-neutral-500 font-bold inter">
                          User Pay:
                        </span>
                        <span className="text-neutral-900 font-bold poppins">
                          ₹ {userPaysIfParticipant}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-neutral-200 my-1" />

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 font-medium inter">
                        You get
                      </span>
                      <span className="text-neutral-900 font-bold poppins text-lg">
                        ₹ {organiserGetsIfParticipant}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organizer Card */}
                <div
                  onClick={() => setFeeBearer("ORGANISER")}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-6",
                    feeBearer === "ORGANISER"
                      ? "bg-primary-50 border-primary-500 shadow-md shadow-primary-900/5"
                      : "bg-white border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-neutral-900 poppins">
                      Organizer
                    </h3>
                    {feeBearer === "ORGANISER" ? (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-200" />
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 text-sm inter">
                        Example
                      </span>
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">
                          Registration Amount:
                        </span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {parsedEntryFee}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">
                          Service Charge:
                        </span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {serviceCharge}({feePercentage * 100}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 inter">Tax:</span>
                        <span className="text-neutral-900 font-medium poppins">
                          ₹ {tax}({taxPercentage * 100}% GST of{" "}
                          {feePercentage * 100}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-neutral-500 font-bold inter">
                          User Pay:
                        </span>
                        <span className="text-neutral-900 font-bold poppins">
                          ₹ {userPaysIfOrganiser}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-neutral-200 my-1" />

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 font-medium inter">
                        You get
                      </span>
                      <span className="text-neutral-900 font-bold poppins text-lg">
                        ₹ {organiserGetsIfOrganiser}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Container>

            {/* PAYOUT ACCOUNT DETAILS */}
            <Container
              heading="Payout Account Details"
              description="Details of the account in which all the amount will be given out"
              action={
                <button
                  onClick={() => setIsPayoutFormOpen(true)}
                  className="hover:text-primary-600 transition-colors"
                >
                  <Pencil className="w-6 h-6" />
                </button>
              }
            >
              <div className="flex flex-col py-2">
                {[
                  {
                    label: "Account Holder Name",
                    value: payoutDetails?.accountHolderName,
                  },
                  {
                    label: "Phone Number",
                    value: (() => {
                      const ph =
                        payoutDetails?.phoneNumber || payoutDetails?.phone;
                      if (!ph) return undefined;
                      const cleaned = String(ph).trim();
                      if (cleaned.startsWith("+91")) return cleaned;
                      if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
                        return `+91${cleaned}`;
                      }
                      return cleaned;
                    })(),
                  },
                  { label: "Email", value: payoutDetails?.email },
                  { label: "Bank Name", value: payoutDetails?.bankName },
                  {
                    label: "Bank Account Number",
                    value:
                      payoutDetails?.accountNumber ||
                      (payoutDetails?.accountNumberLast4
                        ? `•••• •••• ${payoutDetails.accountNumberLast4}`
                        : undefined),
                  },
                  { label: "IFSC Code", value: payoutDetails?.ifsc },
                  { label: "Pan Number", value: payoutDetails?.panNumber },
                  { label: "GST Tin Number", value: payoutDetails?.gstNumber },
                  { label: "Address 1", value: payoutDetails?.address1 },
                  { label: "Address 2", value: payoutDetails?.address2 },
                  { label: "State", value: payoutDetails?.state },
                  { label: "City", value: payoutDetails?.city },
                  { label: "Pincode", value: payoutDetails?.pinCode },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 items-center gap-4 py-3 border-b border-neutral-100 last:border-0"
                  >
                    <span className="col-span-5 sm:col-span-4 text-neutral-600 font-medium inter text-sm">
                      {item.label}
                    </span>
                    <span className="col-span-7 sm:col-span-8 text-neutral-700 font-normal inter text-sm">
                      {item.value && String(item.value).trim().length > 0
                        ? item.value
                        : "--"}
                    </span>
                  </div>
                ))}
              </div>

              <PayoutDetailsForm
                isOpen={isPayoutFormOpen}
                onClose={() => setIsPayoutFormOpen(false)}
                initialData={payoutDetails}
                onSave={onPayoutDetailsSave}
                isLoading={upsertPayoutLoading}
              />
            </Container>
          </div>
        </>
      )}
    </div>
  );
}
