"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { fetchChatMessageAttachmentBlob } from "@/features/chat/lib/downloadAttachment";
import {
  peekImageObjectUrl,
  storeImageObjectUrl,
} from "@/features/chat/lib/imageCache/imageCacheBridge";

type SecureChatAttachmentImageProps = {
  conversationId: string;
  messageId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  preferredSrc?: string | null;
};

export function SecureChatAttachmentImage({
  conversationId,
  messageId,
  alt = "Attachment",
  className = "",
  onClick,
  preferredSrc,
}: SecureChatAttachmentImageProps) {
  const { getToken } = useAuth();
  const [src, setSrc] = useState<string | null>(
    preferredSrc ?? peekImageObjectUrl(messageId) ?? null,
  );

  useEffect(() => {
    const cached = peekImageObjectUrl(messageId);
    if (preferredSrc) {
      setSrc(preferredSrc);
      return;
    }
    if (cached) {
      setSrc(cached);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const blob = await fetchChatMessageAttachmentBlob(
          token,
          conversationId,
          messageId,
        );
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        storeImageObjectUrl(messageId, blobUrl);
        setSrc(blobUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, messageId, getToken, preferredSrc]);

  if (!src) {
    return (
      <div
        className={`bg-neutral-200 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  return <img src={src} alt={alt} onClick={onClick} className={className} />;
}
