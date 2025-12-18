"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  CheckCircle,
  Circle,
} from "lucide-react";
import PaymentFormModal from "@/components/ui/payment-side/PaymentFormModal";
import CreateTicketModal from "@/components/ui/payment-side/create-ticket-modal";

export default function TicketsPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState<boolean>(true); // Defaulting to true based on typical event needs, or false to match mockup
  const [serviceChargePayer, setServiceChargePayer] = useState<
    "player" | "organizer"
  >("player");

  const payoutFields = [
    "Account Holder Name",
    "Phone Number",
    "Email",
    "Bank Name",
    "Bank Account Number",
    "IFSC Code",
    "Pan Number",
    "GST Tin Number",
    "Address 1",
    "Address 2",
    "State",
    "City",
    "Pin Code",
  ];

  return (
    <div className="flex flex-col items-start gap-5 p-10 w-full flex-1 self-stretch min-h-[600px] rounded-[20px] bg-background border border-transparent shadow-sm">
      {/* DESCRIPTION */}
      <p className="font-sans text-muted-foreground text-sm font-normal">
        Set up event fees for participants (if applicable). Add payment methods,
        types of ticket, payout methods from here.
      </p>

      {/* --- SECTION 1: IS EVENT PAID --- */}
      <div className="flex flex-col items-start gap-4 p-6 self-stretch rounded-2xl border border-border bg-transparent">
        <div className="flex flex-col items-start gap-3">
          <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
            Is The Event Paid
          </h6>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsPaid(true)}
            variant="ghost"
            className={cn(
              "flex min-w-[100px] px-4 py-2 justify-center items-center gap-2.5 rounded-full flex-1 h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
              isPaid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80"
            )}
          >
            Yes
          </Button>

          <Button
            onClick={() => setIsPaid(false)}
            variant="ghost"
            className={cn(
              "flex min-w-[100px] px-4 py-2 justify-center items-center gap-2.5 rounded-full flex-1 h-auto font-sans text-base font-normal leading-relaxed transition-all duration-200",
              !isPaid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-input border border-dashed border-primary/30 text-foreground hover:bg-input/80"
            )}
          >
            No
          </Button>
        </div>
      </div>

      {/* --- CONDITIONAL SECTIONS --- */}
      {isPaid && (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Modals */}
          <CreateTicketModal
            isOpen={isCreateTicketModalOpen}
            onClose={() => setIsCreateTicketModalOpen(false)}
          />
          <PaymentFormModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
          />

          {/* --- SECTION 2: TICKET TYPE --- */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            {/* Header */}
            <div className="flex justify-between items-center self-stretch">
              <div className="flex flex-col items-start gap-3">
                <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                  Ticket Type
                </h6>
                <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                  You can create different types of tickets from here for
                  participants
                </p>
              </div>
              <div
                className="flex w-12 h-12 justify-center items-center rounded-full border border-border cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setIsCreateTicketModalOpen(true)}
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Ticket Card */}
            <div className="flex p-3 justify-between items-center self-stretch rounded-xl border border-primary/50 bg-input">
              <div className="flex w-full max-w-[607px] items-center gap-4">
                <div className="flex flex-col justify-center items-start gap-1">
                  <span className="font-sans text-foreground text-xl font-medium leading-relaxed">
                    Ticket name
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                      ₹ 4,000 per team
                    </span>
                    <div className="w-[1px] h-6 bg-muted-foreground/50"></div>
                    <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                      Limit: 10,000
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button className="flex px-4 py-2 justify-center items-center gap-3 rounded-[37px] hover:bg-primary/10 transition-colors group">
                  <Pencil className="w-[18px] h-[18px] text-primary" />
                  <span className="font-sans text-primary text-xs font-medium leading-relaxed">
                    Edit
                  </span>
                </button>
                <button className="flex px-4 py-2 justify-center items-center gap-3 rounded-[37px] hover:bg-primary/10 transition-colors group">
                  <Trash2 className="w-[18px] h-[18px] text-primary" />
                  <span className="font-sans text-primary text-xs font-medium leading-relaxed">
                    Delete
                  </span>
                </button>
              </div>
            </div>

            {/* Create New Prompt */}
            <div className="flex p-3 items-center gap-2.5 self-stretch rounded-xl border border-primary/50 bg-input">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-6 h-6 text-foreground" />
                <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                  Don&apos;t have any ticket generated as of now.
                </span>
              </div>
              <span
                className="font-sans text-primary text-base font-normal leading-relaxed underline decoration-solid cursor-pointer decoration-auto underline-offset-auto"
                onClick={() => setIsCreateTicketModalOpen(true)}
              >
                Click here to generate one
              </span>
            </div>
          </div>

          {/* --- SECTION 3: SERVICE CHARGE --- */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            {/* Header */}
            <div className="flex justify-between items-center self-stretch">
              <div className="flex flex-col items-start gap-3">
                <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                  Service Charge
                </h6>
                <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                  Select who pays service charge user or organizer
                </p>
              </div>
            </div>

            {/* Selection Cards */}
            <div className="flex items-start gap-[15px] w-full flex-wrap">
              <CalculationCard
                title="Participant"
                isSelected={serviceChargePayer === "player"}
                onClick={() => setServiceChargePayer("player")}
                values={{
                  reg: "₹ 100",
                  service: "₹ 2(2%)",
                  tax: "₹ 0.36(18% GST of 2%)",
                  userPay: "₹ 102.36",
                  youGet: "₹ 100",
                }}
              />

              <CalculationCard
                title="Organizer"
                isSelected={serviceChargePayer === "organizer"}
                onClick={() => setServiceChargePayer("organizer")}
                values={{
                  reg: "₹ 100",
                  service: "₹ 2(2%)",
                  tax: "₹ 0.36(18% GST of 2%)",
                  userPay: "₹ 100",
                  youGet: "₹ 97.64",
                }}
              />
            </div>
          </div>

          {/* --- SECTION 4: PAYOUT ACCOUNT DETAILS --- */}
          <div className="flex flex-col items-start gap-[15px] p-6 self-stretch rounded-2xl border border-border bg-transparent">
            {/* Header */}
            <div className="flex justify-between items-center self-stretch">
              <div className="flex flex-col items-start gap-3">
                <h6 className="font-poppins text-foreground text-xl font-semibold leading-tight capitalize">
                  Payout Account Details
                </h6>
                <p className="font-sans text-muted-foreground text-base font-normal leading-normal">
                  Details of the account in which all the amount will be given
                  out
                </p>
              </div>

              <button
                className="flex w-9 h-9 justify-center items-center rounded-full hover:bg-muted transition-colors"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <Pencil
                  className="w-5 h-5 text-muted-foreground"
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-2.5 self-stretch">
              {payoutFields.map((field, index) => (
                <React.Fragment key={index}>
                  <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                    {field}
                  </div>
                  <div className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
                    --
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENT: CALCULATION CARD ---
interface CalculationCardProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
  values: {
    reg: string;
    service: string;
    tax: string;
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
        "flex w-full max-w-[362px] p-5 flex-col items-start gap-3 rounded-2xl border bg-background cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary shadow-[0_0_12px_0_rgba(149,0,213,0.3)]" // Active State
          : "border-primary/20" // Inactive State (approx #EACCF7)
      )}
    >
      {/* Card Header */}
      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-foreground text-xl font-medium leading-relaxed">
          {title}
        </span>
        {/* Check Icon */}
        {isSelected ? (
          <CheckCircle className="w-6 h-6 text-primary fill-primary text-white" />
        ) : (
          <Circle className="w-6 h-6 text-primary/30" />
        )}
      </div>

      {/* Example Label */}
      <div className="flex items-center gap-2 self-stretch">
        <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
          Example
        </span>
        <div className="h-[1px] flex-1 bg-muted-foreground/50"></div>
      </div>

      {/* Calculation Rows */}
      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            Registration Amount:
          </span>
          <span className="font-sans text-primary text-base font-normal leading-relaxed">
            {values.reg}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            Service Charge:
          </span>
          <span className="font-sans text-primary text-base font-normal leading-relaxed">
            {values.service}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            Tax:
          </span>
          <span className="font-sans text-primary text-base font-normal leading-relaxed">
            {values.tax}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
            User Pay:
          </span>
          <span className="font-sans text-primary text-base font-normal leading-relaxed">
            {values.userPay}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-muted-foreground/50"></div>

      {/* You Get */}
      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-muted-foreground text-base font-normal leading-relaxed">
          You get
        </span>
        <span className="font-sans text-primary text-base font-normal leading-relaxed">
          {values.youGet}
        </span>
      </div>
    </div>
  );
};
