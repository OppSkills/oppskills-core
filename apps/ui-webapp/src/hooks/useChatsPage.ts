"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
} from "@oppskills/types";
import {
  createDirectConversation,
  createGroupConversation,
  deleteChat as deleteChatApi,
  deleteGroup as deleteGroupApi,
  leaveGroup as leaveGroupApi,
  markConversationRead,
  removeGroupMember as removeGroupMemberApi,
  sendMessage as sendMessageApi,
  updateGroupConversation,
} from "@/lib/api/chatApi";
import { mapMessageToUi } from "@/lib/chat/chatMappers";
import type { Chat, SearchUserHit } from "@/lib/chat/types";
import {
  type PendingAttachment,
  type PendingAttachmentKind,
} from "@/lib/chat/attachmentTypes";
import { useDebounce } from "@/hooks/use-debounce";
import {
  applyConversationDetailToCache,
  applyServerMessageToCaches,
  appendMessageToCaches,
  clearUnreadInCache,
  markOptimisticFailedInCaches,
  patchUploadProgressInCaches,
  removeConversationFromCache,
  replaceOptimisticMessageInCaches,
  setConversationsCache,
  upsertConversationInCache,
} from "@/hooks/chat/chatCacheUpdates";
import { chatQueryKeys } from "@/hooks/chat/chatQueryKeys";
import {
  mergeConversationsWithMessageCaches,
  requireChatToken,
  type ChatMessagesPage,
} from "@/hooks/chat/chatQueryUtils";
import { useChatConversation } from "@/hooks/chat/useChatConversation";
import { useChatConversations } from "@/hooks/chat/useChatConversations";
import { useChatGroupMemberSearch } from "@/hooks/chat/useChatGroupMemberSearch";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useChatSearch } from "@/hooks/chat/useChatSearch";
import {
  useChatMemberProfile,
  useChatSidebarAttachments,
} from "@/hooks/chat/useChatSidebarData";
import { useChatSocketModule } from "@/hooks/chat/useChatSocketModule";
import { useChatSocketSync } from "@/hooks/chat/useChatSocketSync";

