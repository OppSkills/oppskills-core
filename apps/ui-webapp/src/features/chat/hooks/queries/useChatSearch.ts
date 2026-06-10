"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { searchChats } from "@/features/chat/api/chatApi";
import { mapConversationToUi } from "@/features/chat/domain/mappers";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import { mapSearchUserHits, requireChatToken } from "../../cache/chatQueryUtils";

export function useChatSearch(query: string, options?: { enabled?: boolean }) {
  const { getToken, isLoaded } = useAuth();
  const trimmed = query.trim();

  return useQuery({
    queryKey: chatQueryKeys.search(trimmed),
    enabled: (options?.enabled ?? true) && isLoaded && trimmed.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      const result = await searchChats(token, trimmed);
      return {
        conversations: result.conversations.map((c) =>
          mapConversationToUi(c, []),
        ),
        users: mapSearchUserHits(result.users),
      };
    },
  });
}
