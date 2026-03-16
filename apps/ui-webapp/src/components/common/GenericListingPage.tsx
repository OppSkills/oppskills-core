"use client";

import React, { useMemo, useState } from "react";
import { Grid, LayoutList, SlidersHorizontal, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingCard, ListingItem } from "./ListingCard";
import {
  GenericFilterSidebar,
  FilterState,
  FilterOptions,
} from "./GenericFilterSidebar";

interface GenericListingPageProps {
  title: string;
  description: string;
  jsonLdType?: string;
  items: ListingItem[];
  isLoading: boolean;
  error?: unknown;
  routePrefix: string;
  onSearch?: (term: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
}

export function GenericListingPage({
  title,
  description,
  jsonLdType = "CollectionPage",
  items,
  isLoading,
  error,
  routePrefix,
  onSearch,
  onLoadMore,
  hasMore,
  isFetchingNextPage,
}: GenericListingPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    modes: [],
    status: [],
    types: [],
  });

  // Debounce search input
  // If useDebounce hook doesn't exist, we'll implement a simple effect here.
  // Assuming useDebounce hook exists or I will create a simple useEffect.
  // Let's implement debounce inside useEffect for safety if hook is missing.

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue);
      }
      setFilters(prev => ({ ...prev, search: searchValue }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  // Dynamically calculate filter options from the items
  const filterOptions: FilterOptions = useMemo(() => {
    const modes = new Set<string>();
    const status = new Set<string>();
    const types = new Set<string>();

    items.forEach((item) => {
      if (item.mode) modes.add(item.mode);
      if (item.status) status.add(item.status);
      if (item.tags) {
        item.tags.forEach((t) => types.add(t));
      } else if (item.eventType) {
        types.add(item.eventType);
      }
    });

    return {
      modes: Array.from(modes).sort(),
      status: Array.from(status).sort(),
      types: Array.from(types).sort(),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search is now handled by API for main text, but we keep local filter for immediate feedback or strict filtering if needed.
      // However, if we do server side search, local filter might hide items that backend returned matching the search.
      // If we are strictly server-side search, we should probably SKIP local search filter if onSearch is provided?
      // Yes. If onSearch is provided, we assume items are already filtered by search.
      // But wait! Users might want to filter the *existing* list further? 
      // Typically, "search" input above content is global search (API).
      // Sidebar search is usually "filter within results".
      // Let's assume the prop `onSearch` drives the main API query.
      // The filter sidebar also has a "search" field in `filters.search`. 
      // If we use the main search bar, we should sync it or treat them as same?
      // Let's treat the Main Search Bar (to be added) as the primary API search.

      // We will skip local search filtering if we trust the API.
      // But `GenericFilterSidebar` updates `filters.search`.
      // Let's keep existing logic but just sync the `searchValue` state with `filters.search`?
      // Actually, let's allow local filtering as secondary.

      // 2. Status
      const matchStatus =
        filters.status.length === 0 ||
        (item.status && filters.status.includes(item.status));
      if (!matchStatus) return false;

      // 3. Mode
      const matchMode =
        filters.modes.length === 0 ||
        (item.mode && filters.modes.some((m) => item.mode === m));
      if (!matchMode) return false;

      // 4. Types
      const matchType =
        filters.types.length === 0 ||
        (item.tags &&
          item.tags.some((tag) =>
            filters.types.some((t) => tag.includes(t))
          )) ||
        (item.eventType && filters.types.includes(item.eventType));

      if (!matchType) return false;

      return true;
    });
  }, [items, filters]);

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": jsonLdType,
          name: title,
          description: description,
          url: `https://oppskills.com/${routePrefix}`,
        }}
      />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight break-words">{title}</h1>
          <p className="text-muted-foreground break-words">{description}</p>
        </div>

        {/* Search Bar - Center aligned or next to title? */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="h-full p-2 absolute flex items-center left-1">
              <Search className="h-4 w-4 text-muted-foreground" />

            </div>
            <Input
              type="search"
              placeholder="Annual Conference"
              className="pl-8 w-full"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="px-4">
              <div className="mt-6">
                <GenericFilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  options={filterOptions}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center rounded-md border bg-muted/50 p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            {/* List view currently just maps to same card in grid or simplified list item */}
            {/* For this refactor, let's keep it simple: List view might use a different layout style */}
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
              <span className="sr-only">List View</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <GenericFilterSidebar
              filters={filters}
              setFilters={setFilters}
              options={filterOptions}
            />
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h3 className="text-lg font-semibold">Failed to load items</h3>
              <p className="text-sm text-muted-foreground">
                Please try again later.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h3 className="text-lg font-semibold">No items found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
              <Button
                variant="link"
                onClick={() =>
                  setFilters({ search: "", modes: [], status: [], types: [] })
                }
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={viewMode === "list" ? "w-full" : ""}
                >
                  <ListingCard
                    item={{ ...item, routePrefix }}
                    layout={viewMode}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !isLoading && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
