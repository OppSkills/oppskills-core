"use client";

import { format, isAfter } from "date-fns";
import { Loader2, CheckCircle } from "lucide-react";
import type { EventDetails } from "./types";

export interface EventRegisterCtaProps {
  event: EventDetails;
  onRegister?: () => void;
  isCheckingRegistration?: boolean;
  isRegistered?: boolean;
  needsCompleteRegistration?: boolean;
}

/**
 * Primary registration call-to-action for public event pages (sidebar or main column).
 */
export function EventRegisterCta({
  event,
  onRegister,
  isCheckingRegistration = false,
  isRegistered = false,
  needsCompleteRegistration = false,
}: EventRegisterCtaProps) {
  const deadline = event.registrationDeadline
    ? new Date(event.registrationDeadline)
    : null;
  const isDeadlinePassed = deadline ? isAfter(new Date(), deadline) : false;

  const tickets = event.tickets ?? [];
  const prices = tickets
    .map((t) => t.price)
    .filter((p) => typeof p === "number" && !Number.isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const hasMultiplePrices = prices.length > 1 && minPrice !== maxPrice;
  const eventFree = event.isFree === true;
  const effectiveFree =
    eventFree || (prices.length > 0 && minPrice === 0 && maxPrice === 0);

  const currency = event.currency || "INR";
  const formatMoney = (n: number) =>
    currency === "INR"
      ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
      : `${currency} ${n.toFixed(2)}`;

  let priceDisplay = "";
  if (!effectiveFree && prices.length > 0) {
    priceDisplay = hasMultiplePrices
      ? `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`
      : formatMoney(minPrice);
  }

  let buttonText = "Register Now";
  let isDisabled = false;
  let registerButtonClass = "bg-[#9333ea] hover:bg-[#7e22ce] text-white";

  if (isCheckingRegistration) {
    buttonText = "Checking…";
    isDisabled = true;
    registerButtonClass = "bg-[#9333ea] text-white";
  } else if (isRegistered) {
    buttonText = "Registered";
    isDisabled = true;
    registerButtonClass = "bg-green-600 text-white cursor-not-allowed";
  } else if (needsCompleteRegistration) {
    buttonText = "Complete registration";
    isDisabled = false;
    registerButtonClass = "bg-[#9333ea] hover:bg-[#7e22ce] text-white";
  } else if (isDeadlinePassed) {
    buttonText = "Registration closed";
    isDisabled = true;
    registerButtonClass = "bg-neutral-300 text-neutral-600 cursor-not-allowed";
  } else if (effectiveFree) {
    buttonText = "Register now";
  } else {
    if (priceDisplay) {
      buttonText =
        tickets.length > 1 ? "Click to pay" : "Click to pay";
    }

    return (
      <button
        type="button"
        onClick={onRegister}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-2 ${registerButtonClass} rounded-full h-[52px] font-semibold text-base shadow-sm transition-colors disabled:opacity-90`}
      >
        {isCheckingRegistration ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {buttonText}
          </>
        ) : isRegistered ? (
          <>
            <CheckCircle className="w-5 h-5 shrink-0" />
            {buttonText}
          </>
        ) : (
          buttonText
        )}
      </button>
    );
  }
}
