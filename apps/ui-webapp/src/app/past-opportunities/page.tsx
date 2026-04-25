"use client";

import { useState } from "react";
import { usePastOpportunities } from "@/hooks/useEvents";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import type { ListingItem } from "@/components/common/ListingCard";
import type { PastOpportunityItem } from "@/hooks/useEvents";

function deriveRoutePrefix(item: PastOpportunityItem): string {
  return item.type === "HACKATHON" ? "hackathons" : "events";
}

function deriveMode(item: PastOpportunityItem): string | undefined {
  if (item.type === "HACKATHON") {
    const mode = (item as any).mode as string | null;
    if (!mode) return "Online";
    const m = mode.toUpperCase();
    if (m === "ONLINE") return "Online";
    if (m === "OFFLINE") return "Offline";
    if (m === "HYBRID") return "Hybrid";
    return "Online";
  }
  const lt = (item as any).locationType as string | null;
  if (!lt) return "Online";
  const l = lt.toUpperCase();
  if (l === "VIRTUAL" || l === "ONLINE") return "Online";
  if (l === "PHYSICAL" || l === "OFFLINE" || l === "IN_PERSON") return "Offline";
  if (l === "HYBRID") return "Hybrid";
  return "Online";
}

function toListingItem(item: PastOpportunityItem): ListingItem {
  const routePrefix = deriveRoutePrefix(item);
  return {
    id: item.id,
    title: item.name,
    slug: item.slug,
    bannerUrl: item.bannerImageUrl ?? undefined,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    locationType: (item as any).locationType ?? null,
    location:
      (item as any).locationCity ??
      (item as any).locationAddress ??
      undefined,
    mode: deriveMode(item),
    isFree: item.isFree,
    entryFeeAmount: item.entryFeeAmount ?? null,
    currency: item.currency,
    registrationDeadline: item.registrationDeadline ?? null,
    registrationCount: item.registrationCount,
    eventType: item.type === "HACKATHON" ? "Competition" : "Event",
    attendeeEligibility: (item as any).attendeeEligibility,
    tags: [item.type === "HACKATHON" ? "Competition" : "Event", item.status],
    routePrefix,
  };
}

import { FilterState } from "@/components/common/GenericFilterSidebar";

export default function PastEventsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    modes: [],
    status: [],
    eventDates: [],
    eligibility: [],
    sort: "recently_added", // Default for past opportunities
    sortOrder: "desc",
  });

  const [perPage, setPerPage] = useState(10);
  const [curPage, setCurPage] = useState(1);

  const {
    data,
    isLoading,
    error,
  } = usePastOpportunities({
    ...filters,
    page: curPage,
    perPage,
  });

  const items = (data?.items ?? []).map(toListingItem);
  const totalPages = data?.totalPages ?? 1;
  return (
    <div>

      <GenericListingPage
        items={items}
        isLoading={isLoading}
        error={error}
        routePrefix="past-opportunities"
        filters={filters}
        setFilters={setFilters}
        title="Past Opportunities"
        description="Relive incredible hackathons and events from our community."
        showPagination={true}
        pagination={{
          setPerPage: (val) => {
            setPerPage(val);
            setCurPage(1);
          },
          perPage,
          curPage,
          totalPages,
          onPageChange: setCurPage,
        }}
      />
    </div>
  );
}
