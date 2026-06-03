"use client";

import React from "react";
import { Grid3X3, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type LayoutMode = "grid" | "spotlight";

interface MeetHeaderProps {
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
}

export default function MeetHeader({
  layoutMode,
  onLayoutChange,
}: MeetHeaderProps) {
  return (
    <header className="relative h-14 shrink-0 border-b border-white/10 bg-[#0c0114]/90 px-4 flex items-center">
      <div className="flex items-center gap-2 shrink-0">
        <Image src="/logo.svg" alt="OppSkills" width={200} height={50} />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/5 rounded-xl p-1">
        <button
          type="button"
          onClick={() => onLayoutChange("grid")}
          className={cn(
            "p-2 rounded-lg transition-colors",
            layoutMode === "grid"
              ? "bg-[#835BD5] text-white"
              : "text-white/60 hover:text-white",
          )}
          title="Grid view"
          aria-label="Grid view"
          aria-pressed={layoutMode === "grid"}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange("spotlight")}
          className={cn(
            "p-2 rounded-lg transition-colors",
            layoutMode === "spotlight"
              ? "bg-[#835BD5] text-white"
              : "text-white/60 hover:text-white",
          )}
          title="Spotlight view"
          aria-label="Spotlight view"
          aria-pressed={layoutMode === "spotlight"}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
