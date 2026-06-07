"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatMemberDto,
  ChatMessageDto,
} from "@oppskills/types";
import {
  createDirectConversation,
  createGroupConversation,
  getChatMemberProfile,
  getConversation,
  listConversationAttachments,
  listConversations,
  listMessages,
  markConversationRead,
  removeGroupMember as removeGroupMemberApi,
  deleteChat as deleteChatApi,
  leaveGroup as leaveGroupApi,
  deleteGroup as deleteGroupApi,
  searchChats,
  searchUsersForGroup,
  sendMessage as sendMessageApi,
  updateGroupConversation,
} from "@/lib/api/chatApi";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitAckDelivered,
  emitSendMessage,
  joinConversation,
  leaveConversation,
} from "@/lib/chat/chatSocket";
import {
  appendMessageToChat,
  applyInboxConversationUpdate,
  mapConversationToUi,
  mapMessageToUi,
  markOptimisticMessageFailed,
  memberDisplayName,
  mergeChatFromDetail,
  patchMemberPresence,
  patchMessageDelivery,
  patchMessageUploadProgress,
  replaceOptimisticMessage,
} from "@/lib/chat/chatMappers";
import { preloadImageUrl } from "@/lib/chat/preloadImage";
import {
  attachmentSendBody,
  createOptimisticMessage,
  createOptimisticPreviewUrl,
  optimisticMessageId,
} from "@/lib/chat/optimisticMessage";
import type { Chat, Message, SearchUserHit } from "@/lib/chat/types";
import { presignDocumentUpload, presignImageUpload } from "@/lib/api/mediaApi";
import {
  type PendingAttachment,
  type PendingAttachmentKind,
} from "@/lib/chat/attachmentTypes";
import {
  fileForChatUpload,
  resolveChatUploadMime,
} from "@/lib/chat/uploadMime";
import { downloadChatMessageAttachment } from "@/lib/chat/downloadAttachment";
import {
  uploadDocumentToS3WithProgress,
  uploadImageToS3WithProgress,
} from "@/lib/chat/uploadWithProgress";
import { getMe } from "@/lib/api/usersApi";

const MESSAGE_PAGE_SIZE = 30;

// Simple in-memory global cache persisting across page mounts
export let globalChatsCache: Chat[] = [];
let globalSearchUsersCache: SearchUserHit[] = [];
let globalGroupSearchUsersCache: SearchUserHit[] = [];
let globalLoadingCache = true;
let globalCurrentUserIdCache: string | null = null;

