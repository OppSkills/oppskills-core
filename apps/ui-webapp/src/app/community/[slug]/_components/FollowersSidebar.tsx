"use client";

import React from "react";
import Image from "next/image";
import { Follower } from "./types";

interface FollowersSidebarProps {
  followers: Follower[];
}

export default function FollowersSidebar({ followers }: FollowersSidebarProps) {
  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col gap-6 shadow-xs select-none sticky top-8">
      <h3 className="text-xl font-extrabold text-neutral-800 tracking-tight border-b border-neutral-100 pb-3">
        Recent Followers
      </h3>

      <div className="flex flex-col gap-4">
        {followers.map((follower) => (
          <div
            key={follower.id}
            className="flex items-center gap-3 bg-neutral-50/50 hover:bg-neutral-50 p-3 rounded-2xl border border-neutral-100/60 hover:border-neutral-200/80 transition-all duration-300 group cursor-pointer"
          >
            {/* Follower Avatar */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-200 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src={follower.avatar}
                alt={follower.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Follower Stats info */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-neutral-800 text-sm truncate group-hover:text-[#5D3EBB] transition-colors">
                {follower.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                <span>{follower.followersCount} Followers</span>
                <span className="text-neutral-300">•</span>
                <span>{follower.timeframe}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
