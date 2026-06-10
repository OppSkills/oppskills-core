import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatDeliveryStatus,
  ChatMessageDto,
} from "@oppskills/types";
import {
  appendMessageToChat,
  applyInboxConversationUpdate,
  mapConversationToUi,
  mapMessageToUi,
  markOptimisticMessageCancelled,
  markOptimisticMessageFailed,
  markOptimisticMessageRetrying,
  mergeChatFromDetail,
  patchMemberPresence,
  patchMessageDelivery,
  patchMessageInChat,
  patchMessageUploadProgress,
  replaceOptimisticMessage,
} from "../domain/mappers";
import type { Chat, Message } from "../domain/types";
import { revokeOptimisticPreview } from "../lib/optimisticMessage";
import { chatQueryKeys } from "./chatQueryKeys";
import type { ChatMessagesPage } from "./chatQueryUtils";

function stripMessages(chat: Chat): Chat {
  return { ...chat, messages: [] };
}

export function setConversationsCache(
  queryClient: QueryClient,
  updater: (prev: Chat[]) => Chat[],
) {
  queryClient.setQueryData<Chat[]>(chatQueryKeys.conversations(), (prev) =>
    updater(prev ?? []),
  );
}

export function upsertConversationInCache(
  queryClient: QueryClient,
  item: ChatConversationListItemDto,
) {
  setConversationsCache(queryClient, (prev) => {
    const existing = prev.find((c) => c.id === item.id);
    const messages = existing?.messages ?? [];
    const ui = mapConversationToUi(item, messages);
    const rest = prev.filter((c) => c.id !== item.id);
    return [stripMessages(ui), ...rest.map(stripMessages)];
  });
}

export function removeConversationFromCache(
  queryClient: QueryClient,
  conversationId: string,
) {
  setConversationsCache(queryClient, (prev) =>
    prev.filter((c) => c.id !== conversationId),
  );
  queryClient.removeQueries({
    queryKey: chatQueryKeys.messages(conversationId),
  });
}

export function clearUnreadInCache(
  queryClient: QueryClient,
  conversationId: string,
) {
  setConversationsCache(queryClient, (prev) =>
    prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
  );
}

export function applyConversationDetailToCache(
  queryClient: QueryClient,
  conversationId: string,
  detail: ChatConversationDetailDto,
) {
  setConversationsCache(queryClient, (prev) =>
    prev.map((c) =>
      c.id === conversationId
        ? stripMessages(mergeChatFromDetail(c, detail))
        : c,
    ),
  );
}

export function updateMessagesCache(
  queryClient: QueryClient,
  conversationId: string,
  updater: (chat: Chat) => Chat,
) {
  queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
    chatQueryKeys.messages(conversationId),
    (old) => {
      if (!old || old.pages.length === 0) return old;
      const baseChat: Chat = {
        id: conversationId,
        name: "",
        imageUrl: "",
        isGroup: false,
        createdById: null,
        unreadCount: 0,
        members: [],
        messages: old.pages[old.pages.length - 1]?.messages ?? [],
        lastMessagePreview: null,
      };
      const nextChat = updater(baseChat);
      const pages = [...old.pages];
      const lastIdx = pages.length - 1;
      pages[lastIdx] = {
        ...pages[lastIdx]!,
        messages: nextChat.messages,
      };
      return { ...old, pages };
    },
  );
}

export function appendMessageToCaches(
  queryClient: QueryClient,
  conversationId: string,
  uiMsg: Message,
  options?: { clearUnread?: boolean },
) {
  updateMessagesCache(queryClient, conversationId, (chat) => {
    if (chat.messages.some((m) => m.id === uiMsg.id)) return chat;
    return appendMessageToChat(chat, uiMsg);
  });

  setConversationsCache(queryClient, (prev) => {
    const idx = prev.findIndex((c) => c.id === conversationId);
    const existing = idx >= 0 ? prev[idx]! : null;
    const updated = appendMessageToChat(
      {
        id: conversationId,
        name: existing?.name ?? "",
        imageUrl: existing?.imageUrl ?? "",
        isGroup: existing?.isGroup ?? false,
        createdById: existing?.createdById ?? null,
        unreadCount: existing?.unreadCount ?? 0,
        members: existing?.members ?? [],
        messages: [],
        lastMessagePreview: existing?.lastMessagePreview ?? null,
      },
      uiMsg,
    );
    const row = stripMessages({
      ...updated,
      unreadCount: options?.clearUnread ? 0 : updated.unreadCount,
    });
    if (idx === -1) return [row, ...prev];
    const rest = prev.filter((c) => c.id !== conversationId);
    return [row, ...rest];
  });
}

