"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Quote,
} from "lucide-react";
import { useChatsPage } from "@/hooks/useChatsPage";
import { useChatComposer } from "@/hooks/useChatComposer";
import {
  messageDownloadName,
  messageDownloadUrl,
} from "@/lib/chat/downloadAttachmentMeta";
import { CHAT_DOCUMENT_INPUT_ACCEPT } from "@/lib/chat/documentAccept";
import { formatChatPresenceSubtitle } from "@/lib/chat/formatPresence";
import type { Chat, Message } from "@/lib/chat/types";
import {
  formatDateSeparator,
} from "./_components/chatDisplay";
import ChatSidebar from "./_components/ChatSidebar";

const ActiveChatHeader = dynamic(
  () => import("./_components/ActiveChatHeader"),
  { ssr: false },
);

const ChatDetailsSidebar = dynamic(
  () => import("./_components/ChatDetailsSidebar"),
  { ssr: false },
);

const ChatTimeline = dynamic(() => import("./_components/ChatTimeline"), {
  ssr: false,
});

const MessageComposer = dynamic(
  () => import("./_components/MessageComposer"),
  { ssr: false },
);

const MessageFilterBar = dynamic(
  () => import("./_components/MessageFilterBar"),
  { ssr: false },
);

const StickyDateBadge = dynamic(() => import("./_components/StickyDateBadge"), {
  ssr: false,
});

const ChatAttachmentComposer = dynamic(
  () =>
    import("@/components/chat/ChatAttachmentComposer").then(
      (mod) => mod.ChatAttachmentComposer,
    ),
  { ssr: false },
);

const ChatCameraCapture = dynamic(
  () =>
    import("@/components/chat/ChatCameraCapture").then(
      (mod) => mod.ChatCameraCapture,
    ),
  { ssr: false },
);

const ChatConfirmDialog = dynamic(
  () =>
    import("@/components/chat/ChatConfirmDialog").then(
      (mod) => mod.ChatConfirmDialog,
    ),
  { ssr: false },
);

const ChatEmojiPicker = dynamic(
  () =>
    import("@/components/chat/ChatEmojiPicker").then(
      (mod) => mod.ChatEmojiPicker,
    ),
  { ssr: false },
);

const CreateGroupModal = dynamic(
  () => import("./_components/CreateGroupModal"),
  { ssr: false },
);

const ImageGalleryModal = dynamic(
  () => import("./_components/ImageGalleryModal"),
  { ssr: false },
);

