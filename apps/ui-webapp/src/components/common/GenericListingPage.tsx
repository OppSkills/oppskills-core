"use client";

import React, { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ListingCard, ListingItem } from "./ListingCard";
import {
  GenericFilterSidebar,
  FilterState,
} from "./GenericFilterSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenericListingPageProps {
  items: ListingItem[];
  isLoading: boolean;
  error?: unknown;
  routePrefix: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  filters?: FilterState;
  setFilters?: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  title?: string;
  description?: string;
}

export function GenericListingPage({
  items,
  isLoading,
  error,
  routePrefix,
  onLoadMore,
  hasMore,
  isFetchingNextPage,
  filters,
  setFilters,
  title,
  description,
}: GenericListingPageProps) {
  const [curSort, setCurSort] = useState(filters?.sort || "most_relevant");

  // Sync curSort from filters.sort (e.g. from Clear Filters)
  useEffect(() => {
    if (filters?.sort && filters.sort !== curSort) {
      setCurSort(filters.sort);
    }
  }, [filters?.sort]);

  // Sync sort to filters if it changes from UI
  useEffect(() => {
    if (filters && setFilters && filters.sort !== curSort) {
      setFilters((prev) => ({ ...prev, sort: curSort }));
    }
  }, [curSort, filters, setFilters]);

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
          {title || "Opportunities"}
        </h1>
        {description && (
          <p className="mt-2 text-neutral-600">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 mb-6">
          {filters && setFilters && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <ScrollArea className="h-full px-4 py-8">
                  <GenericFilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {filters && setFilters && (
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20">
              <GenericFilterSidebar
                filters={filters}
                setFilters={setFilters}
              />
            </div>
          </aside>
        )}

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
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h3 className="text-lg font-semibold">No items found</h3>
              <p className="text-sm text-muted-foreground">
                {filters ? "Try adjusting your filters." : "Check back later for new items."}
              </p>
              {filters && setFilters && (
                <Button
                  variant="link"
                  onClick={() =>
                    setFilters({
                      search: "",
                      modes: [],
                      status: [],
                      eventDates: [],
                      eligibility: [],
                      sort: filters.sort,
                    })
                  }
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="flex w-full gap-6 flex-col">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 w-full justify-between">
                <p className="text-sm text-neutral-900 font-medium">Showing {items.length} Results</p>
                {filters && setFilters && (
                  <div className="flex items-center gap-4">
                    <p className="font-medium">Sort:</p>
                    
                    {/* Desktop Sort List */}
                    <div className="hidden sm:flex gap-3 text-neutral-700 select-none">
                      {
                        [
                          "Most Relevant",
                          "Submission Date",
                          "Recently Added",
                          "Price Amount"
                        ].map((e) => {
                          const id = e.toLowerCase().replaceAll(" ", "_")
                          return (
                            <p 
                              key={id} 
                              className={curSort == id ? "text-primary-600 font-bold cursor-default" : "cursor-pointer hover:text-primary-600"} 
                              onClick={() => { id != curSort && setCurSort(id) }}
                            >
                              {e}
                            </p>
                          )
                        })
                      }
                    </div>

                    {/* Mobile Sort Dropdown */}
                    <div className="flex sm:hidden w-40">
                      <Select value={curSort} onValueChange={setCurSort}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="most_relevant">Most Relevant</SelectItem>
                          <SelectItem value="submission_date">Submission Date</SelectItem>
                          <SelectItem value="recently_added">Recently Added</SelectItem>
                          <SelectItem value="price_amount">Price Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                  <div key={item.id} className="w-full">
                    <ListingCard item={{ ...item, routePrefix }} />
                  </div>
                ))}
              </div>
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
