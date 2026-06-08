"use client";

import React from "react";
import CommunityStatsCard from "./CommunityStatsCard";
import CommunityActionCard from "./CommunityActionCard";
import type { CommunityStatsResponse } from "@/lib/api/communityApi";

interface CommunityStatsProps {
  onManageMeets?: () => void;
  onManageTasks?: () => void;
  stats?: CommunityStatsResponse | null;
  isLoading?: boolean;
  isError?: boolean;
}

export default function CommunityStats({
  onManageMeets,
  onManageTasks,
  stats,
  isLoading = false,
  isError = false,
}: CommunityStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[180px] rounded-3xl border bg-[#F3EEFF]/40 border-primary-200/20 p-6 flex flex-col justify-between animate-pulse"
          >
            <div className="flex flex-col gap-2">
              <div className="h-4 w-28 bg-[#423072]/10 rounded-full" />
              <div className="h-10 w-20 bg-[#423072]/15 rounded-md mt-1" />
            </div>
            <div className="flex justify-between items-center mt-auto pt-2">
              <div className="h-3 w-32 bg-[#423072]/10 rounded-full" />
              <div className="h-5 w-12 bg-[#423072]/20 rounded-full" />
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-4 justify-between h-[180px] sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <div className="h-[82px] rounded-3xl bg-[#F3EEFF]/40 border border-primary-200/20 animate-pulse" />
          <div className="h-[82px] rounded-3xl bg-[#F3EEFF]/40 border border-primary-200/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-3xl p-6 border border-red-200/50 bg-red-50/40 text-red-900 flex flex-col justify-center items-center h-[180px] text-center gap-2">
          <span className="font-semibold text-sm">
            Failed to load statistics
          </span>
          <span className="text-xs text-red-700/80">
            Please check your connection and try again.
          </span>
        </div>
        <div className="flex flex-col gap-4 justify-between h-[180px] sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <CommunityActionCard
            title="Manage Meets"
            icon="meet"
            onClick={onManageMeets}
          />
          <CommunityActionCard
            title="Manage Tasks"
            icon="task"
            onClick={onManageTasks}
          />
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Members",
      value: (stats?.totalMembers ?? 0).toLocaleString(),
      badgeText: "Joined last 30 days",
      badgeValue: (stats?.newMembers30Days ?? 0).toLocaleString(),
      theme: "dark" as const,
    },
    {
      title: "Page Impressions",
      value: (stats?.pageImpressions ?? 0).toLocaleString(),
      badgeText: "Views",
      badgeValue: (stats?.pageImpressions ?? 0).toLocaleString(),
      theme: "light" as const,
    },
    {
      title: "Post Impressions",
      value: (stats?.postImpressions ?? 0).toLocaleString(),
      badgeText: "Post Views",
      badgeValue: (stats?.postViews ?? 0).toLocaleString(),
      theme: "light" as const,
    },
    {
      title: "Admins / Moderators",
      value: (stats?.adminCount ?? 0).toLocaleString(),
      badgeText: "Moderators",
      badgeValue: (stats?.moderatorCount ?? 0).toLocaleString(),
      theme: "light" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
      {statsData.map((stat, index) => (
        <CommunityStatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          badgeText={stat.badgeText}
          badgeValue={stat.badgeValue}
          theme={stat.theme}
        />
      ))}
      <div className="flex flex-col gap-4 justify-between h-[180px] sm:col-span-2 lg:col-span-1 xl:col-span-1">
        <CommunityActionCard
          title="Manage Meets"
          icon="meet"
          onClick={onManageMeets}
        />
        <CommunityActionCard
          title="Manage Tasks"
          icon="task"
          onClick={onManageTasks}
        />
      </div>
    </div>
  );
}
