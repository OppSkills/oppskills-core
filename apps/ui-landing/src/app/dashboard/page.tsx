"use client";

import { Button } from "@/components/ui/button";
import AnalyticCard from "./_components/AnalyticCard";

import RegistrationLineChart from "./_components/RegistrationChart";
import GenderChart from "./_components/GenderChart";
import Alerts from "./_components/Alerts";
import DomainsChart from "./_components/DomainsChart";
import RecentListing from "./_components/RecentListing";
import { Link, Plus, Loader2 } from "lucide-react";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getOrganizerStats, getOrganizerRegistrationTrends } from "@/lib/api/analyticsApi";

import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";

// Types matching API
interface OrganizerStats {
  total_participants: number;
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

export default function Page() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();

  // Fetch Stats
  const { data: statsRaw, isLoading: isStatsLoading } = useQuery({
    queryKey: ["organizer-stats"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrganizerStats(token);
    },
  });

  // Fetch Trends
  const { data: trendsRaw, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["organizer-trends"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getOrganizerRegistrationTrends(token);
    },
  });

  const isLoading = !isUserLoaded || isStatsLoading || isTrendsLoading;

  // Process Stats for Cards
  const stats = statsRaw as OrganizerStats | undefined;
  const analyticData = [
    {
      type: "highlight" as const,
      title: "Total Participants",
      value: stats?.total_participants.toLocaleString() ?? "...",
      badge: "Total", // Placeholder as API doesn't give 'registered last month' yet
      badgeValue: "All Time",
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

  // 2. Gender Pie Chart Data
  // Aggregating gender stats over the trend period
  // Since API returns trend, we sum it up for the pie chart representation
  const genderData = trends
    ? Object.values(trends.genderRegistrationTrend).reduce((acc, curr) => {
      acc.male += curr.male;
      acc.female += curr.female;
      return acc;
    }, { male: 0, female: 0 })
    : { male: 0, female: 0 };

  // Check if we have total participants but no gender data (e.g. older data or missing profiles)
  // For now, visualize what we have from the trend.
  const genderChartData = [
    { name: "Male", value: genderData.male, color: "#8b5cf6" },
    { name: "Female", value: genderData.female, color: "#ec4899" },
  ].filter(d => d.value > 0);


  if (isLoading && !stats && !trends) {
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left space-y-2">
            <h1 className="font-bold text-3xl md:text-4xl text-foreground">
              Welcome Back, {user?.fullName || user?.firstName || "App Name"}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Here is the summary of overall performance
            </p>
          </div>
          <div className="right self-end md:self-auto w-full sm:w-auto">
            <Link href="/dashboard/host">
              <Button className="w-full rounded-full px-6 h-12 bg-primary-500 hover:bg-primary/90 text-background font-semibold shadow-lg shadow-purple-200">
                <Plus className="mr-2 h-5 w-5" />
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
                themeColor={item.themeColor}
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
              title="Registration Trends (7 Days)"
            />
          </MotionItem>
          <MotionItem className="w-full">
            {/* Swapped DomainsChart for GenderChart based on request */}
            <GenderChart data={genderChartData} />
          </MotionItem>
        </MotionContainer>

        {/* Bottom Row: Recent Listings and Alerts */}
        <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-10">
          <MotionItem className="w-full">
            <RecentListing />
          </MotionItem>
          <MotionItem className="w-full">
            <Alerts />
          </MotionItem>
        </MotionContainer>
      </div>
    </div>
  );
}
