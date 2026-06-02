"use client";

import React from "react";
import CommunityStatsCard from "./CommunityStatsCard";
import CommunityActionCard from "./CommunityActionCard";

interface CommunityStatsProps {
  onManageMeets?: () => void;
  onManageTasks?: () => void;
  totalSize?: number;
  coreTeamCount?: number;
}

export default function CommunityStats({
  onManageMeets,
  onManageTasks,
  totalSize = 12300,
  coreTeamCount = 12,
}: CommunityStatsProps) {
  const statsData = [
    {
      title: "Total Community Size",
      value: totalSize.toLocaleString(),
      badgeText: "Registered last month",
      badgeValue: "1,200",
      theme: "dark" as const,
    },
    {
      title: "Page Impressions",
      value: "90",
      badgeText: "Registered last month",
      badgeValue: "10",
      theme: "light" as const,
    },
    {
      title: "Post Impressions",
      value: "12",
      badgeText: "Newly launched",
      badgeValue: "4",
      theme: "light" as const,
    },
    {
      title: "Core Team Members",
      value: coreTeamCount.toLocaleString(),
      badgeText: "Last 12 months",
      badgeValue: "4",
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
