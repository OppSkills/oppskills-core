"use client";

import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

export type RegistrationPickerTier = {
  id: string;
  name: string;
  description?: string | null;
  price?: unknown;
  isActive?: boolean;
  isFree?: boolean;
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
 * On-page ticket tier selector (event / hackathon detail page).
 * Displays each tier as a selectable card with large price, optional fee suffix,
 * a radio indicator, and description. Matches the event registration modal style.
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

  const showRegisteredChrome = isRegistered && !!registeredTierId;

  /** After registration, only show the tier the user registered with. */
  const tiersToShow = useMemo(() => {
    if (!isRegistered) return active;
    if (!registeredTierId) return [];
    const registered =
      active.find((t) => t.id === registeredTierId) ??
      ticketTiers.find((t) => t.id === registeredTierId);
    return registered ? [registered] : [];
  }, [active, isRegistered, registeredTierId, ticketTiers]);

  if (!isRegistered && active.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-purple-200 bg-white shadow-sm overflow-hidden",
        (disabled || isRegistered) && "pointer-events-none",
        disabled && !isRegistered && "opacity-60",
        className,
      )}
    >
      {/* Header */}
      <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-200">
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

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3">
        <p className="text-sm text-neutral-600 leading-snug">
          {isRegistered
            ? showRegisteredChrome
              ? "Your ticket:"
              : "You have successfully registered."
            : "Welcome! Please choose your desired ticket type:"}
        </p>

        {tiersToShow.length > 0 ? (
          <div className="flex flex-col gap-3">
            {tiersToShow.map((tier) => {
              const base = tierBasePrice(tier);
              const fee =
                feeBearer === "PARTICIPANT"
                  ? participantProcessingFee(base)
                  : 0;
              const isFree = tier.isFree === true || base <= 0;
              const selected = tier.id === selectedTierId;
              const isYourTicket =
                showRegisteredChrome && registeredTierId === tier.id;

              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectTier(tier.id)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-4 transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                    isYourTicket && "border-emerald-500 bg-emerald-50 shadow-sm",
                    !isYourTicket &&
                    selected &&
                    "border-purple-500 bg-purple-50/40 shadow-sm",
                    !isYourTicket &&
                    !selected &&
                    "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
                  )}
                >
                  {/* Top row: name + radio */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={cn(
                        "font-semibold text-base leading-tight",
                        isYourTicket
                          ? "text-emerald-900"
                          : selected
                            ? "text-purple-900"
                            : "text-neutral-800",
                      )}
                    >
                      {tier.name}
                    </span>

                    {/* Radio circle */}
                    <span
                      aria-hidden
                      className={cn(
                        "shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        isYourTicket
                          ? "border-emerald-500 bg-emerald-500"
                          : selected
                            ? "border-purple-600 bg-purple-600"
                            : "border-neutral-300 bg-white",
                      )}
                    >
                      {(isYourTicket || selected) && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                  </div>

                  {/* Price row */}
                  <div className="flex items-baseline gap-2 mb-2">
                    {isFree ? (
                      <span className="text-xl font-bold text-neutral-900">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-neutral-900">
                          ₹{" "}
                          {base.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        {fee > 0 && (
                          <span className="text-sm text-neutral-500 font-medium">
                            + ₹{fee.toFixed(2)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {tier.description ? (
                    <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed line-clamp-3">
                      {tier.description}
                    </p>
                  ) : null}

                  {/* "Your ticket" badge */}
                  {isYourTicket ? (
                    <span className="absolute top-3 right-10 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 shadow-sm">
                      Your ticket
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Fee breakdown note (PARTICIPANT bearer, only when paid tier selected) */}
        {feeBearer === "PARTICIPANT" &&
          !isRegistered &&
          (() => {
            const sel = tiersToShow.find((t) => t.id === selectedTierId);
            if (!sel) return null;
            const base = tierBasePrice(sel);
            const fee = participantProcessingFee(base);
            if (base <= 0 || fee <= 0) return null;
            return (
              <p className="text-[11px] text-neutral-400 text-center leading-snug px-1">
                Includes ₹{fee.toFixed(2)} transaction charge by payment
                partners
              </p>
            );
          })()}

        {footer ? (
          <div className="pt-4 mt-1 border-t border-purple-100">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
