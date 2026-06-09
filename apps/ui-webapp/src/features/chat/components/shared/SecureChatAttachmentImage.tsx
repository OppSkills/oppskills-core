"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { fetchChatMessageAttachmentBlob } from "@/features/chat/lib/downloadAttachment";

type SecureChatAttachmentImageProps = {
  conversationId: string;
  messageId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
};

export function SecureChatAttachmentImage({
  conversationId,
  messageId,
  alt = "Attachment",
  className = "",
  onClick,
}: SecureChatAttachmentImageProps) {
  const { getToken } = useAuth();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl: string | null = null;
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
        blobUrl = URL.createObjectURL(blob);
        setSrc(blobUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [conversationId, messageId, getToken]);

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
