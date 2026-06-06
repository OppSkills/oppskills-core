"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThumbsUp, MessageCircle, Repeat2, Share2 } from "lucide-react";
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
  onShare: () => void;
  commentHref?: string;
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
  onShare,
  commentHref,
}: PostEngagementBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 select-none flex-wrap gap-2">
      <button
        type="button"
        onClick={onLike}
        className={cn(
          "flex items-center gap-2 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-90 px-3 py-1.5 rounded-full",
          isLiked
            ? "text-[#5D3EBB] bg-[#E6E0FA]/40 shadow-xs"
            : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
        )}
      >
        <ThumbsUp className={cn("w-4 h-4", isLiked ? "fill-[#5D3EBB]" : "")} />
        <span>Liked ({likes})</span>
      </button>

      {commentHref ? (
        <Link
          href={commentHref}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment ({commentsCount})</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={onComment}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment ({commentsCount})</span>
        </button>
      )}

      <button
        type="button"
        onClick={onRepost}
        className={cn(
          "flex items-center gap-2 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all",
          isReposted
            ? "text-[#5D3EBB] bg-[#E6E0FA]/40"
            : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
        )}
      >
        <Repeat2 className="w-4 h-4" />
        <span>Repost ({reposts})</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>
    </div>
  );
}
