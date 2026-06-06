"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

function normalizePostContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return DOMPurify.sanitize(trimmed);
  }

  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<u>$1</u>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/\n/g, "<br />");

  return DOMPurify.sanitize(html);
}

export function isPostContentEmpty(content: string): boolean {
  return !content.replace(/<[^>]*>/g, "").trim();
}

interface PostContentProps {
  content: string;
  className?: string;
}

export default function PostContent({ content, className }: PostContentProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sanitized = useMemo(() => normalizePostContent(content), [content]);

  useEffect(() => {
    setExpanded(false);
  }, [content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || expanded) return;

    const checkClamp = () => {
      setNeedsClamp(el.scrollHeight > el.clientHeight + 1);
    };

    checkClamp();
    const observer = new ResizeObserver(checkClamp);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sanitized, expanded]);

  if (!sanitized) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        className={cn(
          "prose prose-sm sm:prose-base max-w-none text-neutral-700 font-medium leading-relaxed",
          "[&_p]:my-0 [&_p+p]:mt-2 [&_ul]:my-1 [&_ol]:my-1",
          !expanded &&
            "overflow-hidden max-h-[calc(0.875rem*1.625*3)] sm:max-h-[calc(1rem*1.625*3)]",
        )}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      {needsClamp && !expanded && (
        <span className="absolute bottom-0 right-0 inline-flex items-baseline bg-white pl-2 text-sm sm:text-base font-medium leading-relaxed">
          <span className="text-neutral-700">...</span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="font-bold text-[#5D3EBB] hover:underline"
          >
            Show more
          </button>
        </span>
      )}
      {needsClamp && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-sm font-bold text-[#5D3EBB] hover:underline w-fit"
        >
          Show less
        </button>
      )}
    </div>
  );
}
