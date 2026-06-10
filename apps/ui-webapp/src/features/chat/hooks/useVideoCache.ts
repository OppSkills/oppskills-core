"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadVideoToCache,
  getVideoObjectUrl,
  peekVideoObjectUrl,
  revokeVideoObjectUrl,
} from "@/features/chat/lib/videoCache/videoCacheBridge";
import { VideoCacheManager } from "@/features/chat/lib/videoCache/VideoCacheManager";
import {
  buildVideoStreamUrl,
  fetchVideoStreamToken,
} from "@/features/chat/lib/videoCache/videoStreamUrl";
import { subscribeVideoSwMessages } from "@/features/chat/lib/videoCache/registerVideoServiceWorker";
import { videoPrefetchQueue } from "@/features/chat/lib/videoCache/videoPrefetchQueue";

export type VideoCacheStatus =
  | "idle"
  | "downloading"
  | "cached"
  | "streaming"
  | "error";

type UseVideoCacheOptions = {
  conversationId: string | null | undefined;
  messageId: string | null | undefined;
  enabled?: boolean;
  prefetch?: boolean;
};

export function useVideoCache({
  conversationId,
  messageId,
  enabled = true,
  prefetch = false,
}: UseVideoCacheOptions) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<VideoCacheStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const downloadingRef = useRef(false);

  const refreshCachedUrl = useCallback(async () => {
    if (!messageId) return;
    const cached = peekVideoObjectUrl(messageId) ?? (await getVideoObjectUrl(messageId));
    if (cached) {
      setObjectUrl(cached);
      setStatus("cached");
      setProgress(100);
    }
  }, [messageId]);

  const runPrefetch = useCallback(async () => {
    if (
      !enabled ||
      !prefetch ||
      !conversationId ||
      !messageId ||
      messageId.startsWith("optimistic-") ||
      downloadingRef.current
    ) {
      return;
    }

    const cached = await VideoCacheManager.has(messageId);
    if (cached) {
      await refreshCachedUrl();
      return;
    }

    const token = await getToken();
    if (!token) return;

    setStatus("downloading");
    videoPrefetchQueue.enqueue(conversationId, messageId, token);
  }, [
    conversationId,
    enabled,
    getToken,
    messageId,
    prefetch,
    refreshCachedUrl,
  ]);

  useEffect(() => {
    if (!enabled || !messageId) {
      setStatus("idle");
      setObjectUrl(null);
      setStreamUrl(null);
      return;
    }

    void (async () => {
      const cacheStatus = await VideoCacheManager.getStatus(messageId);
      if (cacheStatus === "cached") {
        await refreshCachedUrl();
        return;
      }
      if (cacheStatus === "corrupt") {
        await VideoCacheManager.remove(messageId);
      }
      if (prefetch) {
        void runPrefetch();
      } else {
        setStatus("idle");
      }
    })();
  }, [enabled, messageId, prefetch, refreshCachedUrl, runPrefetch]);

  useEffect(() => {
    if (!messageId) return;
    return subscribeVideoSwMessages((msg) => {
      if (msg.messageId !== messageId) return;
      if (msg.type === "VIDEO_CACHE_PROGRESS") {
        setStatus("downloading");
        setProgress(msg.percent);
      }
      if (msg.type === "VIDEO_CACHED") {
        void refreshCachedUrl();
      }
      if (msg.type === "VIDEO_CACHE_FAILED") {
        setStatus("error");
      }
    });
  }, [messageId, refreshCachedUrl]);

  useEffect(() => {
    return () => {
      if (messageId) revokeVideoObjectUrl(messageId);
    };
  }, [messageId]);

  const resolveStreamUrl = useCallback(async () => {
    if (!conversationId || !messageId) return null;
    const token = await getToken();
    if (!token) return null;
    const streamToken = await fetchVideoStreamToken(
      token,
      conversationId,
      messageId,
    );
    return buildVideoStreamUrl(conversationId, messageId, streamToken);
  }, [conversationId, getToken, messageId]);

  const play = useCallback(async (): Promise<string | null> => {
    if (objectUrl) return objectUrl;

    const cached = messageId ? await getVideoObjectUrl(messageId) : null;
    if (cached) {
      setObjectUrl(cached);
      setStatus("cached");
      return cached;
    }

    if (!conversationId || !messageId) return null;

    if (!downloadingRef.current) {
      downloadingRef.current = true;
      setStatus("downloading");
      try {
        const token = await getToken();
        if (token) {
          await downloadVideoToCache(
            token,
            conversationId,
            messageId,
            setProgress,
          );
          const url = await getVideoObjectUrl(messageId);
          if (url) {
            setObjectUrl(url);
            setStatus("cached");
            return url;
          }
        }
      } catch {
        // fall through to streaming
      } finally {
        downloadingRef.current = false;
      }
    }

    try {
      const url = await resolveStreamUrl();
      if (url) {
        setStreamUrl(url);
        setStatus("streaming");
        return url;
      }
    } catch {
      setStatus("error");
    }
    return null;
  }, [conversationId, getToken, messageId, objectUrl, resolveStreamUrl]);

  return {
    status,
    progress,
    objectUrl,
    streamUrl,
    prefetch: runPrefetch,
    play,
  };
}
