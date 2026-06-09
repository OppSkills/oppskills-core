import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatDeliveryStatus,
  ChatMessageDto,
} from "@oppskills/types";
import type { Message } from "../domain/types";

/** Frontend-only cache events (optimistic UI lifecycle). */
export type ChatOptimisticAppendEvent = Readonly<{
  type: "OPTIMISTIC_APPEND";
  conversationId: string;
  message: Message;
}>;

export type ChatOptimisticReplaceEvent = Readonly<{
  type: "OPTIMISTIC_REPLACE";
  conversationId: string;
  tempId: string;
  message: Message;
  stableKey?: string;
}>;

export type ChatUploadProgressEvent = Readonly<{
  type: "UPLOAD_PROGRESS";
  conversationId: string;
  tempId: string;
  percent: number;
}>;

export type ChatOptimisticFailedEvent = Readonly<{
  type: "OPTIMISTIC_FAILED";
  conversationId: string;
  tempId: string;
}>;

export type ChatServerMessageEvent = Readonly<{
  type: "SERVER_MESSAGE";
  conversationId: string;
  dto: ChatMessageDto;
  isActiveChat?: boolean;
}>;

export type ChatInboxUpdateEvent = Readonly<{
  type: "INBOX_UPDATE";
  conversation: ChatConversationListItemDto;
  isActiveChat?: boolean;
}>;

export type ChatConversationDetailEvent = Readonly<{
  type: "CONVERSATION_DETAIL";
  conversationId: string;
  detail: ChatConversationDetailDto;
}>;

export type ChatUpsertConversationEvent = Readonly<{
  type: "UPSERT_CONVERSATION";
  item: ChatConversationListItemDto;
}>;

export type ChatRemoveConversationEvent = Readonly<{
  type: "REMOVE_CONVERSATION";
  conversationId: string;
}>;

export type ChatClearUnreadEvent = Readonly<{
  type: "CLEAR_UNREAD";
  conversationId: string;
}>;

export type ChatDeliveryPatchEvent = Readonly<{
  type: "DELIVERY_PATCH";
  messageId: string;
  deliveryStatus: ChatDeliveryStatus;
}>;

export type ChatPresencePatchEvent = Readonly<{
  type: "PRESENCE_PATCH";
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}>;

export type ChatClientEvent =
  | ChatOptimisticAppendEvent
  | ChatOptimisticReplaceEvent
  | ChatUploadProgressEvent
  | ChatOptimisticFailedEvent
  | ChatServerMessageEvent
  | ChatInboxUpdateEvent
  | ChatConversationDetailEvent
  | ChatUpsertConversationEvent
  | ChatRemoveConversationEvent
  | ChatClearUnreadEvent
  | ChatDeliveryPatchEvent
  | ChatPresencePatchEvent;

export type ChatReducerContext = Readonly<{
  currentUserId: string;
}>;
