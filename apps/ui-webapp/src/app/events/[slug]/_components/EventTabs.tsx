"use client";

import { cn } from "@/lib/utils";

interface EventTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function EventTabs({ tabs, activeTab, onTabChange }: EventTabsProps) {
  const handleTabClick = (tab: string) => {
    onTabChange(tab);

    const baseId = tab.toLowerCase().replace(/ /g, "-");
    let element = document.getElementById(baseId);

    // If the base element is not found or is hidden, try to find a visible responsive alternative
    if (!element || element.offsetParent === null) {
      const desktopElement = document.getElementById(`${baseId}-desktop`);
      const mobileElement = document.getElementById(`${baseId}-mobile`);

      if (desktopElement && desktopElement.offsetParent !== null) {
        element = desktopElement;
      } else if (mobileElement && mobileElement.offsetParent !== null) {
        element = mobileElement;
      }
    }

    if (element) {
      // Use setTimeout to allow any potential state updates or layout shifts to settle
      setTimeout(() => {
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="border-b border-neutral-200  mb-8 overflow-x-auto sticky top-0 bg-background z-10 pt-4">
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
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-neutral-500 hover:text-neutral-800  "
              )}
            >
              {tab}
            </button>);
        })}
      </div>
    </div>
  );


}
