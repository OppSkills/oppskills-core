"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="w-full my-8 overflow-x-auto">
      <div className="flex items-center gap-5 min-w-max">
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab;
          return (
            <Badge key={i} variant="outline" onClick={() => handleTabClick(tab)} className="px-3 py-2 cursor-pointer text-base font-medium">{tab}</Badge>
          );
        })}
      </div>
    </div>
  );


}
