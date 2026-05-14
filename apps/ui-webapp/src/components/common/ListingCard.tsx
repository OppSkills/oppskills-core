import React from "react";
import { OpportunityCard } from "./OpportunityCard";
import { formatListingEntryFee } from "@/lib/formatListingEntryFee";

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
  lowestTicketPrice?: number | null;
  highestTicketPrice?: number | null;

  registrationDeadline?: string | null;
  registrationCount?: number;
  opportunityCount?: number;

  eventType?: string; // "Hackathon", "Event", "Workshop", "Festival"
  attendeeEligibility?: string[];

  tags?: string[];

  // Route prefix for linking (e.g. "competitions" or "events")
  routePrefix: string;
}

export interface ListingCardProps {
  item: ListingItem;
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
  return formatListingEntryFee({
    isFree: item.isFree,
    currency: item.currency,
    entryFeeAmount: item.entryFeeAmount,
    lowestTicketPrice: item.lowestTicketPrice,
    highestTicketPrice: item.highestTicketPrice,
  });
}

export function ListingCard({ item }: ListingCardProps) {
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
    />
  );
}
