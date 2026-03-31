"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle } from "lucide-react";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";

interface Ticket {
  id: string;
  name: string;
  price: number; // 0 for free
  description: string;
}

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface EventRegistrationCardProps {
  tickets: Ticket[];
  user?: User; // Optional - undefined when not logged in
  selectedTicketId?: string | null;
  onSelectTicket?: (ticketId: string | null) => void;
  onRegister?: () => Promise<void> | void;
  isRegistering?: boolean;
  isRegistered?: boolean; // If true, shows "Registered" state
  isPaidButIncomplete?: boolean; // If true, shows "Complete Registration" state
  registrationDeadline?: string | Date;
  feeBearer?: "ORGANISER" | "PARTICIPANT";
}

export function EventRegistrationCard({
  tickets,
  user,
  selectedTicketId: controlledSelectedTicketId,
  onSelectTicket,
  onRegister,
  isRegistering = false,
  isRegistered = false,
  isPaidButIncomplete = false,
  registrationDeadline,
  feeBearer = "ORGANISER",
}: EventRegistrationCardProps) {
  // Use controlled state if provided, otherwise fall back to internal state
  const [internalSelectedTicketId, setInternalSelectedTicketId] = useState<
    string | null
  >(tickets.length > 0 ? tickets[0].id : null);

  const selectedTicketId =
    controlledSelectedTicketId ?? internalSelectedTicketId;

  const handleTicketSelect = (ticketId: string) => {
    if (onSelectTicket) {
      onSelectTicket(ticketId);
    } else {
      setInternalSelectedTicketId(ticketId);
    }
  };

  const hasPaidTickets = tickets.some((t) => t.price > 0);

  // Check if deadline is exceeded
  const isDeadlineExceeded = React.useMemo(() => {
    if (!registrationDeadline) return false;
    const deadline = new Date(registrationDeadline);
    const now = new Date();
    return now > deadline;
  }, [registrationDeadline]);

  // If only free ticket(s) or no specific paid logic required for "Free State" view:
  // The design shows two distinct states.
  // State 1: "Registration" (Free/RSVP)
  // State 2: "Registration" (Ticket Selection)

  // We can infer state based on if there are multiple tickets or paid tickets.
  // For this implementation, if there is exactly one free ticket, we show the "One Click RSVP" style.
  // If there are paid tickets or multiple options, we show the ticket selection style.

  const isSimpleRSVP = tickets.length === 1 && tickets[0].price === 0;

  if (isRegistered) {
    return (
      <div className="w-full bg-background  rounded-[20px] border border-neutral-200  overflow-hidden shadow-sm font-sans">
        <div className="bg-[#F0FDF4]  px-6 py-4 border-b border-neutral-100 ">
          <h3 className="text-[#166534]  font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Registered
          </h3>
        </div>
        <div className="p-6">
          <p className="text-neutral-600  text-[15px]">
            You have successfully registered for this event. We look forward to
            seeing you!
          </p>
        </div>
      </div>
    );
  }

  // Show "Complete Registration" state for users who have paid but missing registration form
  if (isPaidButIncomplete) {
    return (
      <div className="w-full bg-background rounded-[20px] border border-neutral-200 overflow-hidden shadow-sm font-sans">
        <div className="bg-[#FEF3C7] px-6 py-4 border-b border-amber-200">
          <h3 className="text-[#92400E] font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Payment Complete
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-[15px] font-medium">
              Your payment was successful! Please complete the registration form
              to finish your registration.
            </p>
            <p className="text-amber-700 text-sm mt-2">
              No additional payment required.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
                {user.avatar && (
                  <Image
                    src={ensureAbsoluteUrl(user.avatar)}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="font-semibold text-neutral-900 text-base">
                  {user.name}
                </span>
                <span className="text-neutral-500 text-sm">{user.email}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full h-[52px] rounded-full bg-[#9C00E5] hover:bg-[#8500c4] text-background font-semibold text-[18px]"
            onClick={onRegister}
            disabled={isRegistering}
          >
            {isRegistering ? "Submitting..." : "Complete Registration Form"}
          </Button>
        </div>
      </div>
    );
  }

  if (isSimpleRSVP) {
    return (
      <div className="w-full bg-background rounded-lg overflow-hidden border-[0.5px] border-neutral-400 shadow-sm">
        <div className="bg-primary-100 px-3 py-2">
          <h3 className="text-neutral-700 text-lg">
            Registration
          </h3>
        </div>
        <div className="p-4 space-y-6">
          <p className="text-neutral-700 text-base">
            {user
              ? "Welcome! To join this event, please register below."
              : "Sign in to register for this event."}
          </p>

          {user && (
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
                {user.avatar && (
                  <Image
                    src={ensureAbsoluteUrl(user.avatar)}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="font-medium text-neutral-800  text-base">
                  {user.name}
                </span>
                <span className="text-neutral-700 text-base">{user.email}</span>
              </div>
            </div>
          )}

          <div>
            {
              isDeadlineExceeded ? <Button
                className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
                disabled
              >
                Registration Closed
              </Button> : <Button
                size={"lg"}
                className="w-full text-neutral-100 rounded-full text-base font-medium py-6"
                onClick={onRegister}
                disabled={isRegistering}
              >
                {isRegistering
                  ? "Registering..."
                  : user
                    ? "One Click RSVP"
                    : "Sign In to Register"}
              </Button>
            }
          </div>

        </div>
      </div>
    );
  }

  // Ticket Selection View
  return (
    <div className="w-full  rounded-lg border-[0.5px] border-neutral-400  overflow-hidden">
      <div className="bg-primary-100  px-3 py-2">
        <h3 className="text-neutral-700 text-base">Registration</h3>
      </div>
      <div className="p-4 space-y-6">
        <p className="text-neutral-700 text-base">
          Welcome! Please choose your desired ticket type:
        </p>

        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            const basePrice =
              typeof ticket.price === "number"
                ? ticket.price
                : Number(ticket.price ?? 0) || 0;
            const processingFee =
              basePrice > 0
                ? Math.ceil(basePrice * 0.0236 * 100) / 100
                : 0;
            const totalWithFee = basePrice + processingFee;

            return (
              <div
                key={ticket.id}
                onClick={isDeadlineExceeded ? undefined : () => handleTicketSelect(ticket.id)}
                className={cn(
                  "rounded-lg border p-4 transition-all duration-200 relative",
                  isDeadlineExceeded ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  isSelected
                    ? "border-primary-600 bg-primary-100  ring-1 ring-primary-600"
                    : "border-neutral-200 bg-transparent",
                  !isDeadlineExceeded && "hover:border-neutral-300"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-neutral-700 text-xl">
                      {ticket.name}
                    </h4>
                    {basePrice === 0 ? (
                      <div className="mt-1 font-semibold text-neutral-800 text-xl">
                        Free
                      </div>
                    ) : feeBearer === "PARTICIPANT" ? (
                      <div className="mt-1">
                        <div className="font-semibold text-neutral-800 text-xl">
                          ₹ {totalWithFee.toFixed(2)}
                        </div>
                        <div className="text-sm text-neutral-500 mt-0.5 space-y-0.5">
                          <span>₹ {basePrice.toFixed(2)} + ₹ {processingFee.toFixed(2)} Transaction Charges</span>
                          <p className="text-xs text-neutral-400">Charged by payment partners to process your transaction.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 font-semibold text-neutral-800 text-xl">
                        ₹ {basePrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#9C00E5] flex items-center justify-center">
                        <Check className="w-4 h-4 text-background" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-300 " />
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-507000 leading-relaxed  line-clamp-2">
                  {ticket.description}
                </p>
              </div>
            );
          })}
        </div>

        {user && (
          <div className="flex items-center gap-1 md:gap-2 lg:gap-3 pt-2">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
              {user.avatar && (
                <Image
                  src={ensureAbsoluteUrl(user.avatar)}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="font-semibold text-neutral-900  text-base">
                {user.name}
              </span>
              <span className="text-neutral-500 text-sm">{user.email}</span>
            </div>
          </div>
        )}

        <Button
          className="w-full text-neutral-100 rounded-full text-base font-medium py-6"
          onClick={onRegister}
          disabled={isRegistering || !selectedTicketId || isDeadlineExceeded}
        >
          {isDeadlineExceeded
            ? "Deadline Exceeded"
            : isRegistering
              ? "Registering..."
              : user
                ? "Click To Pay"
                : "Sign In to Register"}
        </Button>
      </div>
    </div>
  );
}
