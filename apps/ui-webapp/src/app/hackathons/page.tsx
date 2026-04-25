"use client";

import { useState } from "react";

import {
  usePublicHackathonsPaged,
} from "@/hooks/usePublicHackathons";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { FilterState } from "@/components/common/GenericFilterSidebar";
import { ListingItem } from "@/components/common/ListingCard";

export default function CompetitionsPage() {
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

  const { data, isLoading, error } = usePublicHackathonsPaged(
    {
      ...filters,
      page: curPage,
      perPage,
    },
    { enabled: true }
  );

  const hackathons = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

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
      title="Hackathons"
      description="Browse and participate in the world's best hackathons."
    />
  );
}
