"use client";

import { Loader2 } from "lucide-react";

export default function ChatsPageLoading() {
  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-[480px] w-full bg-neutral-50">
      <aside className="hidden md:flex w-[340px] shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="h-16 border-b border-neutral-200 px-4 flex items-center">
          <div className="h-9 w-32 rounded-full bg-neutral-200 animate-pulse" />
        </div>
        <div className="flex-1 overflow-hidden p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-neutral-200 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-neutral-200 rounded-md w-1/3" />
                <div className="h-3 bg-neutral-200 rounded-md w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </main>
    </div>
  );
}
