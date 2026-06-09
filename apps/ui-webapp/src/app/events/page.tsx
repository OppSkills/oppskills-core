"use client";

import { useState } from "react";

import { usePublicEventsPaged } from "@/hooks/events/useEvents";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

import { FilterState } from "@/components/common/GenericFilterSidebar";

export default function EventsPage() {
  const [curPage, setCurPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    modes: [],
    status: [],
    eventDates: [],
    eligibility: [],
    sort: "recently_added",
    sortOrder: "desc",
  });

  const { data, isLoading, error } = usePublicEventsPaged(
    {
      ...filters,
      page: curPage,
      perPage,
    },
    { enabled: true },
  );

  const events = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const items: ListingItem[] = events.map((e) => ({
    id: e.id,
    title: e.name,
    slug: e.slug,
    bannerUrl: e.bannerImageUrl ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    locationType: e.locationType,
    location: e.locationCoords ?? e.locationAddress ?? undefined,
    isFree: e.isFree,
    entryFeeAmount: e.entryFeeAmount,
    lowestTicketPrice: e.lowestTicketPrice,
    highestTicketPrice: e.highestTicketPrice,
    currency: e.currency,
    registrationDeadline: e.registrationDeadline,
    registrationCount: e.registrationCount,
    eventType: e.eventType || "Event",
    attendeeEligibility: e.attendeeEligibility,
    tags: [e.status],
    routePrefix: "events",
  }));

  return (
    <GenericListingPage
      items={items}
      isLoading={isLoading}
      error={error}
      showPagination={true}
      pagination={{
        setPerPage: (val) => {
          setPerPage(val);
          setCurPage(1);
        },
        perPage,
        curPage,
        totalPages,
        onPageChange: (page) => setCurPage(page),
      }}
      filters={filters}
      setFilters={(f) => {
        setFilters(f);
        setCurPage(1);
      }}
      title="Events"
      description="Discover amazing workshops, conferences, and meetups."
    />
  );
}
