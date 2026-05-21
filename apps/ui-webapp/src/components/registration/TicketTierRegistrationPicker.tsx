"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check, BadgeCheck } from "lucide-react";

export type RegistrationPickerTier = {
  id: string;
  name: string;
  description?: string | null;
  price?: unknown;
  isActive?: boolean;
};

function tierBasePrice(tier: RegistrationPickerTier): number {
  const p = tier.price;
  if (typeof p === "number" && !Number.isNaN(p)) return p;
  return Number(p ?? 0) || 0;
}

function participantProcessingFee(base: number): number {
  if (base <= 0) return 0;
  return Math.ceil(base * 0.0236 * 100) / 100;
}

function formatPriceLine(
  base: number,
  feeBearer: "ORGANISER" | "PARTICIPANT" | undefined,
): string {
  if (base <= 0) return "Free";
  const fee = feeBearer === "PARTICIPANT" ? participantProcessingFee(base) : 0;
  if (feeBearer === "PARTICIPANT" && fee > 0) {
    return `₹${base.toLocaleString("en-IN", { maximumFractionDigits: 2 })} + ₹${fee.toFixed(2)}`;
  }
  return `₹${base.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export interface TicketTierRegistrationPickerProps {
  ticketTiers: RegistrationPickerTier[];
  feeBearer?: "ORGANISER" | "PARTICIPANT";
  selectedTierId: string | null;
  onSelectTier: (id: string) => void;
  disabled?: boolean;
  className?: string;
  /** Rendered below tier options inside the same card (e.g. Register button) */
  footer?: ReactNode;
  /** When set, tier cards reflect completed registration (highlights this tier). */
  isRegistered?: boolean;
  /** Tier id from the user's successful registration / payment */
  registeredTierId?: string | null;
}

export function getActiveRegistrationTiers(
  tiers: RegistrationPickerTier[] | undefined | null,
): RegistrationPickerTier[] {
  if (!Array.isArray(tiers) || tiers.length === 0) return [];
  return tiers.filter((t) => t.isActive !== false);
}

/**
 * On-page ticket tier selector (event / hackathon detail) — matches dashboard-style registration card.
 */
export function TicketTierRegistrationPicker({
  ticketTiers,
  feeBearer = "ORGANISER",
  selectedTierId,
  onSelectTier,
  disabled = false,
  className,
  footer,
  isRegistered = false,
  registeredTierId = null,
}: TicketTierRegistrationPickerProps) {
  const active = getActiveRegistrationTiers(ticketTiers);
  if (active.length === 0) return null;

  const showRegisteredChrome = isRegistered && !!registeredTierId;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E9D5FF] bg-white shadow-sm overflow-hidden",
        (disabled || isRegistered) && "pointer-events-none",
        disabled && !isRegistered && "opacity-60",
        className,
      )}
    >
      <div className="bg-[#F3E8FF] px-4 py-2.5 border-b border-[#E9D5FF]">
        <p className="text-sm font-semibold text-neutral-700 tracking-wide">
          Registration
        </p>
        {isRegistered ? (
          <p className="text-xs font-medium text-emerald-800 mt-1 flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            You are registered
          </p>
        ) : null}
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-neutral-600 leading-snug">
          {isRegistered
            ? showRegisteredChrome
              ? "Your ticket:"
              : "You have successfully registered."
            : "Welcome! Please choose your desired ticket type:"}
        </p>
        <div className="flex flex-col gap-3">
          {active.map((tier) => {
            const base = tierBasePrice(tier);
            const selected = tier.id === selectedTierId;
            const isYourTicket =
              showRegisteredChrome && registeredTierId === tier.id;
            const priceText = formatPriceLine(base, feeBearer);

            return (
              <button
                key={tier.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectTier(tier.id)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-4 transition-all relative",
                  isYourTicket && "pr-14 sm:pr-20",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9333ea] focus-visible:ring-offset-2",
                  isYourTicket &&
                    "border-emerald-500 bg-emerald-50/90 shadow-[0_0_0_1px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/20",
                  !isYourTicket &&
                    selected &&
                    "border-[#9333ea] bg-[#FAF5FF] shadow-[0_0_0_1px_rgba(147,51,234,0.15)]",
                  !isYourTicket &&
                    !selected &&
                    "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80",
                )}
              >
                {isYourTicket ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 shadow-sm">
                    Your ticket
                  </span>
                ) : null}
                <div className="flex justify-between gap-3 items-start pr-1">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-neutral-900 text-base">
                      {tier.name}
                    </p>
                    <p className="text-sm font-medium text-neutral-800">
                      {priceText}
                    </p>
                    {tier.description ? (
                      <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed pt-1 line-clamp-4">
                        {tier.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                      isYourTicket
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : selected
                          ? "border-[#9333ea] bg-[#9333ea] text-white"
                          : "border-neutral-300 bg-white",
                    )}
                    aria-hidden
                  >
                    {isYourTicket || selected ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {footer ? (
          <div className="pt-4 mt-1 border-t border-[#E9D5FF]">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
