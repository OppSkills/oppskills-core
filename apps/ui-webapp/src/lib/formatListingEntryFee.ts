export type ListingEntryFeeInput = {
  isFree?: boolean | null;
  currency?: string | null;
  entryFeeAmount?: number | string | null;
  lowestTicketPrice?: number | null;
  highestTicketPrice?: number | null;
};

function currencyPrefix(currency: string | null | undefined): string {
  const c = (currency || "INR").toUpperCase();
  return c === "INR" ? "₹" : `${c} `;
}

/**
 * Human-readable entry fee for listing cards (events + hackathons).
 * Prefers active ticket tier min/max when the API provides them; otherwise base entry fee.
 */
export function formatListingEntryFee(opts: ListingEntryFeeInput): string {
  if (opts.isFree) return "Free";

  const sym = currencyPrefix(opts.currency);
  const low =
    opts.lowestTicketPrice != null &&
    Number.isFinite(Number(opts.lowestTicketPrice))
      ? Number(opts.lowestTicketPrice)
      : null;
  const high =
    opts.highestTicketPrice != null &&
    Number.isFinite(Number(opts.highestTicketPrice))
      ? Number(opts.highestTicketPrice)
      : null;

  if (low != null && high != null) {
    if (high > low) {
      return `${sym}${low.toLocaleString("en-IN")} – ${sym}${high.toLocaleString("en-IN")}`;
    }
    return `${sym}${low.toLocaleString("en-IN")}`;
  }

  const base = Number(opts.entryFeeAmount ?? 0);
  if (base > 0) {
    return `${sym}${base.toLocaleString("en-IN")}`;
  }

  return "Paid";
}
