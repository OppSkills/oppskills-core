import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Suspense } from "react";
import { Clock1, Loader2 } from "lucide-react";

import { currentUser, auth } from "@clerk/nextjs/server";
import { getHackathonGeneralStats, getHackathonDetailedStats } from "@/lib/api/analyticsApi";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
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
  impressions: number;
  views: number;
};

// Async component for Analytics
async function AnalyticsSection({
  token,
  slug,
}: {
  token: string;
  slug: string;
}) {
  let stats: InternalStats = { registrations: 0, impressions: 0, views: 0 };

  try {
    const rawStats = await getHackathonGeneralStats(token, slug);
    if (rawStats) {
      stats = {
        registrations: Number(rawStats.registrations) || 0,
        impressions: Number(rawStats.impressions) || 0,
        views: Number(rawStats.views) || 0,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch Hackathon analytics:`, error);
  }

  const { registrations: completedRegistrations, impressions, views } = stats;

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
      value: completedRegistrations.toString(),
      badge: "Total Registrations",
      badgeValue: completedRegistrations.toString(),
    },
    {
      type: "normal",
      title: "Total Impressions",
      value: impressions.toLocaleString(),
      badge: "All Time",
      badgeValue: "",
    },
    {
      type: "normal",
      title: "Total Views",
      value: views.toLocaleString(),
      badge: "All Time",
      badgeValue: "",
    },
    {
      type: "normal",
      title: "CTR Ratio",
      value: (ctrRatio * 100).toFixed(1) + "%",
      badge: ctrBadge,
      badgeValue: "",
    },
  ];

  return (
    <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 justify-between">
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
    </MotionContainer>
  );
}

// Async component for Detailed Analytics (Charts)
async function DetailedAnalyticsSection({
  token,
  slug,
}: {
  token: string;
  slug: string;
}) {
  let chartsData = { registrations: [], gender: {} };

  try {
    const rawStats = await getHackathonDetailedStats(token, slug);
    if (rawStats) {
      chartsData = {
        registrations: rawStats.registrations || [],
        gender: rawStats.gender || {},
      };
    }
  } catch (error) {
    console.error(`Failed to fetch Hackathon detailed analytics:`, error);
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

// Helper to fetch details
async function getHackathonName(
  token: string,
  slug: string
): Promise<string> {
  try {
    const hackathon = (await getHackathonBySlug(token, slug)) as {
      name: string;
    };
    return hackathon?.name || "Unknown Hackathon";
  } catch (e) {
    return "Unknown Hackathon";
  }
}

export default async function OpportunityDashboard(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;
  const user = await currentUser();
  const { getToken } = await auth();
  const token = (await getToken()) || "";

  // Fetch details (Name)
  const name = await getHackathonName(token, slug);

  return (
    <div className="flex justify-center w-full bg-neutral-200">
      <div className="w-full bg-background p-4 sm:p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left">
            <h1 className="font-semibold text-[24px] md:text-[28px] break-words">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm md:text-[16px] text-muted-foreground pt-1 md:pt-2">
              View all the details for {name}
            </p>
          </div>
          <div className="right self-end md:self-auto">
            <Button className="rounded-full">
              <Image
                src="/icons/share.svg"
                alt="Share"
                width={16}
                height={16}
              />{" "}
              Share
            </Button>
          </div>
        </div>

        {/* Analytics Section with Loader */}
        <Suspense fallback={<AnalyticsLoader />}>
          <AnalyticsSection token={token} slug={slug} />
        </Suspense>

        {/* CHARTS */}
        <Suspense fallback={<AnalyticsLoader />}>
          <DetailedAnalyticsSection token={token} slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}

