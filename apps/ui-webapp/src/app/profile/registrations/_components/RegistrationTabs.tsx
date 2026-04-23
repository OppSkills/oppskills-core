"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    events: number;
    competitions: number;
  };
}

export function RegistrationTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  counts,
}: RegistrationTabsProps) {
  const tabs = [
    { id: "all", label: `All(${counts.all})` },
    { id: "event", label: `Events(${counts.events})` },
    { id: "hackathon", label: `Competitions(${counts.competitions})` },
  ];

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
      {/* Tabs */}
      <div className="flex items-center gap-8 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "text-base font-medium transition-all relative pb-2 whitespace-nowrap xl:min-w-30 text-left",
              activeTab === tab.id
                ? "text-primary-600"
                : "text-neutral-700 hover:text-neutral-900"
            )}
          >
            {tab.label}
            <div className={cn("absolute bottom-0 left-0 w-full h-[1.5px] rounded-full", activeTab === tab.id ? "bg-primary-600" : "bg-neutral-400")} />

          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full md:w-60">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-[#E0E0E6] rounded-full px-6 py-3 pr-12 text-[#4A4A5A] placeholder:text-[#9E9EAE] outline-none focus:border-[#6B4EAB] transition-colors shadow-sm"
        />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9E9EAE]" />
      </div>
    </div>
  );
}
