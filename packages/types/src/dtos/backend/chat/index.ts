export type ChatDeliveryStatus = "SENT" | "DELIVERED";

export type ChatConversationType = "DIRECT" | "GROUP";

export type ChatMessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "SYSTEM";

export type ChatAttachmentKind = "IMAGE" | "VIDEO" | "DOCUMENT";

export type ChatUserPresenceDto = Readonly<{
  isOnline: boolean;
  /** ISO-8601 when last went offline; null if never seen since deploy */
  lastSeenAt: string | null;
}>;

export type ChatMemberDto = Readonly<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  /** Group creator / admin (derived from conversation.createdById) */
  isAdmin: boolean;
  /** Omitted for the authenticated viewer; populated for other members */
  presence?: ChatUserPresenceDto;
}>;

export type ChatReplyPreviewDto = Readonly<{
  messageId: string;
  senderName: string;
  text: string;
}>;

export type ChatAttachmentDto = Readonly<{
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  url: string;
  kind: ChatAttachmentKind;
}>;

export type ChatMessageDto = Readonly<{
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: ChatMessageType;
  body: string | null;
  createdAt: string;
  replyTo: ChatReplyPreviewDto | null;
  attachment: ChatAttachmentDto | null;
  deliveryStatus: ChatDeliveryStatus | null;
}>;

export type ChatLastMessagePreviewDto = Readonly<{
  id: string;
  senderId: string;
  senderName: string;
  type: ChatMessageType;
  body: string | null;
  createdAt: string;
}>;

export type ChatConversationListItemDto = Readonly<{
  id: string;
  type: ChatConversationType;
  name: string;
  imageUrl: string | null;
  handle: string | null;
  isGroup: boolean;
  /** Group creator user id; null for direct chats */
  createdById: string | null;
  unreadCount: number;
  lastMessage: ChatLastMessagePreviewDto | null;
  members: ChatMemberDto[];
}>;

export type ChatCursorPageDto<T> = Readonly<{
  data: T[];
  hasMore: boolean;
  nextCursor: string | null;
}>;

export type ChatSearchResultDto = Readonly<{
  conversations: ChatConversationListItemDto[];
  users: ChatMemberDto[];
}>;

export type ChatConversationDetailDto = Readonly<{
  id: string;
  type: ChatConversationType;
  name: string;
  imageUrl: string | null;
  handle: string | null;
  isGroup: boolean;
  createdById: string | null;
  members: ChatMemberDto[];
  createdAt: string;
}>;

export type UpdateGroupConversationDto = Readonly<{
  imageUrl: string;
}>;

export type ChatMemberProfileDto = Readonly<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  skills: string[];
  interests: string[];
  collegeName: string | null;
}>;

export type CreateDirectConversationDto = Readonly<{
  otherUserId: string;
}>;

export type CreateGroupConversationDto = Readonly<{
  name: string;
  handle?: string;
  memberIds: string[];
}>;

export type SendChatMessageDto = Readonly<{
  type?: ChatMessageType;
  body?: string;
  replyToMessageId?: string;
  attachment?: {
    fileName: string;
    mimeType: string;
    sizeBytes?: number;
    url: string;
    kind: ChatAttachmentKind;
  };
}>;

export type AckDeliveredDto = Readonly<{
  messageIds: string[];
}>;
