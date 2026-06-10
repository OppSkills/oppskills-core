"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useChatComposer } from "@/features/chat/hooks/composer/useChatComposer";
import { useChatDocumentTitle } from "@/features/chat/hooks/layout/useChatDocumentTitle";
import { useChatLayout } from "@/features/chat/hooks/layout/useChatLayout";
import { useImageGallery } from "@/features/chat/hooks/layout/useImageGallery";
import { useThreadMessageSearch } from "@/features/chat/hooks/search/useThreadMessageSearch";
import { useActiveChatView } from "@/features/chat/hooks/thread/useActiveChatView";
import { useChatThreadScroll } from "@/features/chat/hooks/thread/useChatThreadScroll";
import { useChatPage } from "@/features/chat/hooks/useChatPage";
import {
  messageDownloadName,
  messageDownloadUrl,
} from "@/features/chat/lib/downloadAttachmentMeta";
import { CHAT_DOCUMENT_INPUT_ACCEPT } from "@/features/chat/lib/documentAccept";
import { formatChatPresenceSubtitle } from "@/features/chat/lib/formatPresence";
import type { Message } from "@/features/chat/domain/types";
import { formatDateSeparator } from "@/features/chat/components/thread/chatDisplay";
import { isVideoMessage } from "@/features/chat/lib/galleryMedia";
import { registerVideoServiceWorker } from "@/features/chat/lib/videoCache/registerVideoServiceWorker";
import { InboxPanel } from "@/features/chat/components/inbox/InboxPanel";
import { DetailsPanel } from "@/features/chat/components/details/DetailsPanel";
import { ThreadPanel } from "@/features/chat/components/thread/ThreadPanel";

const ChatCameraCapture = dynamic(
  () =>
    import("@/features/chat/components/shared/ChatCameraCapture").then(
      (mod) => mod.ChatCameraCapture,
    ),
  { ssr: false },
);

const ChatConfirmDialog = dynamic(
  () =>
    import("@/features/chat/components/shared/ChatConfirmDialog").then(
      (mod) => mod.ChatConfirmDialog,
    ),
  { ssr: false },
);

