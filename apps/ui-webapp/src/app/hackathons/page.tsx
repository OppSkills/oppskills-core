"use client";

import { useState } from "react";

import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { FilterState } from "@/components/common/GenericFilterSidebar";
import { ListingItem } from "@/components/common/ListingCard";

export default function CompetitionsPage() {
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
  } = usePublicHackathons(undefined, filters);

  const hackathons = data?.pages.flatMap((page: any) => page.items || []) ?? [];

  const items: ListingItem[] = hackathons.map((h) => ({
    id: h.id,
    title: h.name,
    slug: h.slug,
    bannerUrl: h.bannerImageUrl ?? undefined,
    startDate: h.startDate,
    endDate: h.endDate,
    status: h.status,
    mode: h.mode,
    locationType: h.locationType,
    location: h.locationCity ?? h.locationAddress ?? undefined,
    isFree: h.isFree,
    entryFeeAmount: h.entryFeeAmount,
    currency: h.currency,
    registrationDeadline: h.registrationDeadline,
    registrationCount: h.registrationCount,
    eventType: h.hackathonType || "Hackathon",
    attendeeEligibility: h.attendeeEligibility,
    tags: [h.mode, h.status],
    routePrefix: "hackathons",
  }));


  return (
    <GenericListingPage
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="hackathons"
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      filters={filters}
      setFilters={setFilters}
      title="Hackathons"
      description="Browse and participate in the world's best hackathons."
    />
  );
}
