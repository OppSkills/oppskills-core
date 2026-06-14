import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, normalizeUrl } from "@/lib/utils";
import { formatCount } from "@/lib/tools";
import { Users, Crown } from "lucide-react";

export interface CommunityCardProps {
  href: string;
  title: string;
  genre: string; // e.g. industry / category
  memberCount: number;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  roleBadge?: "OWNER" | "ADMIN" | "MODERATOR" | "READ_ONLY" | "FOLLOWER";
}

export function CommunityCard({
  href,
  title,
  genre,
  memberCount,
  bannerUrl,
  avatarUrl,
  roleBadge,
}: CommunityCardProps) {
  return (
    <Link href={href} prefetch={false} className="h-full block">
      <div
        className={cn(
          "group h-70 flex flex-col overflow-hidden border border-neutral-200/50 bg-white hover:shadow-md transition-all duration-300 rounded-3xl relative",
        )}
      >
        {/* Role Badge Overlay */}
        {roleBadge && (
          <div className="absolute top-3 left-3 z-30 select-none">
            {roleBadge === "OWNER" && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full shadow-sm">
                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                Owner
              </span>
            )}
            {roleBadge === "ADMIN" && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-300 px-2.5 py-1 rounded-full shadow-sm">
                Admin
              </span>
            )}
            {roleBadge === "MODERATOR" && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full shadow-sm">
                Moderator
              </span>
            )}
            {roleBadge === "READ_ONLY" && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-full shadow-sm">
                Read Only
              </span>
            )}
            {roleBadge === "FOLLOWER" && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-50 border border-neutral-300 px-2.5 py-1 rounded-full shadow-sm">
                Follower
              </span>
            )}
          </div>
        )}

        {/* Banner Area */}
        <div className="relative h-27.5 w-full overflow-hidden shrink-0 bg-muted">
          <Image
            src={normalizeUrl(
              bannerUrl ||
              "/illustrations/community/community_banner_placeholder.png",
            )}
            alt={`${title} banner`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 370px"
          />
        </div>

        {/* Floating Logo Area overlapping banner and content */}
        <div className="absolute top-20 left-5 z-20">
          <div className="w-14 h-14 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={normalizeUrl(avatarUrl)}
                  alt={`${title} logo`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-neutral-100 text-lg">
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
            <span className="text-neutral-700 font-bold">
              {formatCount(memberCount)}
            </span>
            <span>Members</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
