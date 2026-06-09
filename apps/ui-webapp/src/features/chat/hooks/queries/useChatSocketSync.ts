"use client";

import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { applyChatEvent } from "../../cache/reducer";
import { requireChatToken } from "../../cache/chatQueryUtils";
import type { ChatSocketModule } from "./useChatSocketModule";

type UseChatSocketSyncOptions = {
  socketModule: ChatSocketModule | null;
  currentUserId: string | null;
  selectedChatId: string | null;
  isAuthLoaded: boolean;
  getToken: () => Promise<string | null>;
  queryClient: QueryClient;
  markConversationRead: (conversationId: string) => Promise<unknown>;
};

export function useChatSocketSync({
  socketModule,
  currentUserId,
  selectedChatId,
  isAuthLoaded,
  getToken,
  queryClient,
  markConversationRead,
}: UseChatSocketSyncOptions) {
  const router = useRouter();
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;
  const markConversationReadRef = useRef(markConversationRead);
  markConversationReadRef.current = markConversationRead;

  const markActiveConversationRead = async (conversationId: string) => {
    if (selectedChatIdRef.current !== conversationId) return;
    try {
      await markConversationReadRef.current(conversationId);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!currentUserId || !isAuthLoaded || !socketModule) return;

    let cancelled = false;

    void (async () => {
      const token = requireChatToken(await getToken());
      if (cancelled) return;

      socketModule.connectChatSocket(token, {
        onMessageCreated: ({ conversationId, message }) => {
          const isActiveChat = selectedChatIdRef.current === conversationId;
          const uiMsg = applyChatEvent(
            queryClient,
            {
              type: "SERVER_MESSAGE",
              conversationId,
              dto: message,
              isActiveChat,
            },
            { currentUserId },
          );

          if (isActiveChat && uiMsg) {
            if (!uiMsg.isYou) {
              socketModule.emitAckDelivered(conversationId, [message.id]);
            }
            void markActiveConversationRead(conversationId);
          }
        },
        onConversationUpdated: ({ conversation }) => {
          const isActiveChat = selectedChatIdRef.current === conversation.id;
          applyChatEvent(
            queryClient,
            {
              type: "INBOX_UPDATE",
              conversation,
              isActiveChat,
            },
            { currentUserId },
          );
          if (isActiveChat) {
            void markActiveConversationRead(conversation.id);
          }
        },
        onMessagesDelivered: ({ messageId, deliveryStatus }) => {
          applyChatEvent(
            queryClient,
            { type: "DELIVERY_PATCH", messageId, deliveryStatus },
            { currentUserId },
          );
        },
        onConversationRemoved: ({ conversationId }) => {
          applyChatEvent(
            queryClient,
            { type: "REMOVE_CONVERSATION", conversationId },
            { currentUserId },
          );
          if (selectedChatIdRef.current === conversationId) {
            router.replace("/dashboard/chats");
          }
        },
        onPresenceUpdated: ({ userId, isOnline, lastSeenAt }) => {
          applyChatEvent(
            queryClient,
            { type: "PRESENCE_PATCH", userId, isOnline, lastSeenAt },
            { currentUserId },
          );
        },
      });
    })();

    return () => {
      cancelled = true;
      socketModule.disconnectChatSocket();
    };
  }, [currentUserId, isAuthLoaded, getToken, queryClient, router, socketModule]);
}
