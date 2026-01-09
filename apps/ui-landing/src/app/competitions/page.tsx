"use client";

import { useState } from "react";

import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

export default function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicHackathons(undefined, searchTerm);

  const hackathons = data?.pages.flat() ?? [];

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
    tags: [h.mode, h.status],
    routePrefix: "competitions",
  }));

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <GenericListingPage
      title="College Hackathons & Competitions"
      description="Explore active hackathons, design challenges, and coding contests."
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="competitions"
      onSearch={handleSearch}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}
