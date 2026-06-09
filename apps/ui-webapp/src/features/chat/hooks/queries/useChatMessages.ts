"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { listMessages } from "@/features/chat/api/chatApi";
import { mapMessageToUi } from "@/features/chat/domain/mappers";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import {
  MESSAGE_PAGE_SIZE,
  requireChatToken,
  type ChatMessagesPage,
} from "../../cache/chatQueryUtils";

export function useChatMessages(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const { getToken, isLoaded } = useAuth();

  return useInfiniteQuery<ChatMessagesPage>({
    queryKey: chatQueryKeys.messages(conversationId ?? ""),
    enabled: isLoaded && !!conversationId && !!currentUserId,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) => {
      if (!conversationId || !currentUserId) {
        throw new Error("Conversation not selected");
      }
      const token = requireChatToken(await getToken());
      const page = await listMessages(token, conversationId, {
        limit: MESSAGE_PAGE_SIZE,
        before: pageParam as string | undefined,
      });
      return {
        messages: page.data.map((m) => mapMessageToUi(m, currentUserId)),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}
