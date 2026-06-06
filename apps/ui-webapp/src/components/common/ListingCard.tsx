"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { OpportunityCard } from "./OpportunityCard";
import { formatListingEntryFee } from "@/lib/formatListingEntryFee";
import { HackathonCard } from "../landingpage/_components/HackathonCard";
import { EventCard } from "../landingpage/_components/EventCard";
import { formatCount } from "@/lib/tools";
import { format } from "date-fns";

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

  /** Community avatar / display picture (listing cards) */
  avatarUrl?: string;
}

export interface ListingCardProps {
  item: ListingItem;
}

function formatMode(
  mode: string | undefined,
  locationType: string | null | undefined,
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
  const pathname = usePathname();
  const mode = formatMode(item.mode, item.locationType);
  const entryFee = formatEntryFee(item);

  if (pathname === "/hackathons") {
    const formattedDeadline = item.registrationDeadline
      ? format(new Date(item.registrationDeadline), "dd MMM yyyy")
      : "N/A";

    const footerContent = (
      <div className="flex items-between justify-between mt-auto pt-2 w-full">
        <div className="flex flex-col gap-2 ">
          <span className="text-xs text-neutral-600">Attendees</span>
          <div className="flex gap-1">
            <div className="flex">
              <div className="w-4 h-4 rounded-full bg-primary-500"></div>
              <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
              <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
            </div>
            <span className="text-neutral-700 font-medium">
              {formatCount(item.registrationCount ?? 0)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-neutral-500 text-xs">Register by</span>
          <span className="text-neutral-700 text-sm font-medium">
            {formattedDeadline}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-right">
          <span className="text-neutral-500 text-xs">Entry Fee</span>
          <span className="text-neutral-700 text-sm font-medium">
            {entryFee}
          </span>
        </div>
      </div>
    );

    return (
      <HackathonCard
        href={`/${item.routePrefix}/${item.slug}`}
        imageSrc={item.bannerUrl || null}
        title={item.title}
        organizationName={item.location}
        isFree={item.isFree}
        mode={mode}
        footerContent={footerContent}
      />
    );
  }

  if (pathname === "/events") {
    const eventCompat = {
      id: item.id,
      slug: item.slug,
      name: item.title,
      bannerImageUrl: item.bannerUrl || null,
      startDate: item.startDate || new Date().toISOString(),
      registrationDeadline: item.registrationDeadline,
      locationType: item.locationType || null,
      locationAddress: item.location || null,
      isFree: !!item.isFree,
      entryFeeAmount: item.entryFeeAmount,
      currency: item.currency || "INR",
      lowestTicketPrice: item.lowestTicketPrice,
      highestTicketPrice: item.highestTicketPrice,
      registrationCount: item.registrationCount || 0,
    };

    return (
      <EventCard event={eventCompat as any} organizationName={item.location} />
    );
  }

  if (pathname === "/community") {
    const footerContent = (
      <div className="flex items-between justify-between mt-auto pt-2 w-full">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-600">Members</span>
          <span className="text-neutral-700 font-medium">
            {formatCount(item.registrationCount ?? 0)}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-neutral-500 text-xs">Posts</span>
          <span className="text-neutral-700 text-sm font-medium">
            {formatCount(item.opportunityCount ?? 0)}
          </span>
        </div>
      </div>
    );

    return (
      <HackathonCard
        href={`/${item.routePrefix}/${item.slug}`}
        imageSrc={item.avatarUrl || item.bannerUrl || null}
        title={item.title}
        organizationName={item.status}
        isFree={true}
        mode="Community"
        footerContent={footerContent}
      />
    );
  }

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
