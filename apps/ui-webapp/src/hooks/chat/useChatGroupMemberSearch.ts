"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { searchUsersForGroup } from "@/lib/api/chatApi";
import { chatQueryKeys } from "./chatQueryKeys";
import { mapSearchUserHits, requireChatToken } from "./chatQueryUtils";

export function useChatGroupMemberSearch(
  query: string,
  currentUserId: string | null,
  options?: { enabled?: boolean },
) {
  const { getToken, isLoaded } = useAuth();
  const trimmed = query.trim();

  return useQuery({
    queryKey: chatQueryKeys.groupMemberSearch(trimmed),
    enabled:
      (options?.enabled ?? true) &&
      isLoaded &&
      !!currentUserId &&
      trimmed.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      const users = await searchUsersForGroup(token, trimmed);
      return mapSearchUserHits(users.filter((u) => u.id !== currentUserId));
    },
  });
}
