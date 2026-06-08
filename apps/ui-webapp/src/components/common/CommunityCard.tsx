import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, normalizeUrl } from "@/lib/utils";
import { formatCount } from "@/lib/tools";
import { Users } from "lucide-react";

export interface CommunityCardProps {
  href: string;
  title: string;
  genre: string; // e.g. industry / category
  memberCount: number;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
}

export function CommunityCard({
  href,
  title,
  genre,
  memberCount,
  bannerUrl,
  avatarUrl,
}: CommunityCardProps) {
  return (
    <Link href={href} prefetch={false} className="h-full block">
      <div
        className={cn(
          "group h-[280px] flex flex-col overflow-hidden border border-neutral-200/50 bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl relative"
        )}
      >
        {/* Banner Area */}
        <div className="relative h-[110px] w-full overflow-hidden shrink-0 bg-muted">
          {bannerUrl ? (
            <Image
              src={normalizeUrl(bannerUrl)}
              alt={`${title} banner`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            // Modern, minimal, and premium abstract dark gradient background
            <div className="w-full h-full bg-gradient-to-tr from-[#1E1233] via-[#2A1B4E] to-[#4A328C]">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,var(--color-primary-400)_0%,transparent_60%)]" />
            </div>
          )}
        </div>

        {/* Floating Logo Area overlapping banner and content */}
        <div className="absolute top-[80px] left-5 z-20">
          <div className="w-14 h-14 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={normalizeUrl(avatarUrl)}
                  alt={`${title} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#835BD5] to-[#423072] flex items-center justify-center font-bold text-white text-lg">
                {title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-9 px-5 pb-5 flex flex-col flex-1 justify-between select-none">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-aeonicPro text-lg font-bold text-neutral-800 tracking-tight leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
              {title}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#835BD5] bg-[#F3EEFF] px-2.5 py-1 rounded-md max-w-fit border border-[#835BD5]/10">
              {genre}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-500 font-medium text-xs mt-auto pt-3 border-t border-neutral-100/60">
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-700 font-bold">{formatCount(memberCount)}</span>
            <span>Members</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
