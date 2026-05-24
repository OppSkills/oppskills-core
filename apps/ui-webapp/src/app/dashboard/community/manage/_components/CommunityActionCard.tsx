"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CommunityActionCardProps {
  title: string;
  icon: "meet" | "task";
  onClick?: () => void;
  className?: string;
}

export default function CommunityActionCard({
  title,
  icon,
  onClick,
  className,
}: CommunityActionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 h-[82px] rounded-2xl bg-[radial-gradient(circle_at_top_left,var(--color-primary-800)_0%,var(--color-primary-900)_85%)] hover:bg-[radial-gradient(circle_at_top_left,var(--color-primary-700)_0%,var(--color-primary-800)_85%)] border border-[#271B40]/20 text-white transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-0.5 shadow-md active:scale-98 select-none group",
        className
      )}
    >
      <span className="font-aeonicPro text-lg font-medium tracking-wide pl-2 group-hover:text-primary-100 transition-colors">
        {title}
      </span>

      <div className="text-primary-200/70 group-hover:text-white group-hover:scale-105 transition-all duration-300 pr-1">
        {icon === "meet" ? (
          <svg
            className="w-11 h-11"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Elegant camera wireframe */}
            <rect x="6" y="12" width="24" height="24" rx="4" />
            <path d="M30 18L40 12V36L30 30" />
            <path d="M12 20H20" strokeDasharray="2 2" />
            <path d="M12 26H24" strokeDasharray="2 2" />
          </svg>
        ) : (
          <svg
            className="w-11 h-11"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Elegant tasks checklist wireframe */}
            <rect x="8" y="8" width="32" height="32" rx="6" />
            <path d="M16 18L20 22L28 14" />
            <path d="M16 30L20 34L28 26" />
            <line x1="32" y1="20" x2="32" y2="20.01" />
            <line x1="32" y1="32" x2="32" y2="32.01" />
          </svg>
        )}
      </div>
    </div>
  );
}