export default function ChatsPageContent() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string | undefined;
  const selectedChatId = idParam || null;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    downloadMessageAttachment,
    messagesLoading,
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
  } = useChatsPage(selectedChatId);

  const activeChat = chats.find((c) => c.id === selectedChatId);

  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const attachmentAnchorRef = useRef<HTMLDivElement>(null);

  const fileComposer = useChatComposer();
  const loadingOlderRef = useRef(false);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "All" | "Unread" | "Groups" | "Individual"
  >("All");

  // Sticky Scroll & Input Focus States & Refs
  const [stickyDate, setStickyDate] = useState<string>("");
  const [showSticky, setShowSticky] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    if (scrollTop < 80 && hasOlderMessages && !loadingOlderRef.current) {
      loadingOlderRef.current = true;
      void loadOlderMessages().finally(() => {
        loadingOlderRef.current = false;
      });
    }
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

  // Reset sticky state & filters when changing conversations
  useEffect(() => {
    setStickyDate("");
    setShowSticky(false);
    lastScrollTopRef.current = 0;

    setIsSearchingMessages(false);
    setMessageSearchQuery("");
    setShowDateFilter(false);
    setStartDateFilter("");
    setEndDateFilter("");
  }, [selectedChatId]);

  // Message filters and search states
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Input fields
  const [inputMessage, setInputMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Reply states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  // Right sidebar details state
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<
    "Members" | "Media" | "Docs"
  >("Media");

  // Left sidebar mobile overlay state
  const [showLeftSidebar, setShowLeftSidebar] = useState(!selectedChatId);

  // Auto-close right sidebar on chat switch; open left sidebar when no chat selected; close left sidebar on mobile when chat is selected
  useEffect(() => {
    setShowRightSidebar(false);
    setActiveRightSidebarTab("Media");
    setShowChatMenu(false);
    if (!selectedChatId) {
      setShowLeftSidebar(true);
    } else {
      setShowLeftSidebar(false);
    }
  }, [selectedChatId]);

  // Compute matching message IDs
  const matchingMessageIds = useMemo(() => {
    if (!isSearchingMessages || !messageSearchQuery.trim() || !activeChat)
      return [];
    const query = messageSearchQuery.toLowerCase();
    const sorted = [...activeChat.messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return sorted
      .filter((message) => {
        if (message.type === "SYSTEM") return false;

        if (showDateFilter) {
          const msgTime = new Date(message.timestamp).getTime();
          if (startDateFilter) {
            const start = new Date(startDateFilter);
            start.setHours(0, 0, 0, 0);
            if (msgTime < start.getTime()) return false;
          }
          if (endDateFilter) {
            const end = new Date(endDateFilter);
            end.setHours(23, 59, 59, 999);
            if (msgTime > end.getTime()) return false;
          }
        }

        const textMatch = message.text.toLowerCase().includes(query);
        const senderMatch = message.senderName?.toLowerCase().includes(query);
        return textMatch || senderMatch;
      })
      .map((m) => m.id);
  }, [
    activeChat?.messages,
    isSearchingMessages,
    messageSearchQuery,
    showDateFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Reset match index to the last match (newest) when query or matches list changes
  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setCurrentMatchIndex(matchingMessageIds.length - 1);
    } else {
      setCurrentMatchIndex(0);
    }
  }, [matchingMessageIds]);

  // Scroll to current match when index, matches list, or search state changes
  useEffect(() => {
    if (matchingMessageIds.length > 0 && isSearchingMessages) {
      const matchId = matchingMessageIds[currentMatchIndex];
      if (matchId) {
        const el = document.getElementById(`msg-${matchId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedMessageId(matchId);
        }
      }
    } else {
      setHighlightedMessageId(null);
    }
  }, [currentMatchIndex, matchingMessageIds, isSearchingMessages]);

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

  // Image modal gallery state
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);

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

  useEffect(() => {
    if (activeChat?.isGroup) {
      setActiveRightSidebarTab("Members");
    }
  }, [selectedChatId, activeChat?.isGroup]);

  // Dynamic document title matching route state and unread counts
  useEffect(() => {
    if (activeChat) {
      document.title = `Chat with ${activeChat.name} - Oppskills`;
    } else {
      const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);
      const prefix = totalUnread > 0 ? `(${totalUnread}) ` : "";
      document.title = `${prefix}Chats - Oppskills`;
    }
  }, [activeChat, chats]);

  const galleryItems = useMemo(() => {
    if (sidebarMedia.length > 0) return sidebarMedia;
    if (!activeChat) return [];
    return activeChat.messages
      .filter((m) => m.imageUrl && !m.id.startsWith("optimistic-"))
      .map((m) => ({
        messageId: m.id,
        fileName: messageDownloadName(m),
      }));
  }, [sidebarMedia, activeChat]);

  useEffect(() => {
    if (!showRightSidebar || !selectedChatId || !activeChat) return;
    const otherMemberId = activeChat.isGroup
      ? undefined
      : activeChat.members.find((m) => m.id !== currentUserId)?.id;
    void loadSidebarData(selectedChatId, otherMemberId);
  }, [
    showRightSidebar,
    selectedChatId,
    activeChat,
    currentUserId,
    loadSidebarData,
  ]);

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

  const openImageInModal = (messageId: string) => {
    const idx = galleryItems.findIndex((g) => g.messageId === messageId);
    if (idx !== -1) {
      setActiveModalImageIndex(idx);
      setShowImageModal(true);
    }
  };

  const handleNextImage = () => {
    if (galleryItems.length === 0) return;
    setActiveModalImageIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const handlePrevImage = () => {
    if (galleryItems.length === 0) return;
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

  // Scroll to a referenced message helper
  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((instant: boolean) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const run = () => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: instant ? "auto" : "smooth",
      });
    };
    run();
    requestAnimationFrame(run);
  }, []);

  useEffect(() => {
    prevMessageCountRef.current = 0;
    lastScrollTopRef.current = 0;
  }, [selectedChatId]);

  // Open read conversations at the latest message (not prior scroll position).
  useLayoutEffect(() => {
    if (!selectedChatId || !activeChat || messagesLoading) return;
    if (activeChat.unreadCount > 0) return;

    const el = scrollContainerRef.current;
    if (!el || activeChat.messages.length === 0) return;

    const snap = () => {
      el.scrollTop = el.scrollHeight;
    };
    snap();
    requestAnimationFrame(snap);
  }, [
    selectedChatId,
    activeChat?.id,
    activeChat?.unreadCount,
    activeChat?.messages.length,
    messagesLoading,
  ]);

  useEffect(() => {
    if (!selectedChatId || messagesLoading) return;
    if ((activeChat?.unreadCount ?? 0) > 0) return;
    scrollToBottom(true);
  }, [
    selectedChatId,
    messagesLoading,
    activeChat?.unreadCount,
    scrollToBottom,
  ]);

  useEffect(() => {
    const count = activeChat?.messages.length ?? 0;
    if (count === 0) return;
    const isInitial = prevMessageCountRef.current === 0;
    const grew = count > prevMessageCountRef.current;
    prevMessageCountRef.current = count;
    if (grew) {
      scrollToBottom(false);
    } else if (isInitial && (activeChat?.unreadCount ?? 0) === 0) {
      scrollToBottom(true);
    }
  }, [
    activeChat?.messages,
    activeChat?.messages.length,
    activeChat?.unreadCount,
    scrollToBottom,
  ]);

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

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    void createGroup(newGroupName.trim(), selectedMembers);
    setNewGroupName("");
    setSelectedMembers([]);
    setGroupMemberSearch("");
    setShowCreateGroup(false);
  };

  const handleSendAttachments = async () => {
    if (!selectedChatId || fileComposer.pendingAttachments.length === 0) return;
    const items = [...fileComposer.pendingAttachments];
    const caption = fileComposer.composerCaption;
    fileComposer.closeComposer();
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

  const toggleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
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

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      switch (activeTab) {
        case "Unread":
          return chat.unreadCount > 0;
        case "Groups":
          return chat.isGroup;
        case "Individual":
          return !chat.isGroup;
        case "All":
        default:
          return true;
      }
    });
  }, [chats, activeTab]);

  const handleOpenCreateGroup = useCallback(() => {
    setShowCreateGroup(true);
  }, []);

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

  const handleSidebarSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleGroupMemberSearchChange = useCallback(
    (value: string) => {
      setGroupMemberSearch(value);
      runGroupMemberSearch(value);
    },
    [runGroupMemberSearch],
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

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-background overflow-hidden relative font-sans text-neutral-900">
      <ChatSidebar
        activeTab={activeTab}
        chats={chats}
        currentUserId={currentUserId}
        filteredChats={filteredChats}
        loading={loading}
        searchQuery={searchQuery}
        searchUsers={searchUsers}
        selectedChatId={selectedChatId}
        showLeftSidebar={showLeftSidebar}
        onCreateGroup={handleOpenCreateGroup}
        onOpenUserChat={handleOpenUserChat}
        onRunSearch={runSearch}
        onSearchQueryChange={handleSidebarSearchChange}
        onSelectChat={handleSelectChat}
        onSetActiveTab={setActiveTab}
        onSetShowLeftSidebar={setShowLeftSidebar}
      />

      {/* ── MAIN BODY (Chat Area) ──────────────────────────── */}
      <div className="flex flex-1 flex-col h-full bg-neutral-100 relative min-w-0">
        {activeChat ? (
          <>
            <ActiveChatHeader
              activeChat={activeChat}
              chatMenuRef={chatMenuRef}
              chatPresenceSubtitle={chatPresenceSubtitle}
              currentUserId={currentUserId}
              isGroupAdmin={isGroupAdmin}
              showChatMenu={showChatMenu}
              showRightSidebar={showRightSidebar}
              onBackToChats={handleBackToChats}
              onDeleteChat={requestDeleteChat}
              onDeleteGroup={requestDeleteGroup}
              onFilterByDate={handleFilterByDateFromMenu}
              onLeaveGroup={requestLeaveGroup}
              onSearchMessages={handleSearchMessagesFromMenu}
              onToggleChatMenu={handleToggleChatMenu}
              onToggleLeftSidebar={handleToggleLeftSidebar}
              onToggleRightSidebar={handleToggleRightSidebar}
            />

            {/* Split layout: messages timeline/input on left, right sidebar on right */}
            <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
              {/* Message timeline and input */}
              <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <ChatAttachmentComposer
                  open={fileComposer.composerOpen}
                  items={fileComposer.pendingAttachments}
                  activeIndex={fileComposer.activeAttachmentIndex}
                  caption={fileComposer.composerCaption}
                  cropMode={fileComposer.cropMode}
                  onCaptionChange={fileComposer.setComposerCaption}
                  onActiveIndexChange={fileComposer.setActiveAttachmentIndex}
                  onCropModeChange={fileComposer.setCropMode}
                  onCroppedFile={fileComposer.replaceActiveFile}
                  onAddMore={() => fileComposer.mediaInputRef.current?.click()}
                  onRemove={fileComposer.removePending}
                  onClose={handleComposerCloseRequest}
                  onSend={() => void handleSendAttachments()}
                />
                <StickyDateBadge
                  date={stickyDate}
                  show={showSticky && Boolean(stickyDate)}
                />

                <MessageFilterBar
                  currentMatchIndex={currentMatchIndex}
                  endDateFilter={endDateFilter}
                  matchingMessageCount={matchingMessageIds.length}
                  messageSearchQuery={messageSearchQuery}
                  showDateFilter={showDateFilter}
                  showSearch={isSearchingMessages}
                  startDateFilter={startDateFilter}
                  onClearDates={handleClearDateFilters}
                  onClose={handleCloseMessageFilters}
                  onCurrentMatchIndexChange={setCurrentMatchIndex}
                  onEndDateFilterChange={setEndDateFilter}
                  onMessageSearchQueryChange={setMessageSearchQuery}
                  onStartDateFilterChange={setStartDateFilter}
                />

                <ChatTimeline
                  activeChat={activeChat}
                  currentMatchIndex={currentMatchIndex}
                  endDateFilter={endDateFilter}
                  highlightedMessageId={highlightedMessageId}
                  isMobile={isMobile}
                  isSearchingMessages={isSearchingMessages}
                  matchingMessageIds={matchingMessageIds}
                  messageSearchQuery={messageSearchQuery}
                  messagesEndRef={messagesEndRef}
                  messagesLoading={messagesLoading}
                  scrollContainerRef={scrollContainerRef}
                  selectedChatId={activeChat.id}
                  showDateFilter={showDateFilter}
                  startDateFilter={startDateFilter}
                  onDownloadMessage={handleDownloadMessage}
                  onOpenImage={openImageInModal}
                  onReply={handleReplyToMessage}
                  onScroll={handleScroll}
                  onScrollToMessage={scrollToMessage}
                />

                <MessageComposer
                  attachmentAnchorRef={attachmentAnchorRef}
                  attachmentMenuOpen={fileComposer.attachmentMenuOpen}
                  EmojiPicker={ChatEmojiPicker}
                  inputMessage={inputMessage}
                  inputRef={inputRef}
                  replyingToMessage={replyingToMessage}
                  onAttachmentMenuToggle={handleAttachmentMenuToggle}
                  onAudioPick={fileComposer.triggerAudioPick}
                  onCameraPick={fileComposer.triggerCamera}
                  onDocumentPick={fileComposer.triggerDocPick}
                  onEmojiSelect={insertEmoji}
                  onInputChange={setInputMessage}
                  onInputKeyDown={handleInputKeyDown}
                  onMediaPick={fileComposer.triggerMediaPick}
                  onMenuClose={handleAttachmentMenuClose}
                  onReplyCancel={handleReplyCancel}
                  onSubmit={handleSendMessage}
                />
              </div>

              <ChatDetailsSidebar
                activeChat={activeChat}
                activeTab={activeRightSidebarTab}
                currentUserId={currentUserId}
                galleryItems={galleryItems}
                groupAvatarInputRef={groupAvatarInputRef}
                groupPhotoUploading={groupPhotoUploading}
                groupSidebarTabs={groupSidebarTabs}
                isGroupAdmin={isGroupAdmin}
                memberProfile={memberProfile}
                removingMemberId={removingMemberId}
                selectedChatId={activeChat.id}
                sidebarDocs={sidebarDocs}
                show={showRightSidebar}
                onClose={handleCloseRightSidebar}
                onDownloadGalleryItem={handleDownloadGalleryItem}
                onDownloadDocument={handleDownloadSidebarDocument}
                onGroupAvatarSelect={handleGroupAvatarSelect}
                onOpenImage={openImageInModal}
                onRemoveGroupMember={requestRemoveGroupMember}
                onTabChange={setActiveRightSidebarTab}
              />
            </div>
          </>
        ) : (
          /* Placeholder View (Default Screen) — hidden on mobile (sidebar covers full screen) */
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

      {showCreateGroup && (
        <CreateGroupModal
          currentUserId={currentUserId}
          groupMemberSearch={groupMemberSearch}
          groupSearchUsers={groupSearchUsers}
          newGroupName={newGroupName}
          selectedMembers={selectedMembers}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
          onGroupMemberSearchChange={handleGroupMemberSearchChange}
          onNewGroupNameChange={setNewGroupName}
          onToggleMember={toggleSelectMember}
        />
      )}

      {showImageModal && galleryItems.length > 0 && selectedChatId && (
        <ImageGalleryModal
          activeIndex={activeModalImageIndex}
          conversationId={selectedChatId}
          items={galleryItems}
          onClose={() => setShowImageModal(false)}
          onDownload={handleDownloadGalleryItem}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
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
