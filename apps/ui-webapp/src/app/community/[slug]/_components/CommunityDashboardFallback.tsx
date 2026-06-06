"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityDashboardFallback() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 select-none animate-pulse">
      <div className="w-full flex flex-col gap-6">
          {/* Header Card Skeleton */}
          <div className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-2xs">
            {/* Banner block */}
            <Skeleton className="w-full h-44 sm:h-56 bg-neutral-200" />

            {/* Inner details row */}
            <div className="relative px-6 pb-6 pt-16 sm:pt-20">
              {/* Logo block */}
              <div className="absolute left-6 top-[-48px] sm:top-[-64px] w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                <Skeleton className="w-full h-full rounded-2xl bg-neutral-200" />
              </div>

              {/* Title & Stats details block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-40 rounded-lg bg-neutral-200" />
                  <Skeleton className="h-4 w-24 rounded-md bg-neutral-200" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-24 rounded-full bg-neutral-200" />
                  <Skeleton className="h-8 w-32 rounded-full bg-neutral-200" />
                </div>
              </div>

              {/* Description line */}
              <Skeleton className="h-4 w-full max-w-xl rounded-md bg-neutral-200 mt-5" />
              <Skeleton className="h-4 w-2/3 max-w-md rounded-md bg-neutral-200 mt-2.5" />
            </div>
          </div>

          {/* About Section Card Skeleton */}
          <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
            <Skeleton className="h-6 w-20 rounded-md bg-neutral-200 border-b pb-2" />
            <Skeleton className="h-4 w-full rounded-md bg-neutral-200" />
            <div className="flex flex-col gap-3 pl-2 mt-2">
              <div className="flex gap-3 items-center">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-neutral-200 shrink-0" />
                <Skeleton className="h-4 w-[85%] rounded-md bg-neutral-200" />
              </div>
              <div className="flex gap-3 items-center">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-neutral-200 shrink-0" />
                <Skeleton className="h-4 w-[75%] rounded-md bg-neutral-200" />
              </div>
              <div className="flex gap-3 items-center">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-neutral-200 shrink-0" />
                <Skeleton className="h-4 w-[80%] rounded-md bg-neutral-200" />
              </div>
            </div>
            <Skeleton className="h-4 w-[90%] rounded-md bg-neutral-200 mt-2" />
          </div>

          {/* Feed Title Skeleton */}
          <div className="flex flex-col gap-4 mt-2">
            <Skeleton className="h-6 w-32 rounded-md bg-neutral-200" />

            {/* Post 1 Skeleton */}
            <div className="w-full bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
              <div className="flex gap-3 items-center">
                <Skeleton className="w-12 h-12 rounded-full bg-neutral-200" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-28 rounded-md bg-neutral-200" />
                  <Skeleton className="h-3 w-40 rounded-sm bg-neutral-200" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded-md bg-neutral-200 mt-1" />
              <Skeleton className="h-4 w-5/6 rounded-md bg-neutral-200" />
              <Skeleton className="w-full h-56 rounded-2xl bg-neutral-200 mt-2" />
            </div>
          </div>
      </div>
    </div>
  );
}
