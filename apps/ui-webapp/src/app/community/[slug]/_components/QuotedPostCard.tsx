"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { CommunityPostRepostedFromSummary } from "@oppskills/types";
import PostContent from "./PostContent";
import { formatAuthorName } from "./communityUtils";

interface QuotedPostCardProps {
  post: CommunityPostRepostedFromSummary;
  communityHandle: string;
}

export default function QuotedPostCard({
  post,
  communityHandle,
}: QuotedPostCardProps) {
  return (
    <Link
      href={`/community/${communityHandle}/posts/${post.id}`}
      className="block border border-neutral-200 rounded-2xl p-4 hover:bg-neutral-50/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {post.author.imageUrl ? (
            <Image
              src={post.author.imageUrl}
              alt={formatAuthorName(post.author)}
              fill
              className="object-cover"
            />
          ) : (
            formatAuthorName(post.author).slice(0, 2).toUpperCase()
          )}
        </div>
        <span className="text-sm font-bold text-neutral-800">
          {formatAuthorName(post.author)}
        </span>
        <span className="text-xs text-neutral-400 font-semibold">
          · {post.community.name}
        </span>
      </div>
      <PostContent content={post.content} />
      {post.skills && post.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {post.skills.map((skillName, idx) => (
            <span
              key={`${skillName}-${idx}`}
              className="inline-flex items-center bg-[#E6E0FA]/40 text-[#2E1E66] text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              #{skillName}
            </span>
          ))}
        </div>
      )}
      {post.images.length > 0 && (
        <div className="relative w-full h-32 mt-3 rounded-xl overflow-hidden">
          <Image
            src={post.images[0]}
            alt="Quoted post"
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  );
}
