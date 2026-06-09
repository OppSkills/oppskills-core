import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { mapMessageToUi } from "../domain/mappers";
import type { Chat, Message } from "../domain/types";
import type { ChatClientEvent, ChatReducerContext } from "./events";
import { chatQueryKeys } from "./chatQueryKeys";
import type { ChatMessagesPage } from "./chatQueryUtils";
import {
  appendMessageToCaches,
  applyConversationDetailToCache,
  applyInboxUpdateToCache,
  applyServerMessageToCaches,
  clearUnreadInCache,
  markOptimisticFailedInCaches,
  patchDeliveryInCaches,
  patchPresenceInCaches,
  patchUploadProgressInCaches,
  removeConversationFromCache,
  replaceOptimisticMessageInCaches,
  upsertConversationInCache,
} from "./chatCacheUpdates";

export function applyChatEvent(
  queryClient: QueryClient,
  event: ChatClientEvent,
  ctx: ChatReducerContext,
): Message | void {
  switch (event.type) {
    case "OPTIMISTIC_APPEND":
      appendMessageToCaches(queryClient, event.conversationId, event.message);
      return;
    case "OPTIMISTIC_REPLACE":
      replaceOptimisticMessageInCaches(
        queryClient,
        event.conversationId,
        event.tempId,
        event.message,
        event.stableKey,
      );
      return;
    case "UPLOAD_PROGRESS":
      patchUploadProgressInCaches(
        queryClient,
        event.conversationId,
        event.tempId,
        event.percent,
      );
      return;
    case "OPTIMISTIC_FAILED":
      markOptimisticFailedInCaches(
        queryClient,
        event.conversationId,
        event.tempId,
      );
      return;
    case "SERVER_MESSAGE":
      return applyServerMessageToCaches(
        queryClient,
        event.conversationId,
        event.dto,
        ctx.currentUserId,
        { isActiveChat: event.isActiveChat },
      );
    case "INBOX_UPDATE":
      applyInboxUpdateToCache(queryClient, event.conversation, {
        isActiveChat: event.isActiveChat,
      });
      return;
    case "CONVERSATION_DETAIL":
      applyConversationDetailToCache(
        queryClient,
        event.conversationId,
        event.detail,
      );
      return;
    case "UPSERT_CONVERSATION":
      upsertConversationInCache(queryClient, event.item);
      return;
    case "REMOVE_CONVERSATION":
      removeConversationFromCache(queryClient, event.conversationId);
      return;
    case "CLEAR_UNREAD":
      clearUnreadInCache(queryClient, event.conversationId);
      return;
    case "DELIVERY_PATCH":
      patchDeliveryInCaches(
        queryClient,
        event.messageId,
        event.deliveryStatus,
      );
      return;
    case "PRESENCE_PATCH":
      patchPresenceInCaches(queryClient, event.userId, {
        isOnline: event.isOnline,
        lastSeenAt: event.lastSeenAt,
      });
      return;
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/** Maps a socket server payload to cache events. */
export function serverMessageEvent(
  conversationId: string,
  dto: Parameters<typeof mapMessageToUi>[0],
  isActiveChat: boolean,
): ChatClientEvent {
  return {
    type: "SERVER_MESSAGE",
    conversationId,
    dto,
    isActiveChat,
  };
}

export type { Chat, Message };
export type { InfiniteData, ChatMessagesPage };
