import { ShareButton } from "@/app/dashboard/_components/ShareButton";
import { DateRangeFilter } from "@/app/dashboard/_components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Suspense } from "react";
import { Clock1, Loader2 } from "lucide-react";

import { currentUser, auth } from "@clerk/nextjs/server";
import { getEventGeneralStats, getEventDetailedStats } from "@/lib/api/analyticsApi";
import { getEventBySlug } from "@/lib/api/eventApi";
import GenderDiversityChart from "@/app/dashboard/_components/GenderDiversityChart";
import ImpressionsChart from "@/app/dashboard/_components/ImpressionsChart";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import RegistrationLineChart from "@/app/dashboard/_components/RegistrationChart";
import Alerts from "@/app/dashboard/_components/Alerts";
import RoundStats from "@/app/dashboard/_components/RoundStats";
import DomainsChart from "@/app/dashboard/_components/DomainsChart";
import PublicLinkQrCard from "@/app/dashboard/_components/PublicLinkQrCard";

// Helper components
function AnalyticsLoader() {
  return (
    <div className="flex h-40 w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Type definitions
type InternalStats = {
  registrations: number;
  periodRegistrations: number;
  impressions: number;
  views: number;
};

// Async component for Analytics
async function AnalyticsSection({
  token,
  slug,
  period,
  from,
  to,
}: {
  token: string;
  slug: string;
  period?: string;
  from?: string;
  to?: string;
}) {
  let stats: InternalStats = { registrations: 0, periodRegistrations: 0, impressions: 0, views: 0 };

  try {
    const rawStats = await getEventGeneralStats(token, slug, { period, from, to });
    if (rawStats) {
      stats = {
        registrations: Number(rawStats.registrations) || 0,
        periodRegistrations: Number(rawStats.periodRegistrations) || 0,
        impressions: Number(rawStats.impressions) || 0,
        views: Number(rawStats.views) || 0,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch Event analytics:`, error);
  }

  const { registrations: totalRegistrations, periodRegistrations, impressions, views } = stats;

  let ctrRatio = impressions > 0 ? views / impressions : 0;
  if (ctrRatio > 1) ctrRatio = 1;

  let ctrBadge = "Concerning";
  if (ctrRatio > 0.5) {
    ctrBadge = "Best";
  } else if (ctrRatio >= 0.25) {
    ctrBadge = "Good";
  } else if (ctrRatio < 0.1) {
    ctrBadge = "Concerning";
  } else {
    ctrBadge = "Average";
  }

  const analyticData = [
    {
      type: "highlight",
      title: "Completed Registration",
      value: periodRegistrations.toLocaleString(),
      badge: "Overall Total",
      badgeValue: totalRegistrations.toLocaleString(),
    },
    {
      type: "normal",
      title: "Total Impressions",
      value: impressions.toLocaleString(),
      badge: "Overall Visibility",
      badgeValue: "All Time",
    },
    {
      type: "normal",
      title: "Total Views",
      value: views.toLocaleString(),
      badge: "Total engagement",
      badgeValue: "All Time",
    },
    {
      type: "normal",
      title: "CTR Ratio",
      value: (ctrRatio * 100).toFixed(1) + "%",
      badge: "Platform Efficiency",
      badgeValue: "All Time",
    },
  ];

  return (
    <MotionContainer className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
      {analyticData.map((item, index) => (
        <MotionItem key={index}>
          <AnalyticCard
            type={(item.type as "normal" | "highlight") || "normal"}
            title={item.title}
            value={item.value}
            badge={item.badge}
            badgeValue={item.badgeValue}
          />
        </MotionItem>
      ))}

      <MotionItem className="md:col-span-2 md:justify-self-center xl:col-span-1 xl:justify-self-stretch">
        <PublicLinkQrCard
          title="Event public link"
          url={`https://www.oppskills.com/events/${slug}`}
          downloadFileName={`event-${slug}-qr`}
        />
      </MotionItem>
    </MotionContainer>
  );
}

// Helper to fetch details
async function getEventName(token: string, slug: string): Promise<string> {
  try {
    const event = (await getEventBySlug(token, slug)) as { name: string };
    return event?.name || "Unknown Event";
  } catch (e) {
    return "Unknown Event";
  }
}

export default async function EventDashboard(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { slug } = params;
  const { period, from, to } = searchParams;

  const user = await currentUser();
  const { getToken } = await auth();
  const token = (await getToken()) || "";

  // Fetch details (Name)
  const name = await getEventName(token, slug);

  return (
    <div className="flex justify-center w-full bg-neutral-200">
      <div className="w-full bg-background p-4 sm:p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left">
            <h1 className="font-semibold text-2xl md:text-3xl wrap-break-words">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground pt-1 md:pt-2">
              View all the details for {name}
            </p>
          </div>
          <div className="right flex flex-wrap items-center justify-end gap-3 self-end md:self-auto min-w-0">
            <DateRangeFilter />
            <ShareButton
              title={name}
              slug={slug}
              type="event"
              className="rounded-full"
            />
          </div>
        </div>

        {/* Analytics Section with Loader */}

        <Suspense fallback={<AnalyticsLoader />}>
          <AnalyticsSection
            token={token}
            slug={slug}
            period={period}
            from={from}
            to={to}
          />
        </Suspense>

        {/* CHARTS */}
        <Suspense fallback={<AnalyticsLoader />}>
          <DetailedAnalyticsSection
            token={token}
            slug={slug}
            period={period}
            from={from}
            to={to}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Async component for Detailed Analytics (Charts)
async function DetailedAnalyticsSection({
  token,
  slug,
  period,
  from,
  to,
}: {
  token: string;
  slug: string;
  period?: string;
  from?: string;
  to?: string;
}) {
  let chartsData = { registrations: [], gender: {} };

  try {
    const rawStats = await getEventDetailedStats(token, slug, { period, from, to });
    if (rawStats) {
      chartsData = {
        registrations: rawStats.registrations || [],
        gender: rawStats.gender || {},
      };
    }
  } catch (error) {
    console.error(`Failed to fetch Event detailed analytics:`, error);
  }

  return (
    <MotionContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <MotionItem>
        <RegistrationLineChart data={chartsData.registrations} />
      </MotionItem>
      <MotionItem>
        <GenderDiversityChart data={chartsData.gender} />
      </MotionItem>
    </MotionContainer>
  );
}