export function useChatsPage(selectedChatId: string | null) {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [currentUserId, setCurrentUserIdState] = useState<string | null>(
    globalCurrentUserIdCache,
  );
  const [chats, setChatsState] = useState<Chat[]>(globalChatsCache);
  const [searchUsers, setSearchUsersState] = useState<SearchUserHit[]>(
    globalSearchUsersCache,
  );
  const [groupSearchUsers, setGroupSearchUsersState] = useState<
    SearchUserHit[]
  >(globalGroupSearchUsersCache);
  const [loading, setLoadingState] = useState(
    globalChatsCache.length > 0 ? false : globalLoadingCache,
  );

  const setCurrentUserId = (val: string | null) => {
    globalCurrentUserIdCache = val;
    setCurrentUserIdState(val);
  };

  const setChats = (val: Chat[] | ((prev: Chat[]) => Chat[])) => {
    setChatsState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      globalChatsCache = next;
      return next;
    });
  };

  const setSearchUsers = (
    val: SearchUserHit[] | ((prev: SearchUserHit[]) => SearchUserHit[]),
  ) => {
    setSearchUsersState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      globalSearchUsersCache = next;
      return next;
    });
  };

  const setGroupSearchUsers = (
    val: SearchUserHit[] | ((prev: SearchUserHit[]) => SearchUserHit[]),
  ) => {
    setGroupSearchUsersState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      globalGroupSearchUsersCache = next;
      return next;
    });
  };

  const setLoading = (val: boolean) => {
    globalLoadingCache = val;
    setLoadingState(val);
  };

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<{
    bio?: string;
    skills: string[];
    collegeName: string | null;
  } | null>(null);
  const [sidebarMedia, setSidebarMedia] = useState<
    { messageId: string; fileName: string }[]
  >([]);
  const [sidebarDocs, setSidebarDocs] = useState<
    { messageId: string; name: string; size?: string }[]
  >([]);

  const prevChatIdRef = useRef<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  const chatsRef = useRef<Chat[]>(chats);
  chatsRef.current = chats;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  selectedChatIdRef.current = selectedChatId;

  const clearUnreadForConversation = useCallback((conversationId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  const getTokenSafe = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error("Not authenticated");
    return t;
  }, [getToken]);

  const markActiveConversationRead = useCallback(
    async (conversationId: string) => {
      if (selectedChatIdRef.current !== conversationId) return;
      try {
        const token = await getTokenSafe();
        await markConversationRead(token, conversationId);
        clearUnreadForConversation(conversationId);
      } catch (e) {
        console.error(e);
      }
    },
    [getTokenSafe, clearUnreadForConversation],
  );

  const refreshConversations = useCallback(async () => {
    const token = await getTokenSafe();
    const page = await listConversations(token, { limit: 50 });
    setChats((prev) => {
      const msgMap = new Map(prev.map((c) => [c.id, c.messages]));
      return page.data.map((c) =>
        mapConversationToUi(c, msgMap.get(c.id) ?? []),
      );
    });
  }, [getTokenSafe]);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await getTokenSafe();
        const me = await getMe(token);
        if (cancelled) return;
        setCurrentUserId(me.id);
        await refreshConversations();
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, getTokenSafe, refreshConversations]);

  useEffect(() => {
    if (!currentUserId || !isLoaded) return;

    let cancelled = false;

    void (async () => {
      const token = await getTokenSafe();
      if (cancelled) return;

      connectChatSocket(token, {
        onMessageCreated: ({ conversationId, message }) => {
          const uiMsg = mapMessageToUi(message, currentUserId);
          const isActiveChat = selectedChatIdRef.current === conversationId;

          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== conversationId) return c;
              if (c.messages.some((m) => m.id === uiMsg.id)) {
                return isActiveChat ? { ...c, unreadCount: 0 } : c;
              }
              if (uiMsg.isYou) {
                const pending = c.messages.find(
                  (m) =>
                    m.sendState === "pending" && m.id.startsWith("optimistic-"),
                );
                if (pending) {
                  const next = replaceOptimisticMessage(
                    c,
                    pending.id,
                    uiMsg,
                    pending.stableKey,
                  );
                  return isActiveChat ? { ...next, unreadCount: 0 } : next;
                }
              }
              const next = appendMessageToChat(c, uiMsg);
              return isActiveChat ? { ...next, unreadCount: 0 } : next;
            }),
          );

          if (isActiveChat) {
            if (!uiMsg.isYou) {
              emitAckDelivered(conversationId, [message.id]);
            }
            void markActiveConversationRead(conversationId);
          }
        },
        onConversationUpdated: ({ conversation }) => {
          const isActiveChat = selectedChatIdRef.current === conversation.id;

          setChats((prev) => {
            const existing = prev.find((c) => c.id === conversation.id);
            const messages = existing?.messages ?? [];
            return applyInboxConversationUpdate(prev, conversation, messages, {
              isActiveChat,
            });
          });

          if (isActiveChat) {
            void markActiveConversationRead(conversation.id);
          }
        },
        onMessagesDelivered: ({ messageId, deliveryStatus }) => {
          setChats((prev) =>
            prev.map((c) => ({
              ...c,
              messages: patchMessageDelivery(
                c.messages,
                messageId,
                deliveryStatus,
              ),
            })),
          );
        },
        onConversationRemoved: ({ conversationId }) => {
          setChats((prev) => prev.filter((c) => c.id !== conversationId));
          if (selectedChatIdRef.current === conversationId) {
            router.replace("/dashboard/chats");
          }
        },
        onPresenceUpdated: ({ userId, isOnline, lastSeenAt }) => {
          setChats((prev) =>
            prev.map((c) => ({
              ...c,
              members: patchMemberPresence(c.members, userId, {
                isOnline,
                lastSeenAt,
              }),
            })),
          );
        },
      });
    })();

    return () => {
      cancelled = true;
      disconnectChatSocket();
    };
  }, [currentUserId, isLoaded, getTokenSafe, router]);

  const refreshConversationMeta = useCallback(
    async (conversationId: string) => {
      const token = await getTokenSafe();
      const detail = await getConversation(token, conversationId);
      setChats((prev) =>
        prev.map((c) =>
          c.id === conversationId ? mergeChatFromDetail(c, detail) : c,
        ),
      );
    },
    [getTokenSafe],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      const token = await getTokenSafe();
      const cached = chatsRef.current.find((c) => c.id === conversationId);
      const hasCachedMessages = (cached?.messages.length ?? 0) > 0;
      if (!hasCachedMessages) {
        setMessagesLoading(true);
      }
      try {
        const page = await listMessages(token, conversationId, {
          limit: MESSAGE_PAGE_SIZE,
        });
        if (!currentUserId) return;
        const uiMessages = page.data.map((m) =>
          mapMessageToUi(m, currentUserId),
        );
        setHasOlderMessages(page.hasMore);
        setOlderCursor(page.nextCursor);
        setChats((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, messages: uiMessages } : c,
          ),
        );
        const ids = page.data
          .filter((m) => m.senderId !== currentUserId)
          .map((m) => m.id);
        if (ids.length > 0) {
          emitAckDelivered(conversationId, ids);
        }
      } finally {
        setMessagesLoading(false);
      }
    },
    [getTokenSafe, currentUserId],
  );

  useEffect(() => {
    if (!selectedChatId || !currentUserId) return;

    if (prevChatIdRef.current) {
      leaveConversation(prevChatIdRef.current);
    }
    prevChatIdRef.current = selectedChatId;

    clearUnreadForConversation(selectedChatId);

    void (async () => {
      await joinConversation(selectedChatId);
      await loadMessages(selectedChatId);
    })();
    void markActiveConversationRead(selectedChatId);

    return () => {
      if (selectedChatId) leaveConversation(selectedChatId);
    };
  }, [
    selectedChatId,
    currentUserId,
    loadMessages,
    refreshConversationMeta,
    markActiveConversationRead,
    clearUnreadForConversation,
  ]);

  useEffect(() => {
    if (!selectedChatId || loading) return;
    if (chats.some((c) => c.id === selectedChatId)) return;

    void (async () => {
      try {
        const token = await getTokenSafe();
        const { getConversation } = await import("@/lib/api/chatApi");
        const detail = await getConversation(token, selectedChatId);
        const listItem: ChatConversationListItemDto = {
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
        };
        setChats((prev) => {
          if (prev.some((c) => c.id === listItem.id)) return prev;
          return [mapConversationToUi(listItem, []), ...prev];
        });
      } catch {
        router.replace("/dashboard/chats");
      }
    })();
  }, [selectedChatId, chats, loading, router, getTokenSafe]);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChatId || !olderCursor || !currentUserId) return;
    const token = await getTokenSafe();
    const page = await listMessages(token, selectedChatId, {
      limit: MESSAGE_PAGE_SIZE,
      before: olderCursor,
    });
    const uiMessages = page.data.map((m) => mapMessageToUi(m, currentUserId));
    setHasOlderMessages(page.hasMore);
    setOlderCursor(page.nextCursor);
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? { ...c, messages: [...uiMessages, ...c.messages] }
          : c,
      ),
    );
  }, [selectedChatId, olderCursor, currentUserId, getTokenSafe]);

  const runSearch = useCallback(
    (query: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      const q = query.trim();
      if (q.length === 0) {
        setSearchUsers([]);
        void refreshConversations();
        return;
      }
      searchDebounceRef.current = setTimeout(() => {
        void (async () => {
          try {
            const token = await getTokenSafe();
            const result = await searchChats(token, q);
            setChats(
              result.conversations.map((c) => mapConversationToUi(c, [])),
            );
            setSearchUsers(
              result.users.map((u) => ({
                id: u.id,
                name: memberDisplayName(u),
                email: u.email,
                avatar:
                  u.imageUrl ??
                  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&h=150&q=80",
              })),
            );
          } catch (e) {
            console.error(e);
          }
        })();
      }, 300);
    },
    [getTokenSafe, refreshConversations],
  );

  const runGroupMemberSearch = useCallback(
    (query: string) => {
      if (groupSearchDebounceRef.current) {
        clearTimeout(groupSearchDebounceRef.current);
      }
      const q = query.trim();
      if (q.length === 0) {
        setGroupSearchUsers([]);
        return;
      }
      groupSearchDebounceRef.current = setTimeout(() => {
        void (async () => {
          try {
            const token = await getTokenSafe();
            const users = await searchUsersForGroup(token, q);
            setGroupSearchUsers(
              users
                .filter((u) => u.id !== currentUserId)
                .map((u) => ({
                  id: u.id,
                  name: memberDisplayName(u),
                  email: u.email,
                  avatar:
                    u.imageUrl ??
                    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&h=150&q=80",
                })),
            );
          } catch (e) {
            console.error(e);
            setGroupSearchUsers([]);
          }
        })();
      }, 300);
    },
    [getTokenSafe, currentUserId],
  );

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
      const ui = mapConversationToUi(listItem, []);
      setChats((prev) => {
        if (prev.some((c) => c.id === ui.id)) return prev;
        return [ui, ...prev];
      });
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [getTokenSafe, router],
  );

  const applySentMessage = useCallback(
    (conversationId: string, dto: ChatMessageDto) => {
      if (!currentUserId) return;
      const uiMsg = mapMessageToUi(dto, currentUserId);
      setChats((prev) =>
        prev.map((c) =>
          c.id === conversationId ? appendMessageToChat(c, uiMsg) : c,
        ),
      );
    },
    [currentUserId],
  );

  const sendTextMessage = useCallback(
    async (conversationId: string, text: string, replyToMessageId?: string) => {
      if (!currentUserId) return;

      const payload = {
        type: "TEXT" as const,
        body: text,
        replyToMessageId,
      };

      await joinConversation(conversationId);

      let saved = await emitSendMessage(conversationId, payload);
      if (!saved) {
        const token = await getTokenSafe();
        saved = await sendMessageApi(token, conversationId, payload);
      }
      if (saved) {
        applySentMessage(conversationId, saved);
      }
    },
    [currentUserId, getTokenSafe, applySentMessage],
  );

  const uploadChatFile = useCallback(
    async (
      token: string,
      file: File,
      kind: PendingAttachmentKind,
      onProgress?: (percent: number) => void,
    ) => {
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
      if (!currentUserId) return;

      const token = await getTokenSafe();
      await joinConversation(conversationId);

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

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          let next = c;
          for (const m of optimisticMsgs) {
            next = appendMessageToChat(next, m);
          }
          return next;
        }),
      );

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const tempId = optimisticMessageId(item.id);

        try {
          const { url, type, kind, mime } = await uploadChatFile(
            token,
            item.file,
            item.kind,
            (p) => {
              setChats((prev) =>
                prev.map((c) =>
                  c.id === conversationId
                    ? patchMessageUploadProgress(c, tempId, p)
                    : c,
                ),
              );
            },
          );

          setChats((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? patchMessageUploadProgress(c, tempId, 98)
                : c,
            ),
          );

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

          let saved = await emitSendMessage(conversationId, payload);
          if (!saved) {
            saved = await sendMessageApi(token, conversationId, payload);
          }
          if (saved) {
            const uiMsg = mapMessageToUi(saved, currentUserId);
            if (uiMsg.imageUrl) {
              await preloadImageUrl(uiMsg.imageUrl);
            }
            setChats((prev) =>
              prev.map((c) => {
                if (c.id !== conversationId) return c;
                if (c.messages.some((m) => m.id === uiMsg.id)) return c;
                const pending = c.messages.find((m) => m.id === tempId);
                if (!pending) return c;
                return replaceOptimisticMessage(
                  c,
                  tempId,
                  uiMsg,
                  pending.stableKey,
                );
              }),
            );
          }
        } catch (e) {
          console.error(e);
          setChats((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? markOptimisticMessageFailed(c, tempId)
                : c,
            ),
          );
        }
      }
    },
    [currentUserId, getTokenSafe, uploadChatFile],
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
      const ui = mapConversationToUi(listItem, []);
      setChats((prev) => [ui, ...prev]);
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [getTokenSafe, router],
  );

  const loadSidebarData = useCallback(
    async (conversationId: string, otherMemberId?: string) => {
      const token = await getTokenSafe();
      const [mediaPage, docsPage] = await Promise.all([
        listConversationAttachments(token, conversationId, {
          tab: "media",
          limit: 50,
        }),
        listConversationAttachments(token, conversationId, {
          tab: "documents",
          limit: 50,
        }),
      ]);
      setSidebarMedia(
        mediaPage.data.map((a) => ({
          messageId: a.messageId,
          fileName: a.fileName,
        })),
      );
      setSidebarDocs(
        docsPage.data.map((a) => ({
          messageId: a.messageId,
          name: a.fileName,
        })),
      );
      if (otherMemberId) {
        const profile = await getChatMemberProfile(
          token,
          conversationId,
          otherMemberId,
        );
        setMemberProfile({
          skills: profile.skills,
          collegeName: profile.collegeName,
        });
      }
    },
    [getTokenSafe],
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
      setChats((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        const messages = existing?.messages ?? [];
        const ui = mapConversationToUi(item, messages);
        const rest = prev.filter((c) => c.id !== item.id);
        return [ui, ...rest];
      });
    },
    [],
  );

  const applyChatDetail = useCallback(
    (conversationId: string, detail: ChatConversationDetailDto) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === conversationId ? mergeChatFromDetail(c, detail) : c,
        ),
      );
    },
    [],
  );

  const updateGroupPhoto = useCallback(
    async (conversationId: string, file: File) => {
      const token = await getTokenSafe();
      const mime = file.type.toLowerCase();
      if (!mime.startsWith("image/")) {
        throw new Error("Only image files are supported");
      }
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
        await loadMessages(conversationId);
      }
    },
    [getTokenSafe, applyChatDetail, loadMessages],
  );

  const removeChatFromInbox = useCallback(
    (conversationId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedChatIdRef.current === conversationId) {
        router.replace("/dashboard/chats");
      }
    },
    [router],
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
    memberProfile,
    sidebarMedia,
    sidebarDocs,
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
