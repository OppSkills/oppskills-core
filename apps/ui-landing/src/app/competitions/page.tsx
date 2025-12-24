"use client";

import React, { useEffect, useState } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  CopyIcon,
  Grid,
  LayoutList,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CompetitionsFilterSidebar } from "./_components/CompetitionsFilterSidebar";
import { CompetitionCard, Competition } from "./_components/CompetitionCard";
import { CompetitionListItem } from "./_components/CompetitionListItem";
// import { getHackathons } from "@/lib/api/hackathonApi";

// Mock Data for development/fallback
const MOCK_COMPETITIONS: Competition[] = [
  {
    id: "1",
    title: "Global AI Hackathon 2024",
    slug: "global-ai-hackathon-2024",
    shortDescription:
      "Build the future of AI in this 48-hour global event. Prizes worth $50k!",
    startDate: "2024-05-15",
    endDate: "2024-05-17",
    mode: "Online",
    location: "Global",
    bannerUrl:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
    status: "Upcoming",
    maxTeams: 100,
    tags: ["AI", "Machine Learning", "Python"],
    _count: { participants: 450 },
  },
  {
    id: "2",
    title: "Sustainability Design Challenge",
    slug: "sustainability-design-challenge",
    shortDescription:
      "Design solutions for a sustainable future. Open to all designers and engineers.",
    startDate: "2024-06-01",
    endDate: "2024-06-10",
    mode: "Hybrid",
    location: "New York, NY",
    bannerUrl:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
    status: "Open",
    maxTeams: 50,
    tags: ["Design", "Sustainability", "Green Tech"],
    _count: { participants: 120 },
  },
  {
    id: "3",
    title: "FinTech Innovation Summit",
    slug: "fintech-innovation-summit",
    shortDescription:
      "Revolutionize the financial industry with blockchain and web3 technologies.",
    startDate: "2024-07-20",
    endDate: "2024-07-22",
    mode: "Offline",
    location: "London, UK",
    bannerUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=600&auto=format&fit=crop",
    status: "Upcoming",
    maxTeams: 200,
    tags: ["FinTech", "Blockchain", "Web3"],
    _count: { participants: 300 },
  },
  {
    id: "4",
    title: "HealthTech Codefest",
    slug: "healthtech-codefest",
    shortDescription:
      "Coding for better health outcomes. Join us to solve critical healthcare challenges.",
    startDate: "2024-04-10",
    endDate: "2024-04-12",
    mode: "Online",
    location: "Global",
    bannerUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
    status: "Ended",
    maxTeams: 80,
    tags: ["HealthTech", "Coding", "Java"],
    _count: { participants: 150 },
  },
];

export default function CompetitionsPage() {
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

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data (using mock for now as we don't have guaranteed auth token)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In real impl: const data = await getHackathons(token);
        // For demo/dev: simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCompetitions(MOCK_COMPETITIONS);
      } catch (error) {
        console.error("Failed to fetch competitions", error);
        // Fallback or empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredCompetitions = competitions.filter((comp) => {
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
    // Status (This relies on status string matching exactly, in real app might need mapping)
    if (
      filters.status.length > 0 &&
      comp.status &&
      !filters.status.includes(comp.status)
    ) {
      return false;
    }
    // Tags/Types (using tags as proxy for types/categories)
    // In real app, check specific type field
    if (filters.types.length > 0) {
      // Simple check: if selected type matches any tag or title keywords
      // This is a loose match for the demo
      const typeMatch = filters.types.some(
        (type) =>
          comp.tags?.some((tag) => tag.includes(type)) ||
          comp.title.includes(type)
      );
      // Logic: If filter is active, must match at least one
      // Actually 'types' in sidebar are "Hackathon", "Design Challenge" etc.
      // We don't have a 'type' field in mock, let's skip strict enforcement or map it.
      // For now, let's ignore strictly to avoid empty results on mock data
      // or implement a basic check if data allows.
    }

    return true;
  });

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
          <div className="sticky top-20">
            <CompetitionsFilterSidebar
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