export function useChatsPage(selectedChatId: string | null) {
  const { getToken, isLoaded, userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentUserId = clerkUserId ?? null;

  const [inboxSearchInput, setInboxSearchInput] = useState("");
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const debouncedInboxSearch = useDebounce(inboxSearchInput, 300);
  const debouncedGroupSearch = useDebounce(groupSearchInput, 300);

  const [sidebarRequest, setSidebarRequest] = useState<{
    conversationId: string;
    otherMemberId?: string;
  } | null>(null);

  const conversationsQuery = useChatConversations();
  const inboxSearchQuery = useChatSearch(debouncedInboxSearch);
  const groupMemberSearchQuery = useChatGroupMemberSearch(
    debouncedGroupSearch,
    currentUserId,
  );
  const messagesQuery = useChatMessages(selectedChatId, currentUserId);

  const sidebarAttachmentsQuery = useChatSidebarAttachments(
    sidebarRequest?.conversationId ?? null,
    { enabled: !!sidebarRequest },
  );
  const memberProfileQuery = useChatMemberProfile(
    sidebarRequest?.conversationId ?? null,
    sidebarRequest?.otherMemberId,
    { enabled: !!sidebarRequest?.otherMemberId },
  );

  const socketModule = useChatSocketModule();

  useChatSocketSync({
    socketModule,
    currentUserId,
    selectedChatId,
    isAuthLoaded: isLoaded,
    getToken,
    queryClient,
  });

  const prevChatIdRef = useRef<string | null>(null);
  const roomGenerationRef = useRef(0);
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const baseConversations = conversationsQuery.data ?? [];
  const conversationInList = useMemo(
    () =>
      selectedChatId
        ? baseConversations.some((chat) => chat.id === selectedChatId)
        : false,
    [baseConversations, selectedChatId],
  );

  const missingConversationQuery = useChatConversation(selectedChatId ?? "", {
    enabled:
      !!selectedChatId &&
      !conversationsQuery.isLoading &&
      !conversationInList &&
      debouncedInboxSearch.length === 0,
  });

  useEffect(() => {
    const detail = missingConversationQuery.data;
    if (!detail) return;
    upsertConversationInCache(queryClient, {
      id: detail.id,
      type: detail.type,
      name: detail.name,
      imageUrl: detail.imageUrl,
      handle: detail.handle,
      isGroup: detail.isGroup,
      createdById: detail.createdById,
      unreadCount: 0,
      lastMessage: null,
      members: detail.members,
    });
  }, [missingConversationQuery.data, queryClient]);

  useEffect(() => {
    if (missingConversationQuery.isError) {
      router.replace("/dashboard/chats");
    }
  }, [missingConversationQuery.isError, router]);

  const chats = useMemo(() => {
    const source = debouncedInboxSearch
      ? (inboxSearchQuery.data?.conversations ?? [])
      : baseConversations;
    return mergeConversationsWithMessageCaches(source, queryClient);
  }, [
    debouncedInboxSearch,
    inboxSearchQuery.data,
    baseConversations,
    queryClient,
    messagesQuery.data,
  ]);

  const searchUsers: SearchUserHit[] = debouncedInboxSearch
    ? (inboxSearchQuery.data?.users ?? [])
    : [];

  const groupSearchUsers: SearchUserHit[] = debouncedGroupSearch
    ? (groupMemberSearchQuery.data ?? [])
    : [];

  const loading = conversationsQuery.isLoading;
  const messagesLoading =
    messagesQuery.isLoading ||
    (messagesQuery.isFetching && !messagesQuery.data);
  const hasOlderMessages = messagesQuery.hasNextPage ?? false;

  const getTokenSafe = useCallback(async () => {
    return requireChatToken(await getToken());
  }, [getToken]);

  const refreshConversations = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: chatQueryKeys.conversations(),
    });
  }, [queryClient]);

  const setChats = useCallback(
    (val: Chat[] | ((prev: Chat[]) => Chat[])) => {
      setConversationsCache(queryClient, (prev) => {
        const current = mergeConversationsWithMessageCaches(prev, queryClient);
        const next = typeof val === "function" ? val(current) : val;
        return next.map((chat) => ({ ...chat, messages: [] }));
      });
    },
    [queryClient],
  );

  const runSearch = useCallback(
    (query: string) => {
      setInboxSearchInput(query);
      if (query.trim().length === 0) {
        void queryClient.invalidateQueries({
          queryKey: chatQueryKeys.conversations(),
        });
      }
    },
    [queryClient],
  );

  const runGroupMemberSearch = useCallback((query: string) => {
    setGroupSearchInput(query);
  }, []);

  useEffect(() => {
    if (!selectedChatId || !currentUserId || !socketModule) {
      if (!selectedChatId) prevChatIdRef.current = null;
      return;
    }

    const generation = ++roomGenerationRef.current;
    const chatId = selectedChatId;
    const previousChatId = prevChatIdRef.current;

    if (previousChatId && previousChatId !== chatId) {
      socketModule.leaveConversation(previousChatId);
    }
    prevChatIdRef.current = chatId;

    clearUnreadInCache(queryClient, chatId);

    void socketModule.joinConversation(chatId).then(() => {
      if (generation !== roomGenerationRef.current) return;
      void (async () => {
        try {
          const token = requireChatToken(await getToken());
          if (generation !== roomGenerationRef.current) return;
          await markConversationRead(token, chatId);
        } catch (e) {
          console.error(e);
        }
      })();
    });

    return () => {
      if (generation !== roomGenerationRef.current) return;
      socketModule.leaveConversation(chatId);
      roomGenerationRef.current += 1;
    };
  }, [selectedChatId, currentUserId, queryClient, getToken, socketModule]);

  useEffect(() => {
    if (
      !messagesQuery.data ||
      !selectedChatId ||
      !currentUserId ||
      !socketModule
    ) {
      return;
    }
    const lastPage =
      messagesQuery.data.pages[messagesQuery.data.pages.length - 1];
    if (!lastPage) return;

    const ids = lastPage.messages.filter((m) => !m.isYou).map((m) => m.id);
    if (ids.length === 0) return;

    socketModule.emitAckDelivered(selectedChatId, ids);
  }, [messagesQuery.data, selectedChatId, currentUserId, socketModule]);

  const loadOlderMessages = useCallback(async () => {
    if (!messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) return;
    await messagesQuery.fetchNextPage();
  }, [messagesQuery]);

  const openUserChat = useCallback(
    async (otherUserId: string) => {
      const token = await getTokenSafe();
      const conv = await createDirectConversation(token, otherUserId);
      const listItem: ChatConversationListItemDto = {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        imageUrl: conv.imageUrl,
        handle: conv.handle,
        isGroup: conv.isGroup,
        createdById: conv.createdById,
        unreadCount: 0,
        lastMessage: null,
        members: conv.members,
      };
      upsertConversationInCache(queryClient, listItem);
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [getTokenSafe, queryClient, router],
  );

  const sendTextMessage = useCallback(
    async (conversationId: string, text: string, replyToMessageId?: string) => {
      if (!currentUserId || !socketModule) return;

      const payload = {
        type: "TEXT" as const,
        body: text,
        replyToMessageId,
      };

      await socketModule.joinConversation(conversationId);

      let saved = await socketModule.emitSendMessage(conversationId, payload);
      if (!saved) {
        const token = await getTokenSafe();
        saved = await sendMessageApi(token, conversationId, payload);
      }
      if (saved) {
        applyServerMessageToCaches(
          queryClient,
          conversationId,
          saved,
          currentUserId,
          { isActiveChat: selectedChatIdRef.current === conversationId },
        );
      }
    },
    [currentUserId, getTokenSafe, queryClient, socketModule],
  );

  const uploadChatFile = useCallback(
    async (
      token: string,
      file: File,
      kind: PendingAttachmentKind,
      onProgress?: (percent: number) => void,
    ) => {
      const [
        { presignDocumentUpload, presignImageUpload },
        { fileForChatUpload, resolveChatUploadMime },
        { uploadDocumentToS3WithProgress, uploadImageToS3WithProgress },
      ] = await Promise.all([
        import("@/lib/api/mediaApi"),
        import("@/lib/chat/uploadMime"),
        import("@/lib/chat/uploadWithProgress"),
      ]);

      const mime = resolveChatUploadMime(file, kind);
      const uploadFile = fileForChatUpload(file, mime);
      onProgress?.(5);

      if (kind === "image") {
        const presign = await presignImageUpload(token, {
          purpose: "CHAT_ATTACHMENT",
          mimeType: mime,
        });
        onProgress?.(15);
        await uploadImageToS3WithProgress({
          presign,
          file: uploadFile,
          onProgress: (p) => onProgress?.(15 + Math.round(p * 0.75)),
        });
        onProgress?.(95);
        return {
          url: presign.publicUrl,
          type: "IMAGE" as const,
          kind: "IMAGE" as const,
          mime,
        };
      }

      const isVideo = kind === "video";
      const attachmentKind = isVideo
        ? ("VIDEO" as const)
        : ("DOCUMENT" as const);
      const presign = await presignDocumentUpload(token, {
        purpose: "CHAT_ATTACHMENT",
        mimeType: mime,
        fileName: file.name,
      });
      onProgress?.(15);
      await uploadDocumentToS3WithProgress({
        presign,
        file: uploadFile,
        onProgress: (p) => onProgress?.(15 + Math.round(p * 0.75)),
      });
      onProgress?.(95);
      return {
        url: presign.publicUrl,
        type: attachmentKind,
        kind: attachmentKind,
        mime,
      };
    },
    [],
  );

  const sendAttachmentBatch = useCallback(
    async (
      conversationId: string,
      items: PendingAttachment[],
      caption: string,
    ) => {
      if (!currentUserId || !socketModule) return;

      const token = await getTokenSafe();
      await socketModule.joinConversation(conversationId);
      const {
        attachmentSendBody,
        createOptimisticMessage,
        createOptimisticPreviewUrl,
        optimisticMessageId,
      } = await import("@/lib/chat/optimisticMessage");

      const optimisticMsgs = items.map((item, i) => {
        const previewUrl = createOptimisticPreviewUrl(item);
        const displayCaption = i === 0 ? caption : "";
        return createOptimisticMessage(
          item,
          displayCaption,
          currentUserId,
          previewUrl,
        );
      });

      for (const optimisticMsg of optimisticMsgs) {
        appendMessageToCaches(queryClient, conversationId, optimisticMsg);
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const tempId = optimisticMessageId(item.id);

        try {
          const { url, type, kind, mime } = await uploadChatFile(
            token,
            item.file,
            item.kind,
            (p) => {
              patchUploadProgressInCaches(
                queryClient,
                conversationId,
                tempId,
                p,
              );
            },
          );

          patchUploadProgressInCaches(queryClient, conversationId, tempId, 98);

          const body = attachmentSendBody(item, caption, i, type);
          const payload = {
            type,
            body,
            attachment: {
              fileName: item.file.name,
              mimeType: mime,
              sizeBytes: item.file.size,
              url,
              kind,
            },
          };

          let saved = await socketModule.emitSendMessage(
            conversationId,
            payload,
          );
          if (!saved) {
            saved = await sendMessageApi(token, conversationId, payload);
          }
          if (saved) {
            const uiMsg = mapMessageToUi(saved, currentUserId);
            if (uiMsg.imageUrl) {
              const { preloadImageUrl } =
                await import("@/lib/chat/preloadImage");
              await preloadImageUrl(uiMsg.imageUrl);
            }

            const messageData = queryClient.getQueryData<{
              pages: ChatMessagesPage[];
            }>(chatQueryKeys.messages(conversationId));
            const pending = messageData?.pages
              .flatMap((page) => page.messages)
              .find((m) => m.id === tempId);

            replaceOptimisticMessageInCaches(
              queryClient,
              conversationId,
              tempId,
              uiMsg,
              pending?.stableKey,
            );
          }
        } catch (e) {
          console.error(e);
          markOptimisticFailedInCaches(queryClient, conversationId, tempId);
        }
      }
    },
    [currentUserId, getTokenSafe, queryClient, uploadChatFile, socketModule],
  );

  const createGroup = useCallback(
    async (name: string, memberIds: string[]) => {
      const token = await getTokenSafe();
      const conv = await createGroupConversation(token, { name, memberIds });
      const listItem: ChatConversationListItemDto = {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        imageUrl: conv.imageUrl,
        handle: conv.handle,
        isGroup: true,
        createdById: conv.createdById,
        unreadCount: 0,
        lastMessage: null,
        members: conv.members,
      };
      upsertConversationInCache(queryClient, listItem);
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [getTokenSafe, queryClient, router],
  );

  const loadSidebarData = useCallback(
    (conversationId: string, otherMemberId?: string) => {
      setSidebarRequest({ conversationId, otherMemberId });
    },
    [],
  );

  const downloadMessageAttachment = useCallback(
    async (
      conversationId: string,
      messageId: string,
      fileName: string,
      fallbackBlobUrl?: string,
    ) => {
      if (messageId.startsWith("optimistic-") && fallbackBlobUrl) {
        const res = await fetch(fallbackBlobUrl);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const token = await getTokenSafe();
      const { downloadChatMessageAttachment } =
        await import("@/lib/chat/downloadAttachment");
      await downloadChatMessageAttachment(
        token,
        conversationId,
        messageId,
        fileName,
      );
    },
    [getTokenSafe],
  );

  const upsertConversation = useCallback(
    (item: ChatConversationListItemDto) => {
      upsertConversationInCache(queryClient, item);
    },
    [queryClient],
  );

  const applyChatDetail = useCallback(
    (conversationId: string, detail: ChatConversationDetailDto) => {
      applyConversationDetailToCache(queryClient, conversationId, detail);
    },
    [queryClient],
  );

  const updateGroupPhoto = useCallback(
    async (conversationId: string, file: File) => {
      const token = await getTokenSafe();
      const mime = file.type.toLowerCase();
      if (!mime.startsWith("image/")) {
        throw new Error("Only image files are supported");
      }
      const [{ presignImageUpload }, { uploadImageToS3WithProgress }] =
        await Promise.all([
          import("@/lib/api/mediaApi"),
          import("@/lib/chat/uploadWithProgress"),
        ]);
      const presign = await presignImageUpload(token, {
        purpose: "CHAT_ATTACHMENT",
        mimeType: mime,
      });
      await uploadImageToS3WithProgress({ presign, file });
      const detail = await updateGroupConversation(token, conversationId, {
        imageUrl: presign.publicUrl,
      });
      applyChatDetail(conversationId, detail);
    },
    [getTokenSafe, applyChatDetail],
  );

  const removeGroupMember = useCallback(
    async (conversationId: string, memberUserId: string) => {
      const token = await getTokenSafe();
      const detail = await removeGroupMemberApi(
        token,
        conversationId,
        memberUserId,
      );
      applyChatDetail(conversationId, detail);
      if (selectedChatIdRef.current === conversationId) {
        await queryClient.invalidateQueries({
          queryKey: chatQueryKeys.messages(conversationId),
        });
      }
    },
    [getTokenSafe, applyChatDetail, queryClient],
  );

  const removeChatFromInbox = useCallback(
    (conversationId: string) => {
      removeConversationFromCache(queryClient, conversationId);
      if (selectedChatIdRef.current === conversationId) {
        router.replace("/dashboard/chats");
      }
    },
    [queryClient, router],
  );

  const deleteChat = useCallback(
    async (conversationId: string) => {
      const token = await getTokenSafe();
      await deleteChatApi(token, conversationId);
      removeChatFromInbox(conversationId);
    },
    [getTokenSafe, removeChatFromInbox],
  );

  const leaveGroup = useCallback(
    async (conversationId: string) => {
      const token = await getTokenSafe();
      await leaveGroupApi(token, conversationId);
      removeChatFromInbox(conversationId);
    },
    [getTokenSafe, removeChatFromInbox],
  );

  const deleteGroup = useCallback(
    async (conversationId: string) => {
      const token = await getTokenSafe();
      await deleteGroupApi(token, conversationId);
      removeChatFromInbox(conversationId);
    },
    [getTokenSafe, removeChatFromInbox],
  );

  return {
    currentUserId,
    chats,
    setChats,
    loading,
    messagesLoading,
    hasOlderMessages,
    loadOlderMessages,
    searchUsers,
    runSearch,
    groupSearchUsers,
    runGroupMemberSearch,
    openUserChat,
    sendTextMessage,
    sendAttachmentBatch,
    downloadMessageAttachment,
    createGroup,
    loadSidebarData,
    memberProfile: memberProfileQuery.data ?? null,
    sidebarMedia: sidebarAttachmentsQuery.data?.media ?? [],
    sidebarDocs: sidebarAttachmentsQuery.data?.docs ?? [],
    refreshConversations,
    upsertConversation,
    updateGroupPhoto,
    removeGroupMember,
    deleteChat,
    leaveGroup,
    deleteGroup,
    userImageUrl: user?.imageUrl ?? null,
  };
}
