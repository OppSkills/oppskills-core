"use client";

import { useState } from "react";

import { useEvents } from "@/hooks/useEvents";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents(searchTerm);

  // Flatten duplicate pages into a single array
  const events = data?.pages.flatMap((page: any) => page.items || []) ?? [];

  // Filter to only show published events (Client-side fail-safe, generally backend handles this)
  const publishedEvents = events.filter(
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <GenericListingPage
      title="Upcoming Events"
      description="Don’t miss what’s next, stay updated with upcoming events and sessions."
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="events"
      onSearch={handleSearch}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );


}
