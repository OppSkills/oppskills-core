"use client";

import React, { useState } from "react";
import { Grid, LayoutList, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CompetitionsFilterSidebar } from "./CompetitionsFilterSidebar";
import { CompetitionCard, Competition } from "./CompetitionCard";
import { CompetitionListItem } from "./CompetitionListItem";

interface CompetitionListClientProps {
  initialCompetitions: Competition[];
}

export default function CompetitionListClient({
  initialCompetitions,
}: CompetitionListClientProps) {
  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<{
    search: string;
    modes: string[];
    status: string[];
    types: string[];
  }>({
    search: "",
    modes: [],
    status: [],
    types: [],
  });

  // Since we are passing initial data from server, we might not need loading state for initial load
  // But if we had client-side filtering that fetched new data, we would.
  // For this pattern, we'll assume client-side filtering on the passed data for now,
  // or we could just use the passed data directly.
  // For simplicity and matching previous behavior, let's filter the passed prop.

  // NOTE: In a real advanced app, filters might trigger server actions/router.push to URL params.
  // Here preserving the existing "client-side filtering" behavior on the initially fetched list.

  const filteredCompetitions = initialCompetitions.filter((comp) => {
    // Search
    if (
      filters.search &&
      !comp.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    // Mode
    if (
      filters.modes.length > 0 &&
      comp.mode &&
      !filters.modes.includes(comp.mode)
    ) {
      return false;
    }
    // Status
    if (
      filters.status.length > 0 &&
      comp.status &&
      !filters.status.includes(comp.status)
    ) {
      return false;
    }
    // Types
    if (filters.types.length > 0) {
      const typeMatch = filters.types.some(
        (type) =>
          comp.tags?.some((tag) => tag.includes(type)) ||
          comp.title.includes(type),
      );
      // Loose matching logic as per original file
    }

    return true;
  });

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            College Hackathons & Competitions
          </h1>
          <p className="text-muted-foreground">
            Explore active hackathons, design challenges, and coding contests.
          </p>
        </div>

        {/* Mobile Filter Toggle & View Switcher */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="mt-6">
                <CompetitionsFilterSidebar
                  filters={filters}
                  setFilters={setFilters}
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
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <CompetitionsFilterSidebar
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {filteredCompetitions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h3 className="text-lg font-semibold">No competitions found</h3>
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
              {filteredCompetitions.map((comp) =>
                viewMode === "grid" ? (
                  <CompetitionCard key={comp.id} competition={comp} />
                ) : (
                  <CompetitionListItem key={comp.id} competition={comp} />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
