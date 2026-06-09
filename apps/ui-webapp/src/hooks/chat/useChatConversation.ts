"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getConversation } from "@/lib/api/chatApi";
import { chatQueryKeys } from "./chatQueryKeys";
import { requireChatToken } from "./chatQueryUtils";

export function useChatConversation(
  conversationId: string,
  options?: { enabled?: boolean },
) {
  const { getToken, isLoaded } = useAuth();

  return useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    enabled: (options?.enabled ?? true) && isLoaded && !!conversationId,
    staleTime: 60_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      return getConversation(token, conversationId);
    },
  });
}
