"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  acquireChatAttachmentBlobUrl,
  peekChatAttachmentBlobUrl,
  releaseChatAttachmentBlobUrl,
} from "@/features/chat/lib/chatAttachmentBlobCache";

type UseChatAttachmentBlobUrlOptions = {
  conversationId: string | null | undefined;
  messageId: string | null | undefined;
  enabled?: boolean;
};

export function useChatAttachmentBlobUrl({
  conversationId,
  messageId,
  enabled = true,
}: UseChatAttachmentBlobUrlOptions) {
  const { getToken } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(() => {
    if (!conversationId || !messageId) return null;
    return peekChatAttachmentBlobUrl(conversationId, messageId) ?? null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !conversationId || !messageId) {
      setBlobUrl(null);
      setFailed(false);
      return;
    }

    const cached = peekChatAttachmentBlobUrl(conversationId, messageId);
    if (cached) setBlobUrl(cached);
    setFailed(false);

    let cancelled = false;

    void (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const url = await acquireChatAttachmentBlobUrl(
          token,
          conversationId,
          messageId,
        );
        if (!cancelled) setBlobUrl(url);
      } catch {
        if (!cancelled) {
          setBlobUrl(null);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      releaseChatAttachmentBlobUrl(conversationId, messageId);
    };
  }, [conversationId, messageId, enabled, getToken]);

  return { blobUrl, failed };
}
