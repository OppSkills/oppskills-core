"use client";

import { useEffect } from "react";
import type { Chat } from "../../domain/types";

export function useChatDocumentTitle(
  activeChat: Chat | undefined,
  chats: Chat[],
) {
  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  useEffect(() => {
    if (activeChat) {
      document.title = `Chat with ${activeChat.name} - Oppskills`;
    } else {
      const prefix = totalUnread > 0 ? `(${totalUnread}) ` : "";
      document.title = `${prefix}Chats - Oppskills`;
    }
  }, [activeChat?.id, activeChat?.name, totalUnread]);
}