export default function ChatsPageShell() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string | undefined;
  const selectedChatId = idParam || null;

  const {
    chats,
    loading,
    hasOlderMessages,
    loadOlderMessages,
    searchUsers,
    runSearch,
    groupSearchUsers,
    runGroupMemberSearch,
    openUserChat,
    sendTextMessage,
    sendAttachmentBatch,
    cancelAttachmentUpload,
    retryAttachmentUpload,
    downloadMessageAttachment,
    messagesLoading,
    threadMessages,
    createGroup,
    loadSidebarData,
    memberProfile,
    sidebarMedia,
    sidebarDocs,
    currentUserId,
    updateGroupPhoto,
    removeGroupMember,
    deleteChat,
    leaveGroup,
    deleteGroup,
  } = useChatPage(selectedChatId);

  const isGroupChat = useMemo(
    () => Boolean(chats.find((c) => c.id === selectedChatId)?.isGroup),
    [chats, selectedChatId],
  );

  const {
    isMobile,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    activeRightSidebarTab,
    setActiveRightSidebarTab,
  } = useChatLayout(selectedChatId, isGroupChat);

  const activeChat = useActiveChatView(chats, selectedChatId, threadMessages);

  const messageSearch = useThreadMessageSearch(activeChat, selectedChatId);
  const {
    isSearchingMessages,
    setIsSearchingMessages,
    messageSearchQuery,
    setMessageSearchQuery,
    showDateFilter,
    setShowDateFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    currentMatchIndex,
    setCurrentMatchIndex,
    matchingMessageIds,
    highlightedMessageId,
    scrollToMessage,
  } = messageSearch;

  const {
    showImageModal,
    setShowImageModal,
    activeModalImageIndex,
    setActiveModalImageIndex,
  } = useImageGallery();

  useChatDocumentTitle(activeChat, chats);

  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const attachmentAnchorRef = useRef<HTMLDivElement>(null);

  const fileComposer = useChatComposer();
  const [groupPhotoUploading, setGroupPhotoUploading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement>(null);

  type PendingConfirm =
    | { kind: "delete-chat" }
    | { kind: "leave-group" }
    | { kind: "delete-group" }
    | { kind: "remove-member"; memberId: string; memberName: string }
    | { kind: "discard-composer" };

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  // Sticky Scroll & Input Focus States & Refs
  const [stickyDate, setStickyDate] = useState<string>("");
  const [showSticky, setShowSticky] = useState<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    scrollContainerRef,
    messagesEndRef,
    topSentinelRef,
    isLoadingOlder,
    handleLoadOlderIfNeeded,
  } = useChatThreadScroll({
    selectedChatId,
    messagesLoading,
    threadMessageCount: threadMessages.length,
    unreadCount: activeChat?.unreadCount ?? 0,
    hasOlderMessages,
    loadOlderMessages,
  });

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    handleLoadOlderIfNeeded(scrollTop);
    const isScrollingUp = scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    const messageElements = container.querySelectorAll("[data-message-date]");
    let currentTopDate = "";
    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < messageElements.length; i++) {
      const el = messageElements[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= containerRect.top) {
        currentTopDate = el.getAttribute("data-message-date") || "";
        break;
      }
    }

    let isSeparatorHidden = false;
    let formattedDate = "";
    if (currentTopDate) {
      formattedDate = formatDateSeparator(currentTopDate);
      setStickyDate(formattedDate);

      // Find if the inline separator for this date is hidden
      const separatorEl = container.querySelector(
        `[data-date-separator="${formattedDate}"]`,
      ) as HTMLElement | null;
      if (separatorEl) {
        const sepRect = separatorEl.getBoundingClientRect();
        isSeparatorHidden = sepRect.bottom <= containerRect.top;
      } else {
        isSeparatorHidden = true;
      }
    }

    if (scrollTop > 10 && isScrollingUp && isSeparatorHidden) {
      setShowSticky(true);
    } else {
      setShowSticky(false);
    }
  };

  useEffect(() => {
    void registerVideoServiceWorker();
  }, []);

  useEffect(() => {
    setStickyDate("");
    setShowSticky(false);
    lastScrollTopRef.current = 0;
    setShowChatMenu(false);
  }, [selectedChatId]);

  // Input fields
  const [inputMessage, setInputMessage] = useState("");

  // Reply states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );

  useEffect(() => {
    if (!showChatMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(e.target as Node)
      ) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showChatMenu]);

  const chatPresenceSubtitle = useMemo(
    () =>
      activeChat ? formatChatPresenceSubtitle(activeChat, currentUserId) : "",
    [activeChat, currentUserId],
  );

  const isGroupAdmin =
    !!activeChat?.isGroup &&
    !!currentUserId &&
    activeChat.createdById === currentUserId;

  const groupSidebarTabs = activeChat?.isGroup
    ? (["Members", "Media", "Docs"] as const)
    : (["Media", "Docs"] as const);

  const galleryItems = useMemo(() => {
    const fromThread = threadMessages
      .filter((m) => m.imageUrl || isVideoMessage(m))
      .map((m) => ({
        messageId: m.id,
        fileName: messageDownloadName(m),
        kind: isVideoMessage(m) ? ("video" as const) : ("image" as const),
      }));

    if (sidebarMedia.length === 0) return fromThread;

    const kindByMessageId = new Map(
      fromThread.map((item) => [item.messageId, item.kind]),
    );

    return sidebarMedia.map((item) => ({
      ...item,
      kind:
        item.kind ??
        kindByMessageId.get(item.messageId) ??
        (/\.(mp4|webm|mov|m4v|mkv|avi)(\?|$)/i.test(item.fileName)
          ? ("video" as const)
          : ("image" as const)),
    }));
  }, [sidebarMedia, threadMessages]);

  const sidebarOtherMemberId = useMemo(() => {
    if (!selectedChatId || isGroupChat) return undefined;
    const chat = chats.find((c) => c.id === selectedChatId);
    return chat?.members.find((m) => m.id !== currentUserId)?.id;
  }, [selectedChatId, isGroupChat, chats, currentUserId]);

  useEffect(() => {
    if (!showRightSidebar || !selectedChatId) return;
    void loadSidebarData(selectedChatId, sidebarOtherMemberId);
  }, [showRightSidebar, selectedChatId, sidebarOtherMemberId, loadSidebarData]);

  const handleGroupAvatarSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedChatId || !isGroupAdmin) return;
    setGroupPhotoUploading(true);
    try {
      await updateGroupPhoto(selectedChatId, file);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupPhotoUploading(false);
    }
  };

  const requestDeleteChat = () => {
    if (!selectedChatId || !activeChat) return;
    setShowChatMenu(false);
    setPendingConfirm({ kind: "delete-chat" });
  };

  const requestLeaveGroup = () => {
    if (!selectedChatId || !activeChat?.isGroup) return;
    setShowChatMenu(false);
    setPendingConfirm({ kind: "leave-group" });
  };

  const requestDeleteGroup = () => {
    if (!selectedChatId || !activeChat?.isGroup || !isGroupAdmin) return;
    setShowChatMenu(false);
    setPendingConfirm({ kind: "delete-group" });
  };

  const requestRemoveGroupMember = (memberId: string, memberName: string) => {
    if (!selectedChatId || !isGroupAdmin) return;
    setPendingConfirm({ kind: "remove-member", memberId, memberName });
  };

  const executePendingConfirm = async () => {
    if (!pendingConfirm) return;

    const confirm = pendingConfirm;
    setPendingConfirm(null);

    if (confirm.kind === "discard-composer") {
      fileComposer.closeComposer();
      return;
    }

    if (!selectedChatId) return;

    try {
      switch (confirm.kind) {
        case "delete-chat":
          await deleteChat(selectedChatId);
          break;
        case "leave-group":
          await leaveGroup(selectedChatId);
          break;
        case "delete-group":
          await deleteGroup(selectedChatId);
          break;
        case "remove-member":
          setRemovingMemberId(confirm.memberId);
          await removeGroupMember(selectedChatId, confirm.memberId);
          break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (confirm.kind === "remove-member") {
        setRemovingMemberId(null);
      }
    }
  };

  const handleComposerCloseRequest = () => {
    if (!fileComposer.composerHasDraft) {
      fileComposer.closeComposer();
      return;
    }
    setPendingConfirm({ kind: "discard-composer" });
  };

  const confirmDialogCopy = (() => {
    if (!pendingConfirm) return null;
    const chatName = activeChat?.name ?? "this chat";

    switch (pendingConfirm.kind) {
      case "delete-chat":
        return {
          title: activeChat?.isGroup ? "Delete chat?" : "Delete conversation?",
          description: activeChat?.isGroup
            ? `"${chatName}" will be removed from your chat list. You can still be re-added to the group.`
            : `Your chat with ${chatName} will be removed from your inbox. This only affects your view.`,
          confirmLabel: "Delete",
          variant: "destructive" as const,
        };
      case "leave-group":
        return {
          title: "Leave group?",
          description: `You will leave "${chatName}" and stop receiving new messages.`,
          confirmLabel: "Leave group",
          variant: "destructive" as const,
        };
      case "delete-group":
        return {
          title: "Delete group for everyone?",
          description: `"${chatName}" will be deleted for all members. This cannot be undone.`,
          confirmLabel: "Delete group",
          variant: "destructive" as const,
        };
      case "remove-member":
        return {
          title: "Remove member?",
          description: `Remove ${pendingConfirm.memberName} from "${chatName}"? They will no longer see new messages in this group.`,
          confirmLabel: "Remove",
          variant: "destructive" as const,
        };
      case "discard-composer":
        return {
          title: "Discard attachments?",
          description:
            "You have unsent media or a caption. Close without sending?",
          confirmLabel: "Discard",
          variant: "destructive" as const,
        };
    }
  })();

  const [modalInstantSrc, setModalInstantSrc] = useState<string | null>(null);

  const openImageInModal = (messageId: string, displaySrc?: string) => {
    const idx = galleryItems.findIndex((g) => g.messageId === messageId);
    if (idx !== -1) {
      setModalInstantSrc(displaySrc ?? null);
      setActiveModalImageIndex(idx);
      setShowImageModal(true);
    }
  };

  const handleNextImage = () => {
    if (galleryItems.length === 0) return;
    setModalInstantSrc(null);
    setActiveModalImageIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const handlePrevImage = () => {
    if (galleryItems.length === 0) return;
    setModalInstantSrc(null);
    setActiveModalImageIndex(
      (prev) => (prev - 1 + galleryItems.length) % galleryItems.length,
    );
  };

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageModal) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "Escape") setShowImageModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImageModal, galleryItems.length]);

  useEffect(() => {
    lastScrollTopRef.current = 0;
  }, [selectedChatId]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChatId) return;

    void sendTextMessage(
      selectedChatId,
      inputMessage.trim(),
      replyingToMessage?.id,
    );

    setInputMessage("");
    setReplyingToMessage(null);
    focusInput();
  };

  const handleCreateGroup = useCallback(
    (name: string, memberIds: string[]) => {
      void createGroup(name, memberIds);
    },
    [createGroup],
  );

  const handleSendAttachments = async () => {
    if (!selectedChatId || fileComposer.pendingAttachments.length === 0) return;
    const items = [...fileComposer.pendingAttachments];
    const caption = fileComposer.composerCaption;
    fileComposer.closeComposer({ revokePreviews: false });
    try {
      await sendAttachmentBatch(selectedChatId, items, caption);
    } catch (err) {
      console.error(err);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
    focusInput();
  };

  const handleDownloadMessage = (message: Message) => {
    if (!selectedChatId) return;
    void downloadMessageAttachment(
      selectedChatId,
      message.id,
      messageDownloadName(message),
      messageDownloadUrl(message),
    );
  };

  const handleCancelUpload = useCallback(
    (messageId: string) => {
      if (!selectedChatId) return;
      cancelAttachmentUpload(selectedChatId, messageId);
    },
    [cancelAttachmentUpload, selectedChatId],
  );

  const handleRetryUpload = useCallback(
    (messageId: string) => {
      if (!selectedChatId) return;
      void retryAttachmentUpload(selectedChatId, messageId);
    },
    [retryAttachmentUpload, selectedChatId],
  );

  const handleDownloadGalleryItem = (item: {
    messageId: string;
    fileName: string;
  }) => {
    if (!selectedChatId) return;
    void downloadMessageAttachment(
      selectedChatId,
      item.messageId,
      item.fileName,
    );
  };

  const handleOpenUserChat = useCallback(
    (userId: string) => {
      void openUserChat(userId);
    },
    [openUserChat],
  );

  const handleSelectChat = useCallback(
    (chatId: string) => {
      router.push(`/dashboard/chats/${chatId}`);
    },
    [router],
  );

  const handleBackToChats = useCallback(() => {
    router.push("/dashboard/chats");
    setShowLeftSidebar(true);
  }, [router]);

  const handleToggleLeftSidebar = useCallback(() => {
    setShowLeftSidebar((v) => !v);
  }, []);

  const handleToggleRightSidebar = useCallback(() => {
    setShowRightSidebar((v) => !v);
  }, []);

  const handleToggleChatMenu = useCallback(() => {
    setShowChatMenu((v) => !v);
  }, []);

  const handleSearchMessagesFromMenu = useCallback(() => {
    setIsSearchingMessages(true);
    setShowChatMenu(false);
  }, []);

  const handleFilterByDateFromMenu = useCallback(() => {
    setShowDateFilter(true);
    setShowChatMenu(false);
  }, []);

  const handleCloseRightSidebar = useCallback(() => {
    setShowRightSidebar(false);
  }, []);

  const handleDownloadSidebarDocument = useCallback(
    (messageId: string, name: string) => {
      if (!selectedChatId) return;
      void downloadMessageAttachment(selectedChatId, messageId, name);
    },
    [selectedChatId, downloadMessageAttachment],
  );

  const handleReplyToMessage = useCallback((message: Message) => {
    setReplyingToMessage(message);
    focusInput();
  }, []);

  const handleAttachmentMenuToggle = useCallback(() => {
    fileComposer.setAttachmentMenuOpen((v) => !v);
  }, [fileComposer]);

  const handleAttachmentMenuClose = useCallback(() => {
    fileComposer.setAttachmentMenuOpen(false);
  }, [fileComposer]);

  const handleReplyCancel = useCallback(() => {
    setReplyingToMessage(null);
  }, []);

  const handleClearDateFilters = useCallback(() => {
    setStartDateFilter("");
    setEndDateFilter("");
  }, []);

  const handleCloseMessageFilters = useCallback(() => {
    setIsSearchingMessages(false);
    setMessageSearchQuery("");
    setShowDateFilter(false);
    setStartDateFilter("");
    setEndDateFilter("");
  }, []);

  const detailsSidebar =
    activeChat && selectedChatId ? (
      <DetailsPanel
        activeChat={activeChat}
        activeModalImageIndex={activeModalImageIndex}
        activeRightSidebarTab={activeRightSidebarTab}
        currentUserId={currentUserId}
        galleryItems={galleryItems}
        groupAvatarInputRef={groupAvatarInputRef}
        groupPhotoUploading={groupPhotoUploading}
        groupSidebarTabs={groupSidebarTabs}
        isGroupAdmin={isGroupAdmin}
        memberProfile={memberProfile}
        removingMemberId={removingMemberId}
        selectedChatId={selectedChatId}
        showImageModal={false}
        showRightSidebar={showRightSidebar}
        sidebarDocs={sidebarDocs}
        onCloseRightSidebar={handleCloseRightSidebar}
        onDownloadGalleryItem={handleDownloadGalleryItem}
        onDownloadDocument={handleDownloadSidebarDocument}
        onGroupAvatarSelect={handleGroupAvatarSelect}
        onImageModalClose={() => setShowImageModal(false)}
        onNextImage={handleNextImage}
        onOpenImage={openImageInModal}
        onPrevImage={handlePrevImage}
        onRemoveGroupMember={requestRemoveGroupMember}
        onTabChange={setActiveRightSidebarTab}
      />
    ) : null;

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-background overflow-hidden relative font-sans text-neutral-900">
      <InboxPanel
        chats={chats}
        currentUserId={currentUserId}
        groupSearchUsers={groupSearchUsers}
        loading={loading}
        searchUsers={searchUsers}
        selectedChatId={selectedChatId}
        showLeftSidebar={showLeftSidebar}
        onCreateGroup={handleCreateGroup}
        onOpenUserChat={handleOpenUserChat}
        onRunGroupMemberSearch={runGroupMemberSearch}
        onRunSearch={runSearch}
        onSelectChat={handleSelectChat}
        onSetShowLeftSidebar={setShowLeftSidebar}
      />

      <div className="flex flex-1 flex-col h-full bg-neutral-100 relative min-w-0">
        {activeChat ? (
          <ThreadPanel
            activeChat={activeChat}
            attachmentAnchorRef={attachmentAnchorRef}
            chatMenuRef={chatMenuRef}
            chatPresenceSubtitle={chatPresenceSubtitle}
            currentMatchIndex={currentMatchIndex}
            currentUserId={currentUserId}
            detailsSidebar={detailsSidebar}
            endDateFilter={endDateFilter}
            fileComposer={fileComposer}
            highlightedMessageId={highlightedMessageId}
            inputMessage={inputMessage}
            inputRef={inputRef}
            isGroupAdmin={isGroupAdmin}
            isMobile={isMobile}
            isSearchingMessages={isSearchingMessages}
            matchingMessageIds={matchingMessageIds}
            messageSearchQuery={messageSearchQuery}
            messagesEndRef={messagesEndRef}
            messagesLoading={messagesLoading}
            isLoadingOlder={isLoadingOlder}
            replyingToMessage={replyingToMessage}
            scrollContainerRef={scrollContainerRef}
            topSentinelRef={topSentinelRef}
            showChatMenu={showChatMenu}
            showDateFilter={showDateFilter}
            showRightSidebar={showRightSidebar}
            showSticky={showSticky}
            startDateFilter={startDateFilter}
            stickyDate={stickyDate}
            onAttachmentMenuClose={handleAttachmentMenuClose}
            onAttachmentMenuToggle={handleAttachmentMenuToggle}
            onBackToChats={handleBackToChats}
            onClearDateFilters={handleClearDateFilters}
            onCloseMessageFilters={handleCloseMessageFilters}
            onComposerCloseRequest={handleComposerCloseRequest}
            onCurrentMatchIndexChange={setCurrentMatchIndex}
            onDeleteChat={requestDeleteChat}
            onDeleteGroup={requestDeleteGroup}
            onCancelUpload={handleCancelUpload}
            onDownloadMessage={handleDownloadMessage}
            onEmojiSelect={insertEmoji}
            onEndDateFilterChange={setEndDateFilter}
            onFilterByDate={handleFilterByDateFromMenu}
            onInputChange={setInputMessage}
            onInputKeyDown={handleInputKeyDown}
            onLeaveGroup={requestLeaveGroup}
            onMessageSearchQueryChange={setMessageSearchQuery}
            onOpenImage={openImageInModal}
            onReply={handleReplyToMessage}
            onReplyCancel={handleReplyCancel}
            onRetryUpload={handleRetryUpload}
            onScroll={handleScroll}
            onScrollToMessage={scrollToMessage}
            onSearchMessages={handleSearchMessagesFromMenu}
            onSendAttachments={() => void handleSendAttachments()}
            onSendMessage={handleSendMessage}
            onStartDateFilterChange={setStartDateFilter}
            onToggleChatMenu={handleToggleChatMenu}
            onToggleLeftSidebar={handleToggleLeftSidebar}
            onToggleRightSidebar={handleToggleRightSidebar}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center p-4 md:p-8 text-center bg-neutral-100 h-full overflow-hidden select-none">
            <div className="relative max-w-lg w-full aspect-4/3 flex items-center justify-center">
              <img
                src="/illustrations/chats/chat_illustration_placeholder.png"
                alt="Workspace Chat Illustration"
                className="max-h-[70vh] w-auto max-w-full object-contain pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {activeChat && selectedChatId && (
        <DetailsPanel
          activeChat={activeChat}
          activeModalImageIndex={activeModalImageIndex}
          activeRightSidebarTab={activeRightSidebarTab}
          currentUserId={currentUserId}
          galleryItems={galleryItems}
          groupAvatarInputRef={groupAvatarInputRef}
          groupPhotoUploading={groupPhotoUploading}
          groupSidebarTabs={groupSidebarTabs}
          isGroupAdmin={isGroupAdmin}
          memberProfile={memberProfile}
          removingMemberId={removingMemberId}
          selectedChatId={selectedChatId}
          showImageModal={showImageModal}
          showRightSidebar={showRightSidebar}
          showSidebar={false}
          sidebarDocs={sidebarDocs}
          onCloseRightSidebar={handleCloseRightSidebar}
          onDownloadGalleryItem={handleDownloadGalleryItem}
          onDownloadDocument={handleDownloadSidebarDocument}
          onGroupAvatarSelect={handleGroupAvatarSelect}
          modalInstantSrc={modalInstantSrc}
          onImageModalClose={() => {
            setShowImageModal(false);
            setModalInstantSrc(null);
          }}
          onNextImage={handleNextImage}
          onOpenImage={openImageInModal}
          onPrevImage={handlePrevImage}
          onRemoveGroupMember={requestRemoveGroupMember}
          onTabChange={setActiveRightSidebarTab}
        />
      )}

      <ChatCameraCapture
        open={fileComposer.cameraOpen}
        onClose={() => fileComposer.setCameraOpen(false)}
        onCapture={(file) => fileComposer.addPendingFile(file)}
      />

      <input
        ref={fileComposer.docInputRef}
        type="file"
        className="hidden"
        accept={CHAT_DOCUMENT_INPUT_ACCEPT}
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) fileComposer.addPendingFiles(files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileComposer.mediaInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) fileComposer.addPendingFiles(files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileComposer.audioInputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) fileComposer.addPendingFiles(files);
          e.target.value = "";
        }}
      />

      {confirmDialogCopy && (
        <ChatConfirmDialog
          open={pendingConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setPendingConfirm(null);
          }}
          title={confirmDialogCopy.title}
          description={confirmDialogCopy.description}
          confirmLabel={confirmDialogCopy.confirmLabel}
          variant={confirmDialogCopy.variant}
          onConfirm={() => void executePendingConfirm()}
        />
      )}
    </div>
  );
}
