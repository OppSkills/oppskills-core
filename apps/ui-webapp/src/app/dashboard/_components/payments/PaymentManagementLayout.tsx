"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Ticket as TicketIcon,
  Plus,
  Pencil,
  CheckCircle,
  AlertCircle,
  Loader2,
  Banknote,
  IndianRupee,
} from "lucide-react";
import { Container } from "../Container";
import PayoutDetailsForm from "@/components/ui/payment-side/PayoutDetailsForm";
import type { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import { Ticket, TrashBinTrash } from "@solar-icons/react";
import { format } from "date-fns";

export type FeeBearer = "ORGANISER" | "PARTICIPANT";
export type ChargeMode = "PER_TEAM" | "PER_USER";
export type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface SelectedCollege {
  id: string;
  name: string;
}

interface PaymentManagementLayoutProps {
  opportunityType: "Event" | "Hackathon";
  isPaid: boolean;
  setIsPaid: (val: boolean) => void;
  chargeMode?: ChargeMode;
  setChargeMode?: (val: ChargeMode) => void;
  feeBearer: FeeBearer;
  setFeeBearer: (val: FeeBearer) => void;
  entryFeeAmount?: string;
  setEntryFeeAmount?: (val: string) => void;
  canEditPricing: boolean;
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
  opportunityType,
  isPaid,
  setIsPaid,
  chargeMode,
  setChargeMode,
  feeBearer,
  setFeeBearer,
  canEditPricing,
  earnings,
  payoutDetails,
  payoutLoading,
  isPayoutFormOpen,
  setIsPayoutFormOpen,
  onPayoutDetailsSave,
  autoSaveStatus,
  lastSavedAt,
  upsertPayoutLoading,
  entryFeeAmount,
  setEntryFeeAmount,
}: PaymentManagementLayoutProps) {
  const [tickets, setTickets] = useState([
    { id: "1", name: "General", price: entryFeeAmount || "0", limit: "10000" }
  ]);

  // Sync entryFeeAmount if it changes from parent (e.g. hydration)
  useEffect(() => {
    if (entryFeeAmount !== undefined) {
      setTickets(prev => prev.map(t => t.id === "1" ? { ...t, price: entryFeeAmount } : t));
    }
  }, [entryFeeAmount]);

  const updateTicket = (id: string, field: string, value: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    if (id === "1" && field === "price" && setEntryFeeAmount) {
      setEntryFeeAmount(value);
    }
  };

  const addTicket = () => {
    const newTicket = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Ticket",
      price: "0",
      limit: "100"
    };
    setTickets([...tickets, newTicket]);
  };

  const deleteTicket = (id: string) => {
    setTickets(tickets.filter(t => t.id !== id));
  };



  return (
    <div className="flex flex-col items-start gap-8 w-full">
      {/* Auto-save status indicator */}
      <div className="w-full flex items-center gap-4 py-2">
        <div className="text-sm font-bold poppins text-neutral-400 shrink-0">
          {autoSaveStatus === "saving" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> Saving...
            </span>
          ) : autoSaveStatus === "error" ? (
            <span className="text-red-500">Save failed</span>
          ) : (
            "Last Saved"
          )}
        </div>
        <div className="flex-1 h-px bg-neutral-200" />
        <div className="text-sm font-medium poppins text-neutral-500 shrink-0">
          {lastSavedAt
            ? format(new Date(lastSavedAt), "do MMMM yyyy, hh:mm a")
            : "Awaiting changes..."}
        </div>
      </div>

      {/* IS PAID SECTION */}

      <div className="flex flex-col sm:flex-row w-full gap-4 border shadow-sm p-4 sm:p-6 rounded-lg">
        <div className="flex-1 flex items-center">
          <p className="text-neutral-900 text-xl font-bold poppins">Is the {opportunityType} Paid?</p>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <Button
            onClick={() => setIsPaid(true)}
            className={cn(
              "px-8 transition-all",
              isPaid ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            )}
          >Yes</Button>
          <Button
            onClick={() => setIsPaid(false)}
            className={cn(
              "px-8 transition-all",
              !isPaid ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            )}
          >No</Button>
        </div>
      </div>

      {isPaid && (
        <div className="w-full flex flex-col gap-2 p-4 sm:p-6 border border-primary-100 bg-primary-50/30 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="text-neutral-900 text-lg font-bold poppins flex items-center gap-2">
            Base Entry Fee (INR)
            <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Required</span>
          </label>
          <div className="relative max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-lg">₹</span>
            <input
              type="number"
              value={entryFeeAmount || ""}
              onChange={(e) => setEntryFeeAmount && setEntryFeeAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all text-xl font-bold text-neutral-900 poppins"
              placeholder="0.00"
            />
          </div>
          <p className="text-sm text-neutral-500">This is the base price participants will see before any service charges or taxes.</p>
        </div>
      )}

      <p className="text-base text-neutral-700">Set up opportunity fees for participants (if applicable). Add payment methods, types of ticket, payout methods from here.</p>

      {/* Multiple tickets Section */}
      <Container
        heading="Ticket Type"
        description="You can create different types of tickets from here for participants"
        action={
          <button
            onClick={addTicket}
            disabled={!canEditPricing}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-200 text-neutral-400 hover:border-primary-600 hover:text-primary-600 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          {tickets.length > 0 && (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex w-full flex-col sm:flex-row justify-between bg-primary-100 border-[0.5px] border-primary-500 p-4 rounded-xl"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-xl text-neutral-900">{ticket.name}</p>
                  <div className="flex items-center gap-4">
                    <p className="text-base text-neutral-700">₹ {ticket.price} per team</p> |
                    <p className="text-base text-neutral-700">Limit: {ticket.limit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-primary-700 text-xs flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </p>
                  <p className="text-primary-700 text-xs flex items-center gap-2">
                    <TrashBinTrash className="w-4 h-4" /> Delete
                  </p>
                </div>
              </div>
            ))
          )}
          <div className="flex w-full flex-col sm:flex-row gap-2 bg-primary-100 border-[0.5px] border-primary-500 p-4 rounded-xl">
            <Ticket className="w-6 h-6" /> <p className="text-base text-neutral-700">Don’t have any ticket generated as of now. <a className="text-primary-600 hover:underline" onClick={addTicket}>Click here to generate one</a></p>
          </div>
        </div>
      </Container>

      {/* PAID CONFIGURATION */}
      {isPaid && (
        <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <PayoutDetailsForm
            onSave={onPayoutDetailsSave}
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
            isLoading={upsertPayoutLoading}
          />

          {/* EARNINGS OVERVIEW */}
          {earnings && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="bg-primary-50 border border-primary-100 p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary-700 font-bold poppins text-sm uppercase tracking-wider">
                  <Banknote className="w-4 h-4" /> Collected
                </div>
                <div className="text-3xl font-black text-primary-900 poppins">
                  ₹{parseFloat(String(earnings.totalGross)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-primary-600 font-medium">
                  From {earnings.capturedPaymentsCount} successful registration{earnings.capturedPaymentsCount !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-100 p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-neutral-600 font-bold poppins text-sm uppercase tracking-wider">
                  <IndianRupee className="w-4 h-4" /> Pending Payout
                </div>
                <div className="text-3xl font-black text-neutral-900 poppins">
                  ₹{parseFloat(String(earnings.pendingPayout)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                {!earnings.isEligibleNow && earnings.eligibleAt && (
                  <div className="text-xs text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-full w-fit">
                    Release on {format(new Date(earnings.eligibleAt), "MMM d, yyyy")}
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold poppins text-sm uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Paid Out
                </div>
                <div className="text-3xl font-black text-emerald-900 poppins">
                  ₹{parseFloat(String(earnings.paidOut)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
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
                      : "bg-neutral-50 border-2 border-neutral-100 text-neutral-500 hover:border-primary-200"
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
                      : "bg-neutral-50 border-2 border-neutral-100 text-neutral-500 hover:border-primary-200"
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
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                )}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-neutral-900 poppins">Participant</h3>
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
                    <span className="text-neutral-500 text-sm inter">Example</span>
                    <div className="flex-1 h-[1px] bg-neutral-200" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Registration Amount:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Service Charge:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 2(2%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Tax:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 0.36(18% GST of 2%)</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-neutral-500 font-bold inter">User Pay:</span>
                      <span className="text-neutral-900 font-bold poppins">₹ 102.36</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-neutral-200 my-1" />

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium inter">You get</span>
                    <span className="text-neutral-900 font-bold poppins text-lg">₹ 100</span>
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
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                )}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-neutral-900 poppins">Organizer</h3>
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
                    <span className="text-neutral-500 text-sm inter">Example</span>
                    <div className="flex-1 h-[1px] bg-neutral-200" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Registration Amount:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Service Charge:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 2(2%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 inter">Tax:</span>
                      <span className="text-neutral-900 font-medium poppins">₹ 0.36(18% GST of 2%)</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-neutral-500 font-bold inter">User Pay:</span>
                      <span className="text-neutral-900 font-bold poppins">₹ 100</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-neutral-200 my-1" />

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium inter">You get</span>
                    <span className="text-neutral-900 font-bold poppins text-lg">₹ 97.64</span>
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
              <button onClick={() => setIsPayoutFormOpen(true)} className="hover:text-primary-600 transition-colors">
                <Pencil className="w-6 h-6" />
              </button>
            }
          >
            <div className="flex flex-col gap-4 py-2">
              {[
                { label: "Account Holder Name", value: payoutDetails?.accountHolderName },
                { label: "Phone Number", value: "--" },
                { label: "Email", value: "--" },
                { label: "Bank Name", value: "--" },
                { label: "Bank Account Number", value: payoutDetails?.accountNumberLast4 ? `•••• •••• ${payoutDetails.accountNumberLast4}` : undefined },
                { label: "IFSC Code", value: payoutDetails?.ifsc },
                { label: "Pan Number", value: "--" },
                { label: "GST Tin Number", value: "--" },
                { label: "Address 1", value: "--" },
                { label: "Address 2", value: "--" },
                { label: "State", value: "--" },
                { label: "City", value: "--" },
                { label: "Pincode", value: "--" },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <span className="text-sm text-neutral-500 inter">{item.label}</span>
                  <span className="text-sm text-neutral-900 font-medium poppins">{item.value || "--"}</span>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
