"use client";

import { useEffect, useState } from "react";
import { useVideoCache } from "@/features/chat/hooks/useVideoCache";

type SecureChatAttachmentVideoProps = {
  conversationId: string;
  messageId: string;
  className?: string;
  autoPlay?: boolean;
};

export function SecureChatAttachmentVideo({
  conversationId,
  messageId,
  className = "",
  autoPlay = true,
}: SecureChatAttachmentVideoProps) {
  const { status, objectUrl, streamUrl, play } = useVideoCache({
    conversationId,
    messageId,
    enabled: true,
    prefetch: true,
  });
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setPlaybackUrl(null);

    void (async () => {
      const url = objectUrl ?? streamUrl ?? (await play());
      if (!cancelled) {
        if (url) setPlaybackUrl(url);
        else setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messageId, objectUrl, play, streamUrl]);

  if (failed || status === "error") {
    return (
      <div
        className={`w-full min-w-[min(85vw,720px)] aspect-video max-h-[70vh] rounded-xl bg-neutral-900 flex items-center justify-center text-white/70 text-sm ${className}`}
      >
        Could not load video
      </div>
    );
  }

  if (!playbackUrl) {
    return (
      <div
        className={`w-full min-w-[min(85vw,720px)] aspect-video max-h-[70vh] rounded-xl bg-neutral-900 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <video
      key={playbackUrl}
      src={playbackUrl}
      controls
      playsInline
      autoPlay={autoPlay}
      className={`w-full min-w-[min(85vw,720px)] max-h-[70vh] rounded-xl bg-black ${className}`}
    />
  );
}
