"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MAX_PAGE_DOTS } from "@/lib/meet/gridLayout";

interface StagePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}

export default function StagePagination({
  page,
  totalPages,
  onPageChange,
  label,
}: StagePaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(page, totalPages - 1);
  const useDots = totalPages <= MAX_PAGE_DOTS;

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3 py-1 shrink-0"
      role="navigation"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, safePage - 1))}
        disabled={safePage === 0}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center justify-center"
        aria-label={`Previous ${label}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {useDots ? (
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onPageChange(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === safePage ? "bg-[#835BD5]" : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`${label}, page ${index + 1} of ${totalPages}`}
              aria-current={index === safePage ? "page" : undefined}
            />
          ))}
        </div>
      ) : (
        <span className="text-xs font-medium text-white/70 tabular-nums min-w-18 text-center">
          {safePage + 1} / {totalPages}
        </span>
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
        disabled={safePage >= totalPages - 1}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center justify-center"
        aria-label={`Next ${label}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
