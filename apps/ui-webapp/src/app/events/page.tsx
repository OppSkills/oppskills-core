"use client";

import { useState } from "react";

import { useEvents } from "@/hooks/useEvents";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

import { FilterState } from "@/components/common/GenericFilterSidebar";

export default function EventsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    modes: [],
    status: [],
    eventDates: [],
    eligibility: [],
    sort: "recently_added",
  });

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents(undefined, filters);

  const events = data?.pages.flatMap((page: any) => page.items || []) ?? [];

  const items: ListingItem[] = events.map((e) => ({
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
    attendeeEligibility: e.attendeeEligibility,
    tags: [e.status], // Add more tags if available
    routePrefix: "events",
  }));


  return (
    <GenericListingPage
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="events"
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      filters={filters}
      setFilters={setFilters}
      title="Events"
      description="Discover amazing workshops, conferences, and meetups."
    />
  );


}
