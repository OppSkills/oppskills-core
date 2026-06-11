"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type UseChatThreadScrollOptions = {
  selectedChatId: string | null;
  messagesLoading: boolean;
  threadMessageCount: number;
  unreadCount: number;
  hasOlderMessages: boolean;
  loadOlderMessages: () => Promise<unknown>;
};

type UseChatThreadScrollResult = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  topSentinelRef: RefObject<HTMLDivElement | null>;
  isLoadingOlder: boolean;
  scrollToBottom: (instant?: boolean) => void;
  handleLoadOlderIfNeeded: (scrollTop: number) => void;
};

function isNearBottom(container: HTMLElement, threshold = 48): boolean {
  const distance =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distance <= threshold;
}

/**
 * Keeps the thread pinned to the latest messages on open/reload, preserves
 * scroll position when older pages prepend, and loads older pages when the
 * top sentinel is visible (not only on scroll events).
 */
export function useChatThreadScroll({
  selectedChatId,
  messagesLoading,
  threadMessageCount,
  unreadCount,
  hasOlderMessages,
  loadOlderMessages,
}: UseChatThreadScrollOptions): UseChatThreadScrollResult {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);
  const allowLoadOlderRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const initialSnapDoneRef = useRef<string | null>(null);
  const loadOlderMessagesRef = useRef(loadOlderMessages);
  loadOlderMessagesRef.current = loadOlderMessages;

  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const scrollToBottom = useCallback((instant = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const snap = () => {
      container.scrollTop = container.scrollHeight;
    };

    snap();
    if (!instant) return;
    requestAnimationFrame(snap);
    requestAnimationFrame(() => requestAnimationFrame(snap));
  }, []);

  const attemptLoadOlder = useCallback(() => {
    if (!selectedChatId || !allowLoadOlderRef.current) return;
    if (!hasOlderMessages || loadingOlderRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const contentOverflows =
      container.scrollHeight > container.clientHeight + 16;
    // Only fetch history when the viewport is near the top of the list.
    if (!contentOverflows || container.scrollTop > 240) return;

    const prevHeight = container.scrollHeight;
    const prevTop = container.scrollTop;
    // Anchor to distance-from-bottom so prepended content keeps the currently
    // visible messages in place regardless of how far the user has scrolled.
    const prevFromBottom = prevHeight - prevTop;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);

    const restore = () => {
      const next = scrollContainerRef.current;
      if (!next) return;
      next.scrollTop = next.scrollHeight - prevFromBottom;
    };

    void loadOlderMessagesRef
      .current()
      .then(() => {
        // Restore across two frames: the first lets React commit the prepended
        // nodes, the second corrects for any late reflow before paint.
        requestAnimationFrame(() => {
          restore();
          requestAnimationFrame(restore);
        });
      })
      .finally(() => {
        loadingOlderRef.current = false;
        setIsLoadingOlder(false);
      });
  }, [selectedChatId, hasOlderMessages]);

  const handleLoadOlderIfNeeded = useCallback(
    (scrollTop: number) => {
      if (scrollTop < 120) attemptLoadOlder();
    },
    [attemptLoadOlder],
  );

  useEffect(() => {
    allowLoadOlderRef.current = false;
    prevMessageCountRef.current = 0;
    initialSnapDoneRef.current = null;
  }, [selectedChatId]);

  // Pin to bottom on open/reload until layout stabilises (read chats).
  // NB: the scroll container mounts asynchronously (ChatTimeline is a dynamic
  // import), so we retry inside a loop until the node exists AND content height
  // has settled — rather than bailing once when the ref is still null.
  //
  // This runs ONCE per chat open. It must not re-fire when older pages prepend
  // (threadMessageCount grows) or the view would jerk back to the bottom while
  // the user is scrolling up through history.
  useLayoutEffect(() => {
    if (!selectedChatId || messagesLoading || threadMessageCount === 0) return;
    if (initialSnapDoneRef.current === selectedChatId) return;

    if (unreadCount > 0) {
      allowLoadOlderRef.current = true;
      initialSnapDoneRef.current = selectedChatId;
      return;
    }

    allowLoadOlderRef.current = false;
    let cancelled = false;
    let stableBottomFrames = 0;
    let observer: ResizeObserver | null = null;
    let observedEl: HTMLElement | null = null;
    const startedAt = Date.now();

    const finish = () => {
      allowLoadOlderRef.current = true;
      initialSnapDoneRef.current = selectedChatId;
      observer?.disconnect();
      observer = null;
      window.clearInterval(pollId);
    };

    const trySnap = () => {
      if (cancelled) return;

      const container = scrollContainerRef.current;
      if (!container) {
        // Container not mounted yet (dynamic import) — keep waiting, but give
        // up after the timeout so we never poll forever.
        if (Date.now() - startedAt > 6000) finish();
        return;
      }

      // Attach the ResizeObserver as soon as the node is available so we react
      // to late-loading media/images that change the content height.
      if (observer && observedEl !== container) {
        observer.observe(container);
        observedEl = container;
      }

      container.scrollTop = container.scrollHeight;

      if (isNearBottom(container)) {
        stableBottomFrames += 1;
      } else {
        stableBottomFrames = 0;
      }

      if (stableBottomFrames >= 3 || Date.now() - startedAt > 6000) {
        finish();
      }
    };

    observer = new ResizeObserver(() => trySnap());
    trySnap();
    const pollId = window.setInterval(trySnap, 80);

    return () => {
      cancelled = true;
      observer?.disconnect();
      observer = null;
      window.clearInterval(pollId);
      allowLoadOlderRef.current = true;
    };
  }, [selectedChatId, messagesLoading, threadMessageCount, unreadCount]);

  // IntersectionObserver: load older when the top sentinel is visible.
  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || !selectedChatId || !hasOlderMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        attemptLoadOlder();
      },
      { root, rootMargin: "120px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [selectedChatId, hasOlderMessages, threadMessageCount, attemptLoadOlder]);

  // Auto-scroll only for new messages at the bottom — not prepended history.
  useEffect(() => {
    const count = threadMessageCount;
    if (count === 0) return;

    const container = scrollContainerRef.current;
    const isInitial = prevMessageCountRef.current === 0;
    const grew = count > prevMessageCountRef.current;
    const added = count - prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    if (isInitial) {
      if (unreadCount === 0) scrollToBottom(true);
      return;
    }

    if (!grew || !container) return;

    const wasNearBottom = isNearBottom(container, 150);
    const likelyOlderPage = added > 1 && !wasNearBottom;

    if (!likelyOlderPage && wasNearBottom) {
      scrollToBottom(false);
    }
  }, [threadMessageCount, unreadCount, scrollToBottom]);

  return {
    scrollContainerRef,
    messagesEndRef,
    topSentinelRef,
    isLoadingOlder,
    scrollToBottom,
    handleLoadOlderIfNeeded,
  };
}
