"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { getSafeToken } from "@/lib/auth-utils";
import { trackPostImpressions } from "@/lib/api/analyticsApi";

export const postImpressionMutationKeys = {
  track: ["analytics", "post-impressions"] as const,
};

const impressionQueue = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushImpressions:
  | ((postIds: string[]) => Promise<unknown>)
  | null = null;

/**
 * Queues a post ID for impression tracking and schedules a batch flush.
 * Requires `useTrackPostImpressionsMutation` to be mounted in the tree.
 */
export function queuePostImpression(postId: string) {
  scheduleImpressionFlush(postId);
}

function scheduleImpressionFlush(postId: string) {
  impressionQueue.add(postId);

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      const postIds = Array.from(impressionQueue);
      impressionQueue.clear();
      flushTimer = null;

      if (postIds.length === 0 || !flushImpressions) return;
      void flushImpressions(postIds).catch((err) => {
        console.error("[usePostImpression] Failed to flush impressions", err);
      });
    }, 2000);
  }
}

export function useTrackPostImpressionsMutation() {
  const { getToken } = useAuth();

  return useMutation({
    mutationKey: postImpressionMutationKeys.track,
    retry: 1,
    mutationFn: async (postIds: string[]) => {
      const token = await getSafeToken(getToken);
      if (!token || postIds.length === 0) {
        return { success: false, trackedCount: 0 };
      }
      return trackPostImpressions(token, postIds);
    },
  });
}

/**
 * React hook that uses Intersection Observer to detect when a post card
 * is genuinely in view (50% threshold) and registers a debounced impression.
 */
export function usePostImpression(postId: string) {
  const { isSignedIn } = useAuth();
  const trackMutation = useTrackPostImpressionsMutation();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    flushImpressions = trackMutation.mutateAsync;
    return () => {
      if (flushImpressions === trackMutation.mutateAsync) {
        flushImpressions = null;
      }
    };
  }, [trackMutation.mutateAsync]);

  useEffect(() => {
    if (!isSignedIn || trackedRef.current) return;

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !trackedRef.current) {
            trackedRef.current = true;
            scheduleImpressionFlush(postId);
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.5,
      },
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [postId, isSignedIn]);

  return elementRef;
}
