"use client";

import React from "react";
import { ThumbsUp, MessageCircle, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostEngagementBarProps {
  postId: string;
  likes: number;
  commentsCount: number;
  reposts: number;
  isLiked?: boolean;
  isReposted?: boolean;
  onLike: () => void;
  onComment?: () => void;
  onRepost?: () => void;
}

export default function PostEngagementBar({
  likes,
  commentsCount,
  reposts,
  isLiked,
  isReposted,
  onLike,
  onComment,
  onRepost,
}: PostEngagementBarProps) {
  return (
    <div className="flex items-center border-t border-neutral-100 pt-3 select-none gap-1">
      {/* Like */}
      <button
        type="button"
        onClick={onLike}
        className={cn(
          "flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-90 px-2 sm:px-3 py-1.5 rounded-full flex-1 justify-center",
          isLiked
            ? "text-[#5D3EBB] bg-[#E6E0FA]/40 shadow-xs"
            : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
        )}
      >
        <ThumbsUp className={cn("w-4 h-4 shrink-0", isLiked ? "fill-[#5D3EBB]" : "")} />
        <span className="hidden sm:inline">Like</span>
        <span className="text-xs font-semibold">({likes})</span>
      </button>

      {/* Comment */}
      <button
        type="button"
        onClick={onComment}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-2 sm:px-3 py-1.5 rounded-full transition-all flex-1 justify-center"
      >
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Comment</span>
        <span className="text-xs font-semibold">({commentsCount})</span>
      </button>

      {/* Repost */}
      <button
        type="button"
        onClick={onRepost}
        className={cn(
          "flex items-center gap-1.5 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1.5 rounded-full active:scale-95 transition-all flex-1 justify-center",
          isReposted
            ? "text-[#5D3EBB] bg-[#E6E0FA]/40"
            : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
        )}
      >
        <Repeat2 className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Repost</span>
        <span className="text-xs font-semibold">({reposts})</span>
      </button>
    </div>
  );
}
