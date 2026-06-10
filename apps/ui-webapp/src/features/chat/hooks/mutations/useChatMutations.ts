"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import type { SendChatMessageDto } from "@oppskills/types";
import {
  createDirectConversation,
  createGroupConversation,
  deleteChat as deleteChatApi,
  deleteGroup as deleteGroupApi,
  leaveGroup as leaveGroupApi,
  markConversationRead,
  removeGroupMember as removeGroupMemberApi,
  sendMessage as sendMessageApi,
  updateGroupConversation,
} from "@/features/chat/api/chatApi";
import {
  applyConversationDetailToCache,
  clearUnreadInCache,
  removeConversationFromCache,
  upsertConversationInCache,
} from "../../cache/chatCacheUpdates";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import { requireChatToken } from "../../cache/chatQueryUtils";

export const chatMutationKeys = {
  markRead: ["chats", "mutation", "mark-read"] as const,
  createDirect: ["chats", "mutation", "create-direct"] as const,
  createGroup: ["chats", "mutation", "create-group"] as const,
  sendMessage: ["chats", "mutation", "send-message"] as const,
  updateGroup: ["chats", "mutation", "update-group"] as const,
  removeMember: ["chats", "mutation", "remove-member"] as const,
  deleteChat: ["chats", "mutation", "delete-chat"] as const,
  leaveGroup: ["chats", "mutation", "leave-group"] as const,
  deleteGroup: ["chats", "mutation", "delete-group"] as const,
};

export function useChatMutations() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const getTokenSafe = useCallback(async () => {
    return requireChatToken(await getToken());
  }, [getToken]);

  const markReadMutation = useMutation({
    mutationKey: chatMutationKeys.markRead,
    mutationFn: async (conversationId: string) => {
      const token = await getTokenSafe();
      await markConversationRead(token, conversationId);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      clearUnreadInCache(queryClient, conversationId);
    },
  });

  const createDirectMutation = useMutation({
    mutationKey: chatMutationKeys.createDirect,
    mutationFn: async (otherUserId: string) => {
      const token = await getTokenSafe();
      return createDirectConversation(token, otherUserId);
    },
    onSuccess: (conv) => {
      upsertConversationInCache(queryClient, {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        imageUrl: conv.imageUrl,
        handle: conv.handle,
        isGroup: conv.isGroup,
        createdById: conv.createdById,
        unreadCount: 0,
        lastMessage: null,
        members: conv.members,
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationKey: chatMutationKeys.createGroup,
    mutationFn: async (payload: { name: string; memberIds: string[] }) => {
      const token = await getTokenSafe();
      return createGroupConversation(token, payload);
    },
    onSuccess: (conv) => {
      upsertConversationInCache(queryClient, {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        imageUrl: conv.imageUrl,
        handle: conv.handle,
        isGroup: true,
        createdById: conv.createdById,
        unreadCount: 0,
        lastMessage: null,
        members: conv.members,
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationKey: chatMutationKeys.sendMessage,
    mutationFn: async ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: SendChatMessageDto;
    }) => {
      const token = await getTokenSafe();
      return sendMessageApi(token, conversationId, payload);
    },
  });

  const updateGroupMutation = useMutation({
    mutationKey: chatMutationKeys.updateGroup,
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: Parameters<typeof updateGroupConversation>[2];
    }) => {
      const token = await getTokenSafe();
      return updateGroupConversation(token, conversationId, data);
    },
    onSuccess: (detail, { conversationId }) => {
      applyConversationDetailToCache(queryClient, conversationId, detail);
    },
  });

  const removeMemberMutation = useMutation({
    mutationKey: chatMutationKeys.removeMember,
    mutationFn: async ({
      conversationId,
      memberUserId,
    }: {
      conversationId: string;
      memberUserId: string;
    }) => {
      const token = await getTokenSafe();
      return removeGroupMemberApi(token, conversationId, memberUserId);
    },
    onSuccess: (detail, { conversationId }) => {
      applyConversationDetailToCache(queryClient, conversationId, detail);
    },
  });

  const deleteChatMutation = useMutation({
    mutationKey: chatMutationKeys.deleteChat,
    mutationFn: async (conversationId: string) => {
      const token = await getTokenSafe();
      await deleteChatApi(token, conversationId);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      removeConversationFromCache(queryClient, conversationId);
    },
  });

  const leaveGroupMutation = useMutation({
    mutationKey: chatMutationKeys.leaveGroup,
    mutationFn: async (conversationId: string) => {
      const token = await getTokenSafe();
      await leaveGroupApi(token, conversationId);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      removeConversationFromCache(queryClient, conversationId);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationKey: chatMutationKeys.deleteGroup,
    mutationFn: async (conversationId: string) => {
      const token = await getTokenSafe();
      await deleteGroupApi(token, conversationId);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      removeConversationFromCache(queryClient, conversationId);
    },
  });

  const invalidateMessages = useCallback(
    (conversationId: string) => {
      return queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(conversationId),
      });
    },
    [queryClient],
  );

  return {
    getTokenSafe,
    markReadMutation,
    createDirectMutation,
    createGroupMutation,
    sendMessageMutation,
    updateGroupMutation,
    removeMemberMutation,
    deleteChatMutation,
    leaveGroupMutation,
    deleteGroupMutation,
    invalidateMessages,
  };
}
