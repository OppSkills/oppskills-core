"use client";

import { io, type Socket } from "socket.io-client";
import { getApiRootUrl } from "@/lib/api/apiClient";
import type {
  ChatConversationListItemDto,
  ChatDeliveryStatus,
  ChatMessageDto,
} from "@oppskills/types";
import type { SendChatMessageDto } from "@oppskills/types";

let socket: Socket | null = null;
let handlers: ChatSocketHandlers = {};

export type PresenceUpdatedPayload = {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
};

export type ChatSocketHandlers = {
  onMessageCreated?: (payload: {
    conversationId: string;
    message: ChatMessageDto;
  }) => void;
  onConversationUpdated?: (payload: {
    conversation: ChatConversationListItemDto;
  }) => void;
  onMessagesDelivered?: (payload: {
    conversationId: string;
    messageId: string;
    deliveryStatus: ChatDeliveryStatus;
  }) => void;
  onConversationRemoved?: (payload: { conversationId: string }) => void;
  onPresenceUpdated?: (payload: PresenceUpdatedPayload) => void;
};

const PRESENCE_HEARTBEAT_MS = 30_000;
let presenceHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

function stopPresenceHeartbeat() {
  if (presenceHeartbeatTimer) {
    clearInterval(presenceHeartbeatTimer);
    presenceHeartbeatTimer = null;
  }
}

function emitPresenceHeartbeat(sock: Socket) {
  if (!sock.connected) return;
  sock.emit("presence_heartbeat");
}

function startPresenceHeartbeat(sock: Socket) {
  stopPresenceHeartbeat();
  emitPresenceHeartbeat(sock);
  presenceHeartbeatTimer = setInterval(
    () => emitPresenceHeartbeat(sock),
    PRESENCE_HEARTBEAT_MS,
  );
}

function attachHandlers(sock: Socket) {
  sock.off("message_created");
  sock.off("conversation_updated");
  sock.off("messages_delivered");
  sock.off("conversation_removed");
  sock.off("presence_updated");
  sock.off("connect");
  sock.off("disconnect");

  sock.on("message_created", (payload) => {
    handlers.onMessageCreated?.(payload);
  });
  sock.on("conversation_updated", (payload) => {
    handlers.onConversationUpdated?.(payload);
  });
  sock.on("messages_delivered", (payload) => {
    handlers.onMessagesDelivered?.(payload);
  });
  sock.on("conversation_removed", (payload) => {
    handlers.onConversationRemoved?.(payload);
  });
  sock.on("presence_updated", (payload: PresenceUpdatedPayload) => {
    handlers.onPresenceUpdated?.(payload);
  });
  sock.on("connect", () => startPresenceHeartbeat(sock));
  sock.on("disconnect", () => stopPresenceHeartbeat());
}

export function connectChatSocket(
  token: string,
  nextHandlers: ChatSocketHandlers,
): Socket {
  handlers = nextHandlers;

  if (!socket) {
    socket = io(`${getApiRootUrl()}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
    attachHandlers(socket);
  }

  socket.auth = { token };
  attachHandlers(socket);

  if (!socket.connected) {
    socket.connect();
  } else {
    startPresenceHeartbeat(socket);
  }

  return socket;
}

export function disconnectChatSocket() {
  stopPresenceHeartbeat();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  handlers = {};
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function joinConversation(conversationId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve(false);
      return;
    }
    socket.emit(
      "join_conversation",
      { conversationId },
      (res: { ok?: boolean }) => {
        resolve(res?.ok === true);
      },
    );
  });
}

export function leaveConversation(conversationId: string) {
  socket?.emit("leave_conversation", { conversationId });
}

export function emitSendMessage(
  conversationId: string,
  payload: SendChatMessageDto,
): Promise<ChatMessageDto | null> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve(null);
      return;
    }
    socket.emit(
      "send_message",
      { conversationId, ...payload },
      (res: { ok?: boolean; message?: ChatMessageDto }) => {
        if (res?.ok && res.message) {
          resolve(res.message);
        } else {
          resolve(null);
        }
      },
    );
  });
}

export function emitAckDelivered(conversationId: string, messageIds: string[]) {
  socket?.emit("ack_delivered", { conversationId, messageIds });
}
