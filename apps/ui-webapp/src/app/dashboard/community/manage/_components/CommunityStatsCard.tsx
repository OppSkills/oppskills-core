"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CommunityStatsCardProps {
  title: string;
  value: string | number;
  badgeText: string;
  badgeValue: string | number;
  theme?: "dark" | "light";
  className?: string;
}

export default function CommunityStatsCard({
  title,
  value,
  badgeText,
  badgeValue,
  theme = "light",
  className,
}: CommunityStatsCardProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "rounded-3xl p-6 border flex flex-col justify-between h-[180px] transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-1 shadow-xs hover:shadow-md",
        isDark
          ? "bg-[radial-gradient(circle_at_top_left,var(--color-primary-700)_0%,var(--color-primary-900)_70%)] border-primary-800 text-white"
          : "bg-[#F3EEFF] border-primary-200/40 text-neutral-900 hover:bg-[#EBDDFF]",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <span
          className={cn(
            "text-sm font-semibold tracking-wide",
            isDark ? "text-primary-200" : "text-[#423072]"
          )}
        >
          {title}
        </span>
        <span className="font-aeonicPro text-4xl lg:text-5xl font-medium tracking-tight mt-1">
          {value}
        </span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <span
          className={cn(
            "text-xs",
            isDark ? "text-primary-100" : "text-primary-700"
          )}
        >
          {badgeText}
        </span>
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold font-sans tracking-wide min-w-fit shadow-xs",
            isDark
              ? "bg-[#181127] border border-primary-700/50 text-primary-200"
              : "bg-[#271B40] text-white"
          )}
        >
          {badgeValue}
        </div>
      </div>
    </div>
  );
}
