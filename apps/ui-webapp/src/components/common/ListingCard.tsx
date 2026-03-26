import React from "react";
import { OpportunityCard } from "./OpportunityCard";

export interface ListingItem {
  id: string;
  title: string;
  slug: string;
  bannerUrl?: string; // Standardized field name
  startDate?: string;
  endDate?: string;
  status?: string;

  // Display fields
  mode?: string; // Online, Offline, Hybrid
  locationType?: string | null; // Raw backend value to derive mode
  location?: string;

  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;

  registrationDeadline?: string | null;
  registrationCount?: number;
  opportunityCount?: number;

  eventType?: string; // "Hackathon", "Event", "Workshop", "Festival"

  tags?: string[];

  // Route prefix for linking (e.g. "competitions" or "events")
  routePrefix: string;
}

export interface ListingCardProps {
  item: ListingItem;
  layout?: "grid" | "list";
}

function formatMode(
  mode: string | undefined,
  locationType: string | null | undefined
): string {
  if (mode) return mode;
  if (!locationType) return "Online";
  switch (locationType.toUpperCase()) {
    case "VIRTUAL":
    case "ONLINE":
      return "Online";
    case "OFFLINE":
    case "IN_PERSON":
    case "PHYSICAL":
      return "Offline";
    case "HYBRID":
      return "Hybrid";
    default:
      return "Online";
  }
}

function formatEntryFee(item: ListingItem): string {
  if (item.isFree) return "Free";
  if (item.entryFeeAmount) {
    return `${item.currency === "INR" || !item.currency ? "₹" : item.currency} ${item.entryFeeAmount.toLocaleString()}`;
  }
  return "Free";
}

export function ListingCard({ item, layout = "grid" }: ListingCardProps) {
  const mode = formatMode(item.mode, item.locationType);
  const entryFee = formatEntryFee(item);

  return (
    <OpportunityCard
      href={`/${item.routePrefix}/${item.slug}`}
      imageSrc={item.bannerUrl}
      title={item.title}
      organizationName={item.location}
      isFree={item.isFree}
      mode={mode}
      registrationDeadline={item.registrationDeadline}
      registrationCount={item.registrationCount}
      opportunityCount={item.opportunityCount}
      startDate={item.startDate}
      entryFee={entryFee}
      eventType={item.eventType}
      layout={layout}
    />
  );
}
