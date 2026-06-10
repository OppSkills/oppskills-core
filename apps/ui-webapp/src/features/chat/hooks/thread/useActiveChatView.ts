"use client";

import { useMemo } from "react";
import type { Chat, Message } from "../../domain/types";

/**
 * Joins inbox row metadata with the active thread's message pages.
 */
export function useActiveChatView(
  chats: Chat[],
  selectedChatId: string | null,
  threadMessages: Message[],
): Chat | undefined {
  return useMemo(() => {
    if (!selectedChatId) return undefined;

    const inboxRow = chats.find((c) => c.id === selectedChatId);
    if (!inboxRow) return undefined;

    if (threadMessages.length === 0) {
      return inboxRow;
    }

    return { ...inboxRow, messages: threadMessages };
  }, [chats, selectedChatId, threadMessages]);
}
