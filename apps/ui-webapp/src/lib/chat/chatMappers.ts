import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatDeliveryStatus,
  ChatMemberDto,
  ChatMessageDto,
} from "@oppskills/types";
import type { Chat, ChatMemberUi, Message } from "./types";

export function memberDisplayName(m: ChatMemberDto): string {
  const parts = [m.firstName, m.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  const local = m.email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function mapMessageToUi(
  m: ChatMessageDto,
  currentUserId: string,
): Message {
  const isYou = m.senderId === currentUserId;
  let imageUrl: string | undefined;
  let attachment: Message["attachment"];

  if (m.attachment) {
    if (m.attachment.kind === "IMAGE") {
      imageUrl = m.attachment.url;
    } else {
      const kind = m.attachment.kind;
      attachment = {
        name: m.attachment.fileName,
        type: kind === "VIDEO" ? "video" : "document",
        size: m.attachment.sizeBytes
          ? formatBytes(m.attachment.sizeBytes)
          : undefined,
        url: m.attachment.url,
      };
      if (kind === "VIDEO") {
        imageUrl = m.attachment.url;
      }
    }
  }

  return {
    id: m.id,
    type: m.type,
    senderId: m.senderId,
    senderName: isYou ? "You" : m.senderName,
    text: m.body ?? "",
    timestamp: m.createdAt,
    isYou,
    imageUrl,
    deliveryStatus: m.deliveryStatus ?? undefined,
    replyTo: m.replyTo
      ? {
          senderName: m.replyTo.senderName,
          text: m.replyTo.text,
          messageId: m.replyTo.messageId,
        }
      : undefined,
    attachment,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function lastMessagePreviewFromMessage(
  m: Message,
): ChatConversationListItemDto["lastMessage"] {
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    type: m.type ?? "TEXT",
    body: m.text,
    createdAt: m.timestamp,
  };
}

export function formatLastMessagePreview(
  preview: ChatConversationListItemDto["lastMessage"],
  chat: Pick<Chat, "isGroup">,
  currentUserId: string | null,
): string {
  if (!preview) return "No messages yet";
  const isYou = currentUserId != null && preview.senderId === currentUserId;
  const senderLabel = isYou ? "You" : preview.senderName;

  if (
    preview.type === "IMAGE" ||
    preview.type === "VIDEO" ||
    preview.type === "DOCUMENT"
  ) {
    const label =
      preview.type === "IMAGE"
        ? "Photo"
        : preview.type === "VIDEO"
          ? "Video"
          : preview.body ?? "Document";
    return isYou
      ? `You: Sent an attachment (${label})`
      : `${senderLabel}: Sent an attachment (${label})`;
  }

  const text = preview.body ?? "";
  if (isYou) return `You: ${text}`;
  if (chat.isGroup) return `${senderLabel}: ${text}`;
  return text;
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&h=150&q=80";

export function mapMemberToUi(m: ChatMemberDto) {
  return {
    id: m.id,
    name: memberDisplayName(m),
    email: m.email,
    avatar: m.imageUrl ?? DEFAULT_AVATAR,
    isAdmin: m.isAdmin,
    presence: m.presence,
  };
}

export function patchMemberPresence(
  members: ChatMemberUi[],
  userId: string,
  presence: { isOnline: boolean; lastSeenAt: string | null },
): ChatMemberUi[] {
  return members.map((m) =>
    m.id === userId ? { ...m, presence } : m,
  );
}

/** Update inbox row without reordering unless there is new message activity. */
export function applyInboxConversationUpdate(
  prev: Chat[],
  conversation: ChatConversationListItemDto,
  existingMessages: Message[],
  options?: { isActiveChat?: boolean },
): Chat[] {
  const idx = prev.findIndex((c) => c.id === conversation.id);
  const updated = {
    ...mapConversationToUi(conversation, existingMessages),
    ...(options?.isActiveChat ? { unreadCount: 0 } : {}),
  };

  if (idx === -1) {
    return [updated, ...prev];
  }

  const existing = prev[idx]!;
  const prevLastId = existing.lastMessagePreview?.id ?? null;
  const nextLastId = conversation.lastMessage?.id ?? null;
  const hasNewMessageActivity =
    nextLastId !== null && nextLastId !== prevLastId;

  if (hasNewMessageActivity) {
    const rest = prev.filter((c) => c.id !== conversation.id);
    return [updated, ...rest];
  }

  const next = [...prev];
  next[idx] = updated;
  return next;
}

export function mapConversationToUi(
  c: ChatConversationListItemDto,
  messages: Message[] = [],
): Chat {
  const lastFromMessages =
    messages.length > 0 ? lastMessagePreviewFromMessage(messages[messages.length - 1]!) : null;

  return {
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl ?? DEFAULT_AVATAR,
    isGroup: c.isGroup,
    createdById: c.createdById,
    unreadCount: c.unreadCount,
    members: c.members.map(mapMemberToUi),
    messages,
    lastMessagePreview: c.lastMessage ?? lastFromMessages,
  };
}

export function mergeChatFromDetail(
  existing: Chat | undefined,
  detail: ChatConversationDetailDto,
): Chat {
  const listShape: ChatConversationListItemDto = {
    id: detail.id,
    type: detail.type,
    name: detail.name,
    imageUrl: detail.imageUrl,
    handle: detail.handle,
    isGroup: detail.isGroup,
    createdById: detail.createdById,
    unreadCount: existing?.unreadCount ?? 0,
    lastMessage: existing?.lastMessagePreview ?? null,
    members: detail.members,
  };
  const base = mapConversationToUi(listShape, existing?.messages ?? []);
  return {
    ...base,
    name: detail.name,
    imageUrl: detail.imageUrl ?? DEFAULT_AVATAR,
    members: detail.members.map(mapMemberToUi),
  };
}

export function appendMessageToChat(chat: Chat, message: Message): Chat {
  const hasMessage = chat.messages.some((m) => m.id === message.id);
  const messages = hasMessage ? chat.messages : [...chat.messages, message];
  return {
    ...chat,
    messages,
    lastMessagePreview: lastMessagePreviewFromMessage(message),
  };
}

export function patchMessageUploadProgress(
  chat: Chat,
  tempId: string,
  percent: number,
): Chat {
  return {
    ...chat,
    messages: chat.messages.map((m) =>
      m.id === tempId
        ? { ...m, uploadProgress: percent, sendState: "pending" as const }
        : m,
    ),
  };
}

export function replaceOptimisticMessage(
  chat: Chat,
  tempId: string,
  message: Message,
  stableKey?: string,
): Chat {
  const idx = chat.messages.findIndex((m) => m.id === tempId);
  const merged: Message = {
    ...message,
    stableKey: stableKey ?? chat.messages[idx]?.stableKey ?? message.stableKey,
    sendState: undefined,
    uploadProgress: undefined,
  };

  if (idx >= 0) {
    const messages = [...chat.messages];
    messages[idx] = merged;
    return {
      ...chat,
      messages,
      lastMessagePreview: lastMessagePreviewFromMessage(merged),
    };
  }

  const without = chat.messages.filter(
    (m) => m.id !== tempId && m.id !== message.id,
  );
  const messages = [...without, merged].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  return {
    ...chat,
    messages,
    lastMessagePreview: lastMessagePreviewFromMessage(merged),
  };
}

export function markOptimisticMessageFailed(
  chat: Chat,
  tempId: string,
): Chat {
  return {
    ...chat,
    messages: chat.messages.map((m) =>
      m.id === tempId ? { ...m, sendState: "failed" as const } : m,
    ),
  };
}

export function patchMessageDelivery(
  messages: Message[],
  messageId: string,
  status: ChatDeliveryStatus,
): Message[] {
  return messages.map((m) =>
    m.id === messageId ? { ...m, deliveryStatus: status } : m,
  );
}
