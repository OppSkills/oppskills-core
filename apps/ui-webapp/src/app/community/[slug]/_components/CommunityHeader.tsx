"use client";

import React from "react";
import Image from "next/image";
import { Check, Edit2, Loader2, Plus, UserPlus, UserMinus } from "lucide-react";
import { CommunityDetails } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface CommunityHeaderProps {
  details: CommunityDetails;
  canManage?: boolean;
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
  onCreatePost?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onViewMembers?: () => void;
  isCoverUploading?: boolean;
  isAvatarUploading?: boolean;
}

export default function CommunityHeader({
  details,
  canManage = false,
  isFollowing = false,
  isFollowLoading = false,
  onEditCover,
  onEditAvatar,
  onCreatePost,
  onFollow,
  onUnfollow,
  onViewMembers,
  isCoverUploading = false,
  isAvatarUploading = false,
}: CommunityHeaderProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}k`;
    }
    return count.toString();
  };

  return (
    <div className="w-full bg-white sm:rounded-3xl sm:border border-neutral-200 overflow-hidden shadow-xs relative">
      <div className="relative w-full h-44 sm:h-56 bg-gradient-to-r from-[#FDFBF7] to-[#F5F2EB] flex items-center justify-center overflow-hidden border-b border-neutral-100 group">
        <Image
          src={
            details.bannerUrl ||
            "/illustrations/community/community_banner_placeholder.png"
          }
          alt="Community Banner"
          fill
          className={cn("object-cover", isCoverUploading && "opacity-50")}
        />

        {isCoverUploading && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full shadow-lg text-[#5D3EBB] text-xs font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#5D3EBB]" />
              <span>Updating banner...</span>
            </div>
          </div>
        )}

        {canManage && onEditCover && (
          <button
            onClick={onEditCover}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white text-neutral-700 p-2 rounded-full shadow-md hover:scale-105 transition-all sm:opacity-0 sm:group-hover:opacity-100 duration-300 z-20"
            title="Edit cover image"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative px-6 pb-6 pt-16 sm:pt-20">
        <div className="absolute left-6 top-[-48px] sm:top-[-64px] group/avatar z-10">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl border-4 border-white shadow-md flex items-center justify-center overflow-hidden select-none">
            {details.logoUrl ? (
              <Image
                src={details.logoUrl}
                alt="Community Logo"
                fill
                className={cn(
                  "object-cover",
                  isAvatarUploading && "opacity-45",
                )}
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 text-white font-bold font-serif text-3xl sm:text-4xl flex items-center justify-center">
                {details.name.charAt(0).toUpperCase()}
              </div>
            )}

            {isAvatarUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          {canManage && onEditAvatar && (
            <button
              onClick={onEditAvatar}
              className="absolute bottom-1 right-1 bg-white/90 hover:bg-white text-neutral-700 p-1.5 rounded-full shadow-md hover:scale-105 transition-all sm:opacity-0 sm:group-hover/avatar:opacity-100 duration-300"
              title="Edit community photo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-neutral-800 tracking-tight">
                {details.name}
              </h2>
              {details.isVerified && (
                <span
                  className="inline-flex items-center justify-center bg-[#10B981] text-white rounded-full p-0.5 w-4 h-4 shadow-sm"
                  title="Verified Community"
                >
                  <Check className="w-2.5 h-2.5 stroke-[4]" />
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-neutral-400">
              @{details.handle}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-center">
            <div className="flex items-center gap-4 text-sm font-bold text-neutral-600">
              <button
                type="button"
                onClick={onViewMembers}
                className="flex items-center gap-1 hover:text-[#5D3EBB] hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
                title="View community members"
              >
                <span className="text-neutral-800 font-extrabold">
                  {formatFollowers(details.followers)}
                </span>{" "}
                Members
              </button>
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-[#5D3EBB] hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer">
                    <span className="text-neutral-800 font-extrabold">
                      {details.following}
                    </span>{" "}
                    Posts
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 bg-white border border-neutral-200 shadow-md rounded-xl p-1.5 z-50"
                >
                  <DropdownMenuItem className="flex justify-between items-center px-3 py-2 text-xs font-semibold text-neutral-700 rounded-lg hover:bg-neutral-50 focus:bg-neutral-50 transition-colors outline-none cursor-default select-none">
                    <span>Original Posts</span>
                    <span className="font-extrabold text-neutral-900">
                      {details.following}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between items-center px-3 py-2 text-xs font-semibold text-neutral-700 rounded-lg hover:bg-neutral-50 focus:bg-neutral-50 transition-colors outline-none cursor-default select-none">
                    <span>Reposts</span>
                    <span className="font-extrabold text-neutral-900">
                      {details.reposts}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {canManage && onCreatePost ? (
              <Button
                onClick={onCreatePost}
                className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center gap-1.5 text-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Create New Post
              </Button>
            ) : isFollowing ? (
              <Button
                onClick={onUnfollow}
                disabled={isFollowLoading}
                variant="outline"
                className={cn(
                  "font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 text-sm shrink-0 border-neutral-300",
                  isFollowLoading && "opacity-70",
                )}
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4" />
                )}
                Following
              </Button>
            ) : (
              <Button
                onClick={onFollow}
                disabled={isFollowLoading}
                className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center gap-1.5 text-sm shrink-0"
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Follow
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
