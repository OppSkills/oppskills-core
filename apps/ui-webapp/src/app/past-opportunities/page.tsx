"use client";

import { useState } from "react";
import { usePastEvents } from "@/hooks/useEvents";
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
    tags: [item.type === "HACKATHON" ? "Competition" : "Event", item.status],
    routePrefix,
  };
}

export default function PastEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePastEvents(undefined, searchTerm);

  const items = (data?.pages.flatMap((p) => p.items) ?? []).map(toListingItem);

  return (
    <GenericListingPage
      title="Past Opportunities"
      description="Browse the full history of events and competitions that have already taken place."
      items={items}
      isLoading={isLoading}
      error={error}
      routePrefix="past-opportunities"
      onSearch={setSearchTerm}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}
