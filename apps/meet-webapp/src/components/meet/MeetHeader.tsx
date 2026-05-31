"use client";

import React from "react";
import { Grid3X3, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LayoutMode = "grid" | "spotlight";

interface MeetHeaderProps {
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  elapsedSeconds: number;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function MeetHeader({
  layoutMode,
  onLayoutChange,
  elapsedSeconds,
}: MeetHeaderProps) {
  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-[#0c0114]/90 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight">
          opp<span className="text-[#835BD5]">skills</span>
        </span>
      </div>

      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
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
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm font-mono text-white/80">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {formatElapsed(elapsedSeconds)}
      </div>
    </header>
  );
}
