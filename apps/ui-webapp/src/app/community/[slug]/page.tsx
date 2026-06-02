"use client";

import React, { useState, useEffect } from "react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import CommunityDashboardFallback from "./_components/CommunityDashboardFallback";
import CommunityDashboard from "./_components/CommunityDashboard";

export default function ManageCommunityPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data fetching latency
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7]/40 flex flex-col justify-start items-center">
      <BoneyardSkeleton
        loading={isLoading}
        name="community-dashboard-root"
        className="w-full"
        fallback={<CommunityDashboardFallback />}
      >
        <CommunityDashboard />
      </BoneyardSkeleton>
    </div>
  );
}
