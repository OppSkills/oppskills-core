"use client";

import { useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/app/dashboard/_components/ShareButton";

const ALL_TABS = [
  { id: "rounds", label: "Rounds & Status" },
  { id: "details", label: "Details" },
  { id: "attachments", label: "Attachments" },
  { id: "prizes", label: "Prizes" },
  { id: "location", label: "Location" },
];

interface CompetitionTabsProps {
  setCurTab: (tab: string) => void;
  hasRounds?: boolean;
  hasPrizes?: boolean;
  hasAttachments?: boolean;
  hasLocation?: boolean;
  title?: string;
  slug?: string;
}

export function CompetitionTabs({
  setCurTab,
  hasRounds = true,
  hasPrizes = true,
  hasAttachments = false,
  hasLocation = false,
  title,
  slug,
}: CompetitionTabsProps) {
  // Filter out tabs based on available content
  const tabs = useMemo(() => {
    return ALL_TABS.filter((tab) => {
      if (tab.id === "rounds" && !hasRounds) return false;
      if (tab.id === "prizes" && !hasPrizes) return false;
      if (tab.id === "attachments" && !hasAttachments) return false;
      if (tab.id === "location" && !hasLocation) return false;
      return true;
    });
  }, [hasRounds, hasPrizes, hasAttachments, hasLocation]);

  const defaultTab = hasRounds ? "rounds" : "details";

  const [activeTab, setActiveTab] = useQueryState("activeTab", {
    defaultValue: defaultTab,
  });

  useEffect(() => {
    setCurTab(activeTab);
  }, [activeTab]);

  return (
    <div className="border-b border-neutral-200 mb-8 sticky top-0 bg-background z-10 pt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-8 overflow-x-auto min-w-max scrollbar-hide py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm sm:text-base font-semibold transition-colors relative",
                  isActive
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {title && slug && (
          <div className="flex-shrink-0 pb-3">
            <ShareButton title={title} slug={slug} type="hackathon" minimal />
          </div>
        )}
      </div>
    </div>
  );
}
