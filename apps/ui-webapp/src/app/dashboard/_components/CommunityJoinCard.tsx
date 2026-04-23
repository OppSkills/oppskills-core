"use client";

import Image from "next/image";

export function CommunityJoinCard() {
  return (
    <div className="w-full bg-white rounded-3xl p-5 lg:p-6 border-2 border-neutral-300 flex flex-col min-h-[400px] shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary-400 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Community</h2>
      </div>

      <div className="flex-1 relative w-full rounded-2xl overflow-hidden bg-neutral-50/50">
        <Image
          src="/illustrations/community_placeholder.png"
          alt="Join our community"
          fill
          className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>

      {/* Decorative backdrop to match the style */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-neutral-50/10 pointer-events-none" />
    </div>
  );
}
