"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function isPostContentEmpty(content: string): boolean {
  return !content || !content.trim();
}

interface PostContentProps {
  content: string;
  className?: string;
}

export default function PostContent({ content, className }: PostContentProps) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  const shouldTruncate = content.length > 200;
  const displayedText = shouldTruncate && !expanded
    ? `${content.slice(0, 200)}...`
    : content;

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <p className="text-neutral-700 font-medium leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base">
        {displayedText}
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-1.5 font-bold text-[#5D3EBB] hover:underline whitespace-nowrap"
          >
            {expanded ? "Show less" : "See more"}
          </button>
        )}
      </p>
    </div>
  );
}
