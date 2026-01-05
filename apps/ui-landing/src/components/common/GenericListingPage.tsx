"use client";

import React, { useMemo, useState } from "react";
import { Grid, LayoutList, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingCard, ListingItem } from "./ListingCard";
// We can reuse the existing filter sidebar by making it generic enough or just accepting props
// For now, let's assume we want to reuse the sidebar structure but maybe make the filters generic?
// Or we can import the specific sidebar if passed as a prop.
// A simpler approach for the Prompt is to implement a generic sidebar here or cleaner: accept a FilterComponent prop.
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
  routePrefix: string; // "competitions", "events", "festivals"
}

export function GenericListingPage({
  title,
  description,
  jsonLdType = "CollectionPage",
  items,
  isLoading,
  error,
  routePrefix,
}: GenericListingPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    modes: [],
    status: [],
    types: [],
  });

  // Dynamically calculate filter options from the items
  const filterOptions: FilterOptions = useMemo(() => {
    const modes = new Set<string>();
    const status = new Set<string>();
    const types = new Set<string>();

    items.forEach((item) => {
      if (item.mode) modes.add(item.mode);
      // Support location type mapping if mode is missing or just use explicit mode
      // Logic: GenericListingPage assumes item.mode is already formatted or raw.
      // Let's assume item.mode is the display value or consistent enum.

      if (item.status) status.add(item.status);

      // For types, we use tags if available, or eventType
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
      // 1. Search (AND logic)
      if (
        filters.search &&
        !item.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // 2. Status (OR logic within category)
      const matchStatus =
        filters.status.length === 0 ||
        (item.status && filters.status.includes(item.status));
      if (!matchStatus) return false;

      // 3. Mode (OR logic within category)
      const matchMode =
        filters.modes.length === 0 ||
        (item.mode && filters.modes.some((m) => item.mode === m)); // Exact match or logic mapping needed?
      // Let's assume item.mode matches the filter value exactly for now.
      if (!matchMode) return false;

      // 4. Types (OR logic within category)
      const matchType =
        filters.types.length === 0 ||
        (item.tags &&
          item.tags.some((tag) =>
            filters.types.some((t) => tag.includes(t))
          )) ||
        (item.eventType && filters.types.includes(item.eventType));

      // Note: The previous logic was "match ANY type".
      // User says: "if user chooses upcoming and open then filter will show him all items which are upcoming OR open"
      // -> This contradicts "AND between categories".
      // Wait, User said: "different categories section will work AND wise... if a user chooses upcoming and open then filter will show him all the items which are upcoming or those items which are open".
      // This confirms: OR within Status, OR within Mode, AND between Status and Mode.

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
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
                  className={viewMode === "list" ? "max-w-3xl" : ""}
                >
                  {/* In list mode we might want a horizontal card, but for now reusing ListingCard */}
                  {/* To strictly follow "list view", we could make ListingCard accept a "variant" prop */}
                  {/* For MVP refactor, using the same card is acceptable or wrapping it */}
                  <ListingCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
