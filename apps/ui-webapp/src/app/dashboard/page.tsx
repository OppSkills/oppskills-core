"use client";

import { Button } from "@/components/ui/button";
import AnalyticCard from "./_components/AnalyticCard";

import RegistrationLineChart from "./_components/RegistrationChart";
import Alerts from "./_components/Alerts";
import RecentListing from "./_components/RecentListing";
import { Plus, Loader2 } from "lucide-react";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { DateRangeFilter } from "./_components/DateRangeFilter";
import { getOrganizerStats, getOrganizerRegistrationTrends, getTopListings, getHighestPerformingListings } from "@/lib/api/analyticsApi";
import { cn } from "@/lib/utils";

import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import Link from "next/link";

// Types matching API
interface OrganizerStats {
  total_participants: number;
  period_participants: number;
  hackathon: { active: number; total: number };
  event: { active: number; total: number };
  festival: { active: number; total: number };
}

interface RegistrationTrend {
  [date: string]: { events: number; hackathon: number };
}

interface GenderTrend {
  [date: string]: { male: number; female: number };
}

interface TrendsResponse {
  registrationTrend: RegistrationTrend;
  genderRegistrationTrend: GenderTrend;
}

export interface ListingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  tregistrations: number;
  type: string;
}

interface HighestPerformingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  tregistrations: number;
}

export interface HighestPerformingData {
  event: HighestPerformingItem | null;
  hackathon: HighestPerformingItem | null;
}

export default function Page() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();

  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "all_time";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  // Fetch Stats
  const { data: statsRaw, isLoading: isStatsLoading } = useQuery({
    queryKey: ["organizer-stats", period, from, to],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrganizerStats(token, { period, from, to });
    },
  });

  // Fetch Trends
  const { data: trendsRaw, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["organizer-trends", period, from, to],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrganizerRegistrationTrends(token, { period, from, to });
    },
  });

  // Fetch Top Listings
  const { data: topListingsRaw, isLoading: isTopListingsLoading } = useQuery({
    queryKey: ["organizer-top-listings"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getTopListings(token);
    },
  });

  // Fetch Highest Performing
  const { data: highestPerformingRaw, isLoading: isHighestPerformingLoading } = useQuery({
    queryKey: ["organizer-highest-performing"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getHighestPerformingListings(token);
    },
  });

  const isLoading = !isUserLoaded || isStatsLoading || isTrendsLoading || isTopListingsLoading || isHighestPerformingLoading;

  // Process Stats for Cards
  const stats = statsRaw as OrganizerStats | undefined;
  const analyticData = [
    {
      type: "highlight" as const,
      title: "Total Participants",
      value: stats?.period_participants.toLocaleString() ?? "...",
      badge: "Overall Total",
      badgeValue: stats?.total_participants.toLocaleString() ?? "...",
    },
    {
      type: "normal" as const,
      title: "Active Events",
      value: stats?.event.active.toString() ?? "...",
      badge: "Total",
      badgeValue: stats?.event.total.toString() ?? "...",
      themeColor: "bg-secondary/40",
    },
    {
      type: "normal" as const,
      title: "Active Opportunities", // Hackathons
      value: stats?.hackathon.active.toString() ?? "...",
      badge: "Total",
      badgeValue: stats?.hackathon.total.toString() ?? "...",
      themeColor: "bg-secondary/40",
    },
    {
      type: "normal" as const,
      title: "Active Festivals",
      value: stats?.festival.active.toString() ?? "...",
      badge: "Total",
      badgeValue: stats?.festival.total.toString() ?? "...",
      themeColor: "bg-secondary/40",
    },
  ];

  const highestPerforming = highestPerformingRaw as HighestPerformingData | null;
  const showEventAlert = highestPerforming?.event ? highestPerforming.event.tregistrations > 1000 : false;
  const showHackathonAlert = highestPerforming?.hackathon ? highestPerforming.hackathon.tregistrations > 1000 : false;
  const showAlerts = showEventAlert || showHackathonAlert;

  // Process Trends for Charts
  const trends = trendsRaw as TrendsResponse | undefined;

  // 1. Registration Line Chart Data
  const registrationData = trends
    ? Object.entries(trends.registrationTrend).map(([date, counts]) => ({
      date,
      events: counts.events,
      hackathon: counts.hackathon,
    })).sort((a, b) => {
      // Simple string comparison for DD-MM-YYYY sort might fail if months wrap.
      // Parsing date is safer, but assuming API returns standard format.
      // Let's rely on API ordering (typically chronological) or parse if needed.
      // For strict correctness, let's parse.
      const [d1, m1, y1] = a.date.split("-").map(Number);
      const [d2, m2, y2] = b.date.split("-").map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    })
    : [];

  const registrationLines = [
    { key: "events", color: "#8b5cf6", label: "Events" }, // Purple
    { key: "hackathon", color: "#ec4899", label: "Hackathons" }, // Pink
  ];

  // 2. Gender Line Chart Data
  // User requested line chart for gender as well.
  // We can just use the provided api data which is gender trends by date.
  const genderChartData = trends
    ? Object.entries(trends.genderRegistrationTrend).map(([date, counts]) => ({
      date,
      male: counts.male,
      female: counts.female,
    })).sort((a, b) => {
      const [d1, m1, y1] = a.date.split("-").map(Number);
      const [d2, m2, y2] = b.date.split("-").map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    })
    : [];

  const genderLines = [
    { key: "male", color: "#8b5cf6", label: "Male" },
    { key: "female", color: "#ec4899", label: "Female" },
  ];


  if (isLoading && !stats && !trends && !topListingsRaw && !highestPerformingRaw) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
      <div className="w-full max-w-[1600px] p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left space-y-2">
            <h1 className="font-bold text-3xl md:text-4xl text-foreground">
              Welcome Back, {user?.fullName || user?.firstName || "App Name"}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Here is the summary of overall performance
            </p>
          </div>
          <div className="right flex flex-wrap items-center justify-end gap-3 self-end md:self-auto w-full sm:w-auto">
            <DateRangeFilter />
            <Link href="/dashboard/host">
              <Button className="flex gap-2 rounded-full">
                <Plus className="h-5 w-5" />
                Host
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {analyticData.map((item, index) => (
            <MotionItem key={index}>
              <AnalyticCard
                type={item.type}
                title={item.title}
                value={item.value}
                badge={item.badge}
                badgeValue={item.badgeValue}
              />
            </MotionItem>
          ))}
        </MotionContainer>

        {/* Charts Row */}
        <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <MotionItem className="w-full">
            <RegistrationLineChart
              data={registrationData}
              lines={registrationLines}
              title={`Registration Trends (${period.replace('_', ' ')})`}
            />
          </MotionItem>
          <MotionItem className="w-full">
            {/* Swapped to LineChart for Gender as requested */}
            <RegistrationLineChart
              data={genderChartData}
              lines={genderLines}
              title={`Gender Registration Trends (${period.replace('_', ' ')})`}
            />
          </MotionItem>
        </MotionContainer>

        {/* Bottom Row: Recent Listings and Alerts */}
        <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-10">
          <MotionItem className={cn("w-full", !showAlerts && "lg:col-span-2")}>
            <RecentListing data={topListingsRaw as ListingItem[] || []} />
          </MotionItem>
          {showAlerts && (
            <MotionItem className="w-full">
              <Alerts data={highestPerforming} />
            </MotionItem>
          )}
        </MotionContainer>
      </div>
    </div>
  );
}
