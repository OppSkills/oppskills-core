import type {
  ChatDeliveryStatus,
  ChatLastMessagePreviewDto,
  ChatMessageType,
  ChatUserPresenceDto,
} from "@oppskills/types";

/** Client-only upload state for optimistic outgoing messages */
export type MessageSendState = "pending" | "failed" | "cancelled";

export interface Message {
  type?: ChatMessageType;
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isYou: boolean;
  imageUrl?: string;
  imageBadgeText?: string;
  imageTopRightText?: string;
  deliveryStatus?: ChatDeliveryStatus;
  /** Shown as clock icon while upload/send is in progress */
  sendState?: MessageSendState;
  /** 0–100 while uploading (optimistic outgoing media) */
  uploadProgress?: number;
  /** Stable React key across optimistic → server message transition */
  stableKey?: string;
  replyTo?: {
    senderName: string;
    text: string;
    messageId: string;
  };
  attachment?: {
    name: string;
    type: "document" | "image" | "video";
    size?: string;
    url: string;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
  };
}

export interface ChatMemberUi {
  id: string;
  name: string;
  avatar: string;
  email: string;
  isAdmin: boolean;
  presence?: ChatUserPresenceDto;
}

export interface Chat {
  id: string;
  name: string;
  imageUrl: string;
  isGroup: boolean;
  createdById: string | null;
  unreadCount: number;
  members: ChatMemberUi[];
  messages: Message[];
  /** Inbox preview when full message history is not loaded yet */
  lastMessagePreview: ChatLastMessagePreviewDto | null;
}

export interface SearchUserHit {
  id: string;
  name: string;
  avatar: string;
  email: string;
}
