"use client";

import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { markConversationRead } from "@/lib/api/chatApi";
import {
  applyInboxUpdateToCache,
  applyServerMessageToCaches,
  clearUnreadInCache,
  patchDeliveryInCaches,
  patchPresenceInCaches,
  removeConversationFromCache,
} from "./chatCacheUpdates";
import { requireChatToken } from "./chatQueryUtils";
import type { ChatSocketModule } from "./useChatSocketModule";

type UseChatSocketSyncOptions = {
  socketModule: ChatSocketModule | null;
  currentUserId: string | null;
  selectedChatId: string | null;
  isAuthLoaded: boolean;
  getToken: () => Promise<string | null>;
  queryClient: QueryClient;
};

export function useChatSocketSync({
  socketModule,
  currentUserId,
  selectedChatId,
  isAuthLoaded,
  getToken,
  queryClient,
}: UseChatSocketSyncOptions) {
  const router = useRouter();
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const markActiveConversationRead = async (conversationId: string) => {
    if (selectedChatIdRef.current !== conversationId) return;
    try {
      const token = requireChatToken(await getToken());
      await markConversationRead(token, conversationId);
      clearUnreadInCache(queryClient, conversationId);
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
          const uiMsg = applyServerMessageToCaches(
            queryClient,
            conversationId,
            message,
            currentUserId,
            { isActiveChat },
          );

          if (isActiveChat) {
            if (!uiMsg.isYou) {
              socketModule.emitAckDelivered(conversationId, [message.id]);
            }
            void markActiveConversationRead(conversationId);
          }
        },
        onConversationUpdated: ({ conversation }) => {
          const isActiveChat = selectedChatIdRef.current === conversation.id;
          applyInboxUpdateToCache(queryClient, conversation, { isActiveChat });
          if (isActiveChat) {
            void markActiveConversationRead(conversation.id);
          }
        },
        onMessagesDelivered: ({ messageId, deliveryStatus }) => {
          patchDeliveryInCaches(queryClient, messageId, deliveryStatus);
        },
        onConversationRemoved: ({ conversationId }) => {
          removeConversationFromCache(queryClient, conversationId);
          if (selectedChatIdRef.current === conversationId) {
            router.replace("/dashboard/chats");
          }
        },
        onPresenceUpdated: ({ userId, isOnline, lastSeenAt }) => {
          patchPresenceInCaches(queryClient, userId, {
            isOnline,
            lastSeenAt,
          });
        },
      });
    })();

    return () => {
      cancelled = true;
      socketModule.disconnectChatSocket();
    };
  }, [currentUserId, isAuthLoaded, getToken, queryClient, router, socketModule]);
}
