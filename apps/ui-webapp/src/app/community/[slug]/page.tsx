"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import CommunityDashboardFallback from "./_components/CommunityDashboardFallback";
import CommunityDashboard from "./_components/CommunityDashboard";

export default function CommunityProfilePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [slug]);

  if (!slug) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-neutral-600 font-medium">Invalid community URL.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7]/40 flex flex-col justify-start items-center">
      <BoneyardSkeleton
        loading={isLoading}
        name="community-dashboard-root"
        className="w-full"
        fallback={<CommunityDashboardFallback />}
      >
        <CommunityDashboard handle={slug} />
      </BoneyardSkeleton>
    </div>
  );
}
