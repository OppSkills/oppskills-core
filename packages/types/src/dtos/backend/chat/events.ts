import type {
  ChatConversationListItemDto,
  ChatDeliveryStatus,
  ChatMessageDto,
} from "./index";

export type ChatMessageCreatedEvent = Readonly<{
  conversationId: string;
  message: ChatMessageDto;
}>;

export type ChatConversationUpdatedEvent = Readonly<{
  conversation: ChatConversationListItemDto;
}>;

export type ChatMessagesDeliveredEvent = Readonly<{
  conversationId: string;
  messageId: string;
  deliveryStatus: ChatDeliveryStatus;
}>;

export type ChatConversationRemovedEvent = Readonly<{
  conversationId: string;
}>;

export type ChatPresenceUpdatedEvent = Readonly<{
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}>;

export type ChatSocketServerEvent =
  | { type: "message_created"; payload: ChatMessageCreatedEvent }
  | { type: "conversation_updated"; payload: ChatConversationUpdatedEvent }
  | { type: "messages_delivered"; payload: ChatMessagesDeliveredEvent }
  | { type: "conversation_removed"; payload: ChatConversationRemovedEvent }
  | { type: "presence_updated"; payload: ChatPresenceUpdatedEvent };
