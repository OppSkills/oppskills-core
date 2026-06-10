"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatDetails } from "./groups/useChatDetails";
import { useChatGroupAdmin } from "./groups/useChatGroupAdmin";
import { useChatInbox } from "./inbox/useChatInbox";
import { useChatMutations } from "./mutations/useChatMutations";
import { useChatSocketModule } from "./queries/useChatSocketModule";
import { useChatSocketSync } from "./queries/useChatSocketSync";
import { useChatSendPipeline } from "./send/useChatSendPipeline";
import { useActiveThread } from "./thread/useActiveThread";

export function useChatPage(selectedChatId: string | null) {
  const { getToken, isLoaded, userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentUserId = clerkUserId ?? null;
  const socketModule = useChatSocketModule();
  const mutations = useChatMutations();

  useChatSocketSync({
    socketModule,
    currentUserId,
    selectedChatId,
    isAuthLoaded: isLoaded,
    getToken,
    queryClient,
    markConversationRead: mutations.markReadMutation.mutateAsync,
  });

  const openUserChatAction = useCallback(
    async (otherUserId: string) => {
      const conv = await mutations.createDirectMutation.mutateAsync(otherUserId);
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [mutations.createDirectMutation, router],
  );

  const thread = useActiveThread({
    selectedChatId,
    currentUserId,
    socketModule,
    markReadMutation: mutations.markReadMutation,
  });

  const inbox = useChatInbox({
    selectedChatId,
    openUserChatAction,
    currentUserId,
  });

  const send = useChatSendPipeline({
    currentUserId,
    selectedChatId,
    socketModule,
    mutations,
  });

  const groups = useChatGroupAdmin({ selectedChatId, mutations });
  const details = useChatDetails();

  return {
    currentUserId,
    ...inbox,
    threadMessages: thread.messages,
    messagesLoading: thread.messagesLoading,
    hasOlderMessages: thread.hasOlderMessages,
    loadOlderMessages: thread.loadOlderMessages,
    ...send,
    ...groups,
    ...details,
    userImageUrl: user?.imageUrl ?? null,
  };
}

/** @deprecated Use useChatPage */
export const useChatsPage = useChatPage;
