"use client";

import React from "react";
import { useParams } from "next/navigation";
import CommunityDashboard from "./_components/CommunityDashboard";

export default function CommunityProfilePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  if (!slug) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-neutral-600 font-medium">Invalid community URL.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7]/40 flex flex-col justify-start items-center">
      <CommunityDashboard handle={slug} />
    </div>
  );
}
