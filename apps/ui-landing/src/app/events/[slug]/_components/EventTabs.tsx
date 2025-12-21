"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface EventTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function EventTabs({ tabs, activeTab, onTabChange }: EventTabsProps) {
  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    const element = document.getElementById(
      tab.toLowerCase().replace(/ /g, "-")
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto sticky top-0 bg-background z-10 pt-4">
      <div className="flex gap-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "pb-3 text-[16px] font-semibold transition-colors relative",
                isActive
                  ? "text-[#9C00E5] border-b-2 border-[#9C00E5]"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
