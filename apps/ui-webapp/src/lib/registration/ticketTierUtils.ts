export type TicketTierLike = {
  id: string;
  isFree?: boolean;
  price?: unknown;
  isActive?: boolean;
};

export function tierBasePrice(tier: TicketTierLike): number {
  const p = tier.price;
  if (typeof p === "number" && !Number.isNaN(p)) return p;
  return Number(p ?? 0) || 0;
}

export function isFreeTicketTier(tier: TicketTierLike | null | undefined): boolean {
  if (!tier) return false;
  return tier.isFree === true || tierBasePrice(tier) <= 0;
}

export function findTicketTier(
  tiers: TicketTierLike[] | undefined | null,
  tierId: string | null | undefined,
): TicketTierLike | undefined {
  if (!tierId || !Array.isArray(tiers)) return undefined;
  return tiers.find((t) => t.id === tierId);
}

export function isFreeTicketTierId(
  tierId: string | null | undefined,
  tiers: TicketTierLike[] | undefined | null,
): boolean {
  return isFreeTicketTier(findTicketTier(tiers, tierId));
}
