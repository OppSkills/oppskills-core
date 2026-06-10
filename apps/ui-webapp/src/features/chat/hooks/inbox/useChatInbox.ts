"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatConversationListItemDto } from "@oppskills/types";
import type { Chat } from "@/features/chat/domain/types";
import { useDebounce } from "@/hooks/ui/use-debounce";
import {
  setConversationsCache,
  upsertConversationInCache,
} from "../../cache/chatCacheUpdates";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import { useChatConversation } from "../queries/useChatConversation";
import { useChatConversations } from "../queries/useChatConversations";
import { useChatGroupMemberSearch } from "../queries/useChatGroupMemberSearch";
import { useChatSearch } from "../queries/useChatSearch";

const EMPTY_CHATS: Chat[] = [];

type UseChatInboxOptions = {
  selectedChatId: string | null;
  currentUserId: string | null;
  openUserChatAction: (otherUserId: string) => Promise<void>;
};

export function useChatInbox({
  selectedChatId,
  currentUserId,
  openUserChatAction,
}: UseChatInboxOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [inboxSearchInput, setInboxSearchInput] = useState("");
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const debouncedInboxSearch = useDebounce(inboxSearchInput, 300);
  const debouncedGroupSearch = useDebounce(groupSearchInput, 300);

  const conversationsQuery = useChatConversations();
  const inboxSearchQuery = useChatSearch(debouncedInboxSearch);
  const groupMemberSearchQuery = useChatGroupMemberSearch(
    debouncedGroupSearch,
    currentUserId,
  );

  const baseConversations = conversationsQuery.data ?? EMPTY_CHATS;
  const conversationInList = useMemo(
    () =>
      selectedChatId
        ? baseConversations.some((chat) => chat.id === selectedChatId)
        : false,
    [baseConversations, selectedChatId],
  );

  const missingConversationQuery = useChatConversation(selectedChatId ?? "", {
    enabled:
      !!selectedChatId &&
      !conversationsQuery.isLoading &&
      !conversationInList &&
      debouncedInboxSearch.length === 0,
  });

  useEffect(() => {
    const detail = missingConversationQuery.data;
    if (!detail) return;
    upsertConversationInCache(queryClient, {
      id: detail.id,
      type: detail.type,
      name: detail.name,
      imageUrl: detail.imageUrl,
      handle: detail.handle,
      isGroup: detail.isGroup,
      createdById: detail.createdById,
      unreadCount: 0,
      lastMessage: null,
      members: detail.members,
    });
  }, [missingConversationQuery.data, queryClient]);

  useEffect(() => {
    if (missingConversationQuery.isError) {
      router.replace("/dashboard/chats");
    }
  }, [missingConversationQuery.isError, router]);

  const chats = useMemo(() => {
    if (debouncedInboxSearch) {
      return inboxSearchQuery.data?.conversations ?? [];
    }
    return baseConversations;
  }, [debouncedInboxSearch, inboxSearchQuery.data, baseConversations]);

  const searchUsers = debouncedInboxSearch
    ? (inboxSearchQuery.data?.users ?? [])
    : [];

  const groupSearchUsers = debouncedGroupSearch
    ? (groupMemberSearchQuery.data ?? [])
    : [];

  const loading = conversationsQuery.isLoading;

  const refreshConversations = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: chatQueryKeys.conversations(),
    });
  }, [queryClient]);

  const setChats = useCallback(
    (val: Chat[] | ((prev: Chat[]) => Chat[])) => {
      setConversationsCache(queryClient, (prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        return next.map((chat) => ({ ...chat, messages: [] }));
      });
    },
    [queryClient],
  );

  const runSearch = useCallback(
    (query: string) => {
      setInboxSearchInput(query);
      if (query.trim().length === 0) {
        void queryClient.invalidateQueries({
          queryKey: chatQueryKeys.conversations(),
        });
      }
    },
    [queryClient],
  );

  const runGroupMemberSearch = useCallback((query: string) => {
    setGroupSearchInput(query);
  }, []);

  const upsertConversation = useCallback(
    (item: ChatConversationListItemDto) => {
      upsertConversationInCache(queryClient, item);
    },
    [queryClient],
  );

  return {
    chats,
    setChats,
    loading,
    searchUsers,
    runSearch,
    groupSearchUsers,
    runGroupMemberSearch,
    openUserChat: openUserChatAction,
    refreshConversations,
    upsertConversation,
  };
}
