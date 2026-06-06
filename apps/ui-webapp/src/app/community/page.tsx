"use client";

import { useState } from "react";
import { usePublicCommunitiesPaged } from "@/hooks/useCommunities";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";
import type { FilterState } from "@/components/common/GenericFilterSidebar";

export default function CommunitiesPage() {
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

  const { data, isLoading, error } = usePublicCommunitiesPaged(
    {
      search: filters.search,
      industry: filters.eligibility,
      sort: filters.sort ?? "recently_added",
      sortOrder: filters.sortOrder ?? "desc",
      page: curPage,
      perPage,
    },
    { enabled: true },
  );

  const communities = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const items: ListingItem[] = communities.map((c) => ({
    id: c.id,
    title: c.name,
    slug: c.handle,
    bannerUrl: c.coverImage ?? undefined,
    avatarUrl: c.avatarImage ?? undefined,
    status: c.industry,
    location: `${c.memberCount} members`,
    registrationCount: c.memberCount,
    opportunityCount: c.postCount,
    tags: [c.industry],
    routePrefix: "community",
    eventType: "Community",
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
      title="Communities"
      description="Discover vibrant communities to connect, collaborate, and grow."
    />
  );
}
