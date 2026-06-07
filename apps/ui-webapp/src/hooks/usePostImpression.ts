"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { getSafeToken } from "@/lib/auth-utils";
import { trackPostImpressions } from "@/lib/api/analyticsApi";

const impressionQueue: Set<string> = new Set();
let flushTimer: NodeJS.Timeout | null = null;
let currentTokenFetcher: (() => Promise<string | null>) | null = null;

/**
 * Queues a post ID for impression tracking and schedules a batch flush.
 */
export function queuePostImpression(
  postId: string,
  getToken: () => Promise<string | null>,
) {
  impressionQueue.add(postId);
  currentTokenFetcher = getToken;

  if (!flushTimer) {
    flushTimer = setTimeout(async () => {
      const postIds = Array.from(impressionQueue);
      impressionQueue.clear();
      flushTimer = null;

      if (postIds.length === 0 || !currentTokenFetcher) return;

      try {
        const token = await currentTokenFetcher();
        if (token) {
          await trackPostImpressions(token, postIds);
        }
      } catch (err) {
        console.error(
          "[usePostImpression] Failed to flush impressions",
          err,
        );
      }
    }, 2000); // 2 seconds batch window
  }
}

/**
 * React hook that uses Intersection Observer to detect when a post card
 * is genuinely in view (50% threshold) and registers a debounced impression.
 */
export function usePostImpression(postId: string) {
  const { isSignedIn, getToken } = useAuth();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || trackedRef.current) return;

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !trackedRef.current) {
            trackedRef.current = true;
            queuePostImpression(postId, () => getSafeToken(getToken));
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.5, // 50% visibility represents a genuine view
      },
    );

    observer.observe(el);

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [postId, isSignedIn, getToken]);

  return elementRef;
}
