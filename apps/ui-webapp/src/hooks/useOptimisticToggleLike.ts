"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseOptimisticToggleLikeOptions {
  initialLiked: boolean;
  initialCount: number;
  onSync: () => Promise<{ liked: boolean; likeCount: number }>;
  debounceMs?: number;
  /** Reset local state only when this key changes (e.g. comment id). */
  resetKey: string;
}

export function useOptimisticToggleLike({
  initialLiked,
  initialCount,
  onSync,
  debounceMs = 400,
  resetKey,
}: UseOptimisticToggleLikeOptions) {
  const [displayLiked, setDisplayLiked] = useState(initialLiked);
  const [displayCount, setDisplayCount] = useState(initialCount);

  const confirmedLikedRef = useRef(initialLiked);
  const confirmedCountRef = useRef(initialCount);
  const displayLikedRef = useRef(initialLiked);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSyncRef = useRef(onSync);
  const syncingRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  onSyncRef.current = onSync;

  const applyServerState = useCallback((liked: boolean, count: number) => {
    confirmedLikedRef.current = liked;
    confirmedCountRef.current = count;
    displayLikedRef.current = liked;
    setDisplayLiked(liked);
    setDisplayCount(count);
  }, []);

  // Reset when the target entity changes.
  useEffect(() => {
    hasUserInteractedRef.current = false;
    applyServerState(initialLiked, initialCount);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed from first render for this resetKey
  }, [resetKey, applyServerState]);

  // Accept late-arriving server data before the user interacts (e.g. auth hydration).
  useEffect(() => {
    if (hasUserInteractedRef.current) return;
    if (timerRef.current) return;
    if (
      initialLiked === confirmedLikedRef.current &&
      initialCount === confirmedCountRef.current
    ) {
      return;
    }
    applyServerState(initialLiked, initialCount);
  }, [initialLiked, initialCount, applyServerState]);

  const flush = useCallback(async () => {
    if (syncingRef.current) return;
    if (displayLikedRef.current === confirmedLikedRef.current) return;

    syncingRef.current = true;
    try {
      const result = await onSyncRef.current();
      confirmedLikedRef.current = result.liked;
      confirmedCountRef.current = result.likeCount;
      displayLikedRef.current = result.liked;
      setDisplayLiked(result.liked);
      setDisplayCount(result.likeCount);
    } catch {
      displayLikedRef.current = confirmedLikedRef.current;
      setDisplayLiked(confirmedLikedRef.current);
      setDisplayCount(confirmedCountRef.current);
    } finally {
      syncingRef.current = false;
    }

    if (displayLikedRef.current !== confirmedLikedRef.current) {
      void flush();
    }
  }, []);

  const toggle = useCallback(() => {
    hasUserInteractedRef.current = true;
    const nextLiked = !displayLikedRef.current;
    displayLikedRef.current = nextLiked;
    setDisplayLiked(nextLiked);
    setDisplayCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, debounceMs);
  }, [flush, debounceMs]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { isLiked: displayLiked, likeCount: displayCount, toggle };
}