export function replaceOptimisticMessageInCaches(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
  uiMsg: Message,
  stableKey?: string,
) {
  const messageData = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(
    chatQueryKeys.messages(conversationId),
  );
  const pending = messageData?.pages
    .flatMap((page) => page.messages)
    .find((m) => m.id === tempId);
  const keepPoster = Boolean(
    pending?.imageUrl?.startsWith("blob:") &&
      (!pending.attachment || pending.imageUrl !== pending.attachment.url) &&
      !uiMsg.attachment?.thumbnailUrl,
  );
  if (pending) revokeOptimisticPreview(pending, { keepPoster });

  updateMessagesCache(queryClient, conversationId, (chat) =>
    replaceOptimisticMessage(chat, tempId, uiMsg, stableKey),
  );

  setConversationsCache(queryClient, (prev) =>
    prev.map((c) => {
      if (c.id !== conversationId) return c;
      return stripMessages(
        replaceOptimisticMessage(
          { ...c, messages: [] },
          tempId,
          uiMsg,
          stableKey,
        ),
      );
    }),
  );
}

export function patchUploadProgressInCaches(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
  percent: number,
) {
  updateMessagesCache(queryClient, conversationId, (chat) =>
    patchMessageUploadProgress(chat, tempId, percent),
  );
}

export function markOptimisticFailedInCaches(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
) {
  updateMessagesCache(queryClient, conversationId, (chat) =>
    markOptimisticMessageFailed(chat, tempId),
  );
}

export function markOptimisticCancelledInCaches(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
) {
  updateMessagesCache(queryClient, conversationId, (chat) =>
    markOptimisticMessageCancelled(chat, tempId),
  );
}

export function markOptimisticRetryingInCaches(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
) {
  updateMessagesCache(queryClient, conversationId, (chat) =>
    markOptimisticMessageRetrying(chat, tempId),
  );
}

export function applyInboxUpdateToCache(
  queryClient: QueryClient,
  conversation: ChatConversationListItemDto,
  options?: { isActiveChat?: boolean },
) {
  setConversationsCache(queryClient, (prev) => {
    const existing = prev.find((c) => c.id === conversation.id);
    const messages = existing?.messages ?? [];
    return applyInboxConversationUpdate(
      prev,
      conversation,
      messages,
      options,
    ).map(stripMessages);
  });
}

export function patchDeliveryInCaches(
  queryClient: QueryClient,
  messageId: string,
  deliveryStatus: ChatDeliveryStatus,
) {
  const queries = queryClient.getQueriesData<InfiniteData<ChatMessagesPage>>({
    queryKey: chatQueryKeys.all,
  });

  for (const [key, data] of queries) {
    if (!data || !Array.isArray(key) || key[2] !== "messages") continue;
    queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(key, {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        messages: patchMessageDelivery(
          page.messages,
          messageId,
          deliveryStatus,
        ),
      })),
    });
  }
}

export function patchPresenceInCaches(
  queryClient: QueryClient,
  userId: string,
  presence: { isOnline: boolean; lastSeenAt: string | null },
) {
  setConversationsCache(queryClient, (prev) =>
    prev.map((c) => ({
      ...c,
      members: patchMemberPresence(c.members, userId, presence),
    })),
  );
}

export function patchMessageUpdatedInCaches(
  queryClient: QueryClient,
  conversationId: string,
  dto: ChatMessageDto,
  currentUserId: string,
) {
  const uiMsg = mapMessageToUi(dto, currentUserId);
  const messageData = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(
    chatQueryKeys.messages(conversationId),
  );
  const existing = messageData?.pages
    .flatMap((page) => page.messages)
    .find((m) => m.id === uiMsg.id);
  if (
    existing?.imageUrl?.startsWith("blob:") &&
    uiMsg.attachment?.thumbnailUrl &&
    existing.imageUrl !== uiMsg.imageUrl
  ) {
    URL.revokeObjectURL(existing.imageUrl);
  }
  updateMessagesCache(queryClient, conversationId, (chat) =>
    patchMessageInChat(chat, uiMsg.id, uiMsg),
  );
}

export function applyServerMessageToCaches(
  queryClient: QueryClient,
  conversationId: string,
  dto: ChatMessageDto,
  currentUserId: string,
  options?: { isActiveChat?: boolean },
) {
  const uiMsg = mapMessageToUi(dto, currentUserId);
  const messageData = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(
    chatQueryKeys.messages(conversationId),
  );

  if (messageData) {
    const flat = messageData.pages.flatMap((p) => p.messages);
    if (flat.some((m) => m.id === uiMsg.id)) {
      if (options?.isActiveChat)
        clearUnreadInCache(queryClient, conversationId);
      return uiMsg;
    }

    if (uiMsg.isYou) {
      const pending = flat.find(
        (m) => m.sendState === "pending" && m.id.startsWith("optimistic-"),
      );
      if (pending) {
        replaceOptimisticMessageInCaches(
          queryClient,
          conversationId,
          pending.id,
          uiMsg,
          pending.stableKey,
        );
        if (options?.isActiveChat) {
          clearUnreadInCache(queryClient, conversationId);
        }
        return uiMsg;
      }
    }
  }

  appendMessageToCaches(queryClient, conversationId, uiMsg, {
    clearUnread: options?.isActiveChat,
  });
  return uiMsg;
}
