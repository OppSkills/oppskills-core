"use client";

import { useState, Suspense } from "react";
import { usePublicCommunitiesPaged } from "@/hooks/useCommunities";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";
import { CommunityFilterSidebar } from "@/components/common/CommunityFilterSidebar";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

function CommunitiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read parameters from URL (Single source of truth)
  const search = searchParams.get("q") || "";
  const industry = searchParams.get("industry")?.split(",").filter(Boolean) || [];
  const sort = searchParams.get("sort") || "recently_added";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const curPage = parseInt(searchParams.get("page") || "1", 10);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading, error } = usePublicCommunitiesPaged(
    {
      search,
      industry,
      sort,
      sortOrder,
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

  const updateUrl = (updates: {
    search?: string;
    industry?: string[];
    sort?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.search !== undefined) {
      if (updates.search) params.set("q", updates.search);
      else params.delete("q");
    }
    if (updates.industry !== undefined) {
      if (updates.industry.length > 0) params.set("industry", updates.industry.join(","));
      else params.delete("industry");
    }
    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "recently_added") params.set("sort", updates.sort);
      else params.delete("sort");
    }
    if (updates.sortOrder !== undefined) {
      if (updates.sortOrder && updates.sortOrder !== "desc") params.set("sortOrder", updates.sortOrder);
      else params.delete("sortOrder");
    }
    if (updates.page !== undefined) {
      if (updates.page > 1) params.set("page", updates.page.toString());
      else params.delete("page");
    } else {
      // Reset page to 1 whenever filters change
      if (updates.search !== undefined || updates.industry !== undefined) {
        params.delete("page");
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const communitySorts = [
    { label: "Recently Added", value: "recently_added" },
    { label: "Name", value: "name" },
  ];

  return (
    <GenericListingPage
      items={items}
      isLoading={isLoading}
      error={error}
      showPagination={true}
      pagination={{
        setPerPage: (val) => {
          setPerPage(val);
          updateUrl({ page: 1 });
        },
        perPage,
        curPage,
        totalPages,
        onPageChange: (page) => updateUrl({ page }),
      }}
      filters={{
        search,
        modes: [],
        status: [],
        eventDates: [],
        eligibility: [],
        sort,
        sortOrder,
      }}
      setFilters={(f) => {
        // Map sort actions back to URL updates
        if (typeof f === "function") {
          const prev = { sort, sortOrder };
          const next = f(prev);
          updateUrl({ sort: next.sort, sortOrder: next.sortOrder, page: 1 });
        } else {
          updateUrl({ sort: f.sort, sortOrder: f.sortOrder, page: 1 });
        }
      }}
      onClearFilters={handleClearFilters}
      filterSidebar={
        <CommunityFilterSidebar
          values={{ search, industry }}
          onChange={(newVals) => {
            updateUrl({ search: newVals.search, industry: newVals.industry, page: 1 });
          }}
          onClear={handleClearFilters}
        />
      }
      sortOptions={communitySorts}
      title="Communities"
      description="Discover vibrant communities to connect, collaborate, and grow."
    />
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <CommunitiesPageContent />
    </Suspense>
  );
}
