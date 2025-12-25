"use client";

import { useMemo, useState } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Grid, LayoutList, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CompetitionsFilterSidebar } from "./_components/CompetitionsFilterSidebar";
import {
  CompetitionCard,
  type Competition,
} from "./_components/CompetitionCard";
import { CompetitionListItem } from "./_components/CompetitionListItem";
import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getMyHackathons } from "@/lib/api/hackathonApi";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";

interface MyHackathonItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  mode: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  bannerImageUrl: string | null;
  ownerId: string;
}

function isPubliclyVisible(hackathon: {
  status: string;
  approvalStatus?: string;
}): boolean {
  const publicStatuses = ["PUBLISHED", "ONGOING"];
  return (
    publicStatuses.includes(hackathon.status) &&
    hackathon.approvalStatus === "APPROVED"
  );
}

function transformPublicHackathon(
  h: PublicHackathonListItem,
): Competition & { isDraft: boolean } {
  return {
    id: h.id,
    title: h.name,
    slug: h.slug,
    shortDescription: h.description ?? undefined,
    startDate: h.startDate,
    endDate: h.endDate,
    mode: h.mode,
    location: h.locationCity ?? h.locationAddress ?? undefined,
    bannerUrl: h.bannerImageUrl ?? undefined,
    status: h.status,
    maxTeams: h.maxTeams ?? undefined,
    _count: { participants: h.registrationCount ?? 0 },
    isDraft: false,
  };
}

function transformMyHackathon(
  h: MyHackathonItem,
): Competition & { isDraft: boolean } {
  return {
    id: h.id,
    title: h.name,
    slug: h.slug,
    shortDescription: h.description ?? undefined,
    startDate: h.startDate,
    endDate: h.endDate,
    mode: h.mode,
    bannerUrl: h.bannerImageUrl ?? undefined,
    status: h.status,
    isDraft: true,
  };
}

export default function CompetitionsPage() {
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

  const { getToken, isSignedIn } = useAuth();

  const {
    data: publicHackathons,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicHackathons();

  const { data: myHackathonsRaw, isLoading: myLoading } = useQuery({
    queryKey: ["my-hackathons-for-competitions"],
    enabled: isSignedIn === true,
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      return getMyHackathons(token) as Promise<MyHackathonItem[]>;
    },
  });

  const competitions = useMemo(() => {
    const publicList = (publicHackathons ?? []).map(transformPublicHackathon);
    const publicIds = new Set(publicList.map((c) => c.id));

    const myDrafts = (myHackathonsRaw ?? [])
      .filter((h) => !isPubliclyVisible(h))
      .filter((h) => !publicIds.has(h.id))
      .map(transformMyHackathon);

    return [...myDrafts, ...publicList];
  }, [publicHackathons, myHackathonsRaw]);

  const loading = publicLoading || (isSignedIn && myLoading);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      if (
        filters.search &&
        !comp.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.modes.length > 0 &&
        comp.mode &&
        !filters.modes.includes(comp.mode)
      ) {
        return false;
      }
      if (
        filters.status.length > 0 &&
        comp.status &&
        !filters.status.includes(comp.status)
      ) {
        return false;
      }
      return true;
    });
  }, [competitions, filters]);

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "College Hackathons & Competitions",
          description:
            "Explore active hackathons, design challenges, and coding contests.",
          url: "https://oppskills.com/competitions",
        }}
      />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            College Hackathons & Competitions
          </h1>
          <p className="text-muted-foreground">
            Explore active hackathons, design challenges, and coding contests.
            The best Unstop hackathon alternative.
          </p>
        </div>

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
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <CompetitionsFilterSidebar
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : publicError ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h3 className="text-lg font-semibold">
                Failed to load competitions
              </h3>
              <p className="text-sm text-muted-foreground">
                Please try again later.
              </p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
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
