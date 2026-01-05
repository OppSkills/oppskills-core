"use client";

import { useEvents } from "@/hooks/useEvents";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

export default function EventsPage() {
  const { data: events, isLoading, error } = useEvents();

  // Filter to only show published events
  const publishedEvents = (events ?? []).filter(
    (e) => e.status === "PUBLISHED" || e.status === "ONGOING"
  );

  const items: ListingItem[] = publishedEvents.map((e) => ({
    id: e.id,
    title: e.name,
    slug: e.slug,
    bannerUrl: e.bannerImageUrl ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    locationType: e.locationType,
    location: e.locationCity ?? e.locationAddress ?? undefined,
    isFree: e.isFree,
    entryFeeAmount: e.entryFeeAmount,
    currency: e.currency,
    registrationDeadline: e.registrationDeadline,
    registrationCount: e.registrationCount,
    eventType: e.eventType || "Event",
    tags: [e.status], // Add more tags if available
    routePrefix: "events",
  }));

  return (
    <GenericListingPage
      title="Upcoming College Events"
      description="Stay ahead with the latest events, workshops, and conferences."
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="events"
    />
  );
}
