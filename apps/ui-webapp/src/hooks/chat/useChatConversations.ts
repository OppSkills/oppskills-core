"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { listConversations } from "@/lib/api/chatApi";
import { mapConversationToUi } from "@/lib/chat/chatMappers";
import { chatQueryKeys } from "./chatQueryKeys";
import { requireChatToken } from "./chatQueryUtils";

export function useChatConversations(options?: { enabled?: boolean }) {
  const { getToken, isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: chatQueryKeys.conversations(),
    enabled: (options?.enabled ?? true) && isLoaded && !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      const page = await listConversations(token, { limit: 50 });
      return page.data.map((c) => mapConversationToUi(c, []));
    },
  });
}
