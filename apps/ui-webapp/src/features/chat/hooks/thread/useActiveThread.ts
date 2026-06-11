"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { flattenChatMessages } from "../../cache/chatQueryUtils";
import { useChatMessages } from "../queries/useChatMessages";
import type { useChatMutations } from "../mutations/useChatMutations";
import type { ChatSocketModule } from "../queries/useChatSocketModule";

type UseActiveThreadOptions = {
  selectedChatId: string | null;
  currentUserId: string | null;
  socketModule: ChatSocketModule | null;
  markReadMutation: ReturnType<typeof useChatMutations>["markReadMutation"];
};

export function useActiveThread({
  selectedChatId,
  currentUserId,
  socketModule,
  markReadMutation,
}: UseActiveThreadOptions) {
  const messagesQuery = useChatMessages(selectedChatId, currentUserId);
  const markConversationReadRef = useRef(markReadMutation.mutateAsync);
  markConversationReadRef.current = markReadMutation.mutateAsync;

  const messages = useMemo(
    () => flattenChatMessages(messagesQuery.data),
    [messagesQuery.data],
  );

  const prevChatIdRef = useRef<string | null>(null);
  const roomGenerationRef = useRef(0);

  useEffect(() => {
    if (!selectedChatId || !currentUserId || !socketModule) {
      if (!selectedChatId) prevChatIdRef.current = null;
      return;
    }

    const generation = ++roomGenerationRef.current;
    const chatId = selectedChatId;
    const previousChatId = prevChatIdRef.current;

    if (previousChatId && previousChatId !== chatId) {
      socketModule.leaveConversation(previousChatId);
    }
    prevChatIdRef.current = chatId;

    void socketModule.joinConversation(chatId).then(() => {
      if (generation !== roomGenerationRef.current) return;
      void (async () => {
        try {
          if (generation !== roomGenerationRef.current) return;
          await markConversationReadRef.current(chatId);
        } catch (e) {
          console.error(e);
        }
      })();
    });

    return () => {
      if (generation !== roomGenerationRef.current) return;
      socketModule.leaveConversation(chatId);
      roomGenerationRef.current += 1;
    };
  }, [selectedChatId, currentUserId, socketModule]);

  useEffect(() => {
    if (
      !messagesQuery.data ||
      !selectedChatId ||
      !currentUserId ||
      !socketModule
    ) {
      return;
    }
    const lastPage =
      messagesQuery.data.pages[messagesQuery.data.pages.length - 1];
    if (!lastPage) return;

    const ids = lastPage.messages.filter((m) => !m.isYou).map((m) => m.id);
    if (ids.length === 0) return;

    socketModule.emitAckDelivered(selectedChatId, ids);
  }, [messagesQuery.data, selectedChatId, currentUserId, socketModule]);

  const messagesLoading =
    messagesQuery.isLoading ||
    (messagesQuery.isFetching && !messagesQuery.data);
  const hasOlderMessages = messagesQuery.hasNextPage ?? false;

  const loadOlderMessages = useCallback(async () => {
    if (!messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) return;
    await messagesQuery.fetchNextPage();
  }, [
    messagesQuery.fetchNextPage,
    messagesQuery.hasNextPage,
    messagesQuery.isFetchingNextPage,
  ]);

  return {
    messagesQuery,
    messages,
    messagesLoading,
    hasOlderMessages,
    loadOlderMessages,
  };
}
