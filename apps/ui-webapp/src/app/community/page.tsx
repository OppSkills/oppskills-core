"use client";

import { useState, Suspense, useMemo, useCallback, useRef } from "react";
import { usePublicCommunitiesPaged } from "@/hooks/community/useCommunities";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";
import { CommunityFilterSidebar } from "@/components/common/CommunityFilterSidebar";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  COMMUNITY_INDUSTRY_LABELS,
  type CommunityIndustryValue,
} from "@oppskills/types/enums";

const communitySorts = [
  { label: "Recently Added", value: "recently_added" },
  { label: "Name", value: "name" },
];

function CommunitiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read parameters from URL (Single source of truth)
  const search = searchParams.get("q") || "";

  const rawIndustry = searchParams.get("industry") || "";
  const industry = useMemo(() => {
    return rawIndustry.split(",").filter(Boolean);
  }, [rawIndustry]);

  const sort = searchParams.get("sort") || "recently_added";

  const rawSortOrder = searchParams.get("sortOrder");
  const sortOrder = useMemo(() => {
    return rawSortOrder === "asc" || rawSortOrder === "desc"
      ? rawSortOrder
      : "desc";
  }, [rawSortOrder]);

  const rawPage = searchParams.get("page");
  const curPage = useMemo(() => {
    if (!rawPage) return 1;
    const parsed = parseInt(rawPage, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [rawPage]);

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

  const items: ListingItem[] = useMemo(() => {
    return communities.map((c) => {
      const displayIndustry =
        COMMUNITY_INDUSTRY_LABELS[c.industry as CommunityIndustryValue] ??
        c.industry;
      return {
        id: c.id,
        title: c.name,
        slug: c.handle,
        bannerUrl: c.coverImage ?? undefined,
        avatarUrl: c.avatarImage ?? undefined,
        status: displayIndustry,
        location: `${c.memberCount} members`,
        registrationCount: c.memberCount,
        opportunityCount: c.postCount,
        tags: [displayIndustry],
        routePrefix: "community",
        eventType: "Community",
      };
    });
  }, [communities]);

  const updateUrl = useCallback(
    (updates: {
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
        if (updates.industry.length > 0)
          params.set("industry", updates.industry.join(","));
        else params.delete("industry");
      }
      if (updates.sort !== undefined) {
        if (updates.sort && updates.sort !== "recently_added")
          params.set("sort", updates.sort);
        else params.delete("sort");
      }
      if (updates.sortOrder !== undefined) {
        if (updates.sortOrder && updates.sortOrder !== "desc")
          params.set("sortOrder", updates.sortOrder);
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
    },
    [router, pathname, searchParams],
  );

  const updateUrlRef = useRef(updateUrl);
  updateUrlRef.current = updateUrl;

  const handleClearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handlePageSizeChange = useCallback((val: number) => {
    setPerPage(val);
    updateUrlRef.current({ page: 1 });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    updateUrlRef.current({ page });
  }, []);

  const handleSetFilters = useCallback(
    (f: any) => {
      // Map sort actions back to URL updates
      if (typeof f === "function") {
        const prev = { sort, sortOrder };
        const next = f(prev);
        updateUrlRef.current({
          sort: next.sort,
          sortOrder: next.sortOrder,
          page: 1,
        });
      } else {
        updateUrlRef.current({ sort: f.sort, sortOrder: f.sortOrder, page: 1 });
      }
    },
    [sort, sortOrder],
  );

  const handleFilterChange = useCallback(
    (newVals: { search: string; industry: string[] }) => {
      updateUrlRef.current({
        search: newVals.search,
        industry: newVals.industry,
        page: 1,
      });
    },
    [],
  );

  const paginationConfig = useMemo(
    () => ({
      setPerPage: handlePageSizeChange,
      perPage,
      curPage,
      totalPages,
      onPageChange: handlePageChange,
    }),
    [handlePageSizeChange, perPage, curPage, totalPages, handlePageChange],
  );

  const filtersConfig = useMemo(
    () => ({
      search,
      modes: [],
      status: [],
      eventDates: [],
      eligibility: [],
      sort,
      sortOrder,
    }),
    [search, sort, sortOrder],
  );

  const filterSidebarValues = useMemo(
    () => ({
      search,
      industry,
    }),
    [search, industry],
  );

  const filterSidebarElement = useMemo(
    () => (
      <CommunityFilterSidebar
        values={filterSidebarValues}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />
    ),
    [filterSidebarValues, handleFilterChange, handleClearFilters],
  );

  return (
    <GenericListingPage
      items={items}
      isLoading={isLoading}
      error={error}
      showPagination={true}
      pagination={paginationConfig}
      filters={filtersConfig}
      setFilters={handleSetFilters}
      onClearFilters={handleClearFilters}
      filterSidebar={filterSidebarElement}
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
