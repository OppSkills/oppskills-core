"use client";

import React, { useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const ALL_TABS = [
  { id: "rounds", label: "Rounds & Status" },
  { id: "details", label: "Details" },
  { id: "attachments", label: "Attachments" },
  { id: "prizes", label: "Prizes" },
];

interface CompetitionTabsProps {
  setCurTab: (tab: string) => void;
  hasRounds?: boolean;
  hasPrizes?: boolean;
  hasAttachments?: boolean;
}

export function CompetitionTabs({
  setCurTab,
  hasRounds = true,
  hasPrizes = true,
  hasAttachments = false,
}: CompetitionTabsProps) {
  // Filter out tabs based on available content
  const tabs = useMemo(() => {
    return ALL_TABS.filter((tab) => {
      if (tab.id === "rounds" && !hasRounds) return false;
      if (tab.id === "prizes" && !hasPrizes) return false;
      if (tab.id === "attachments" && !hasAttachments) return false;
      return true;
    });
  }, [hasRounds, hasPrizes, hasAttachments]);

  const defaultTab = hasRounds ? "rounds" : "details";

  const [activeTab, setActiveTab] = useQueryState("activeTab", {
    defaultValue: defaultTab,
  });

  useEffect(() => {
    setCurTab(activeTab);
  }, [activeTab]);

  return (
    <div className="border-b border-neutral-200 mb-8 overflow-x-auto sticky top-0 bg-background z-10 pt-4">
      <div className="flex gap-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-base font-semibold transition-colors relative",
                isActive
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
