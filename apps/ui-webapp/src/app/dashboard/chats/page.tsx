"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  FileText,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  X,
  MessageSquare,
  Sparkles,
  Download,
  CornerUpLeft,
  Quote,
  Image as ImageIcon,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Crown,
  Users,
  UserMinus,
  Loader2,
  LogOut,
  Trash2,
  Calendar,
  PanelLeftClose,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChatsPage } from "@/hooks/useChatsPage";
import { useChatComposer } from "@/hooks/useChatComposer";
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker";
import { ChatAttachmentMenu } from "@/components/chat/ChatAttachmentMenu";
import { ChatAttachmentComposer } from "@/components/chat/ChatAttachmentComposer";
import { ChatConfirmDialog } from "@/components/chat/ChatConfirmDialog";
import { ChatCameraCapture } from "@/components/chat/ChatCameraCapture";
import { ChatMessageImage } from "@/components/chat/ChatMessageImage";
import { SecureChatAttachmentImage } from "@/components/chat/SecureChatAttachmentImage";
import { formatLastMessagePreview } from "@/lib/chat/chatMappers";
import {
  messageDownloadName,
  messageDownloadUrl,
} from "@/lib/chat/downloadAttachment";
import { CHAT_DOCUMENT_INPUT_ACCEPT } from "@/lib/chat/documentAccept";
import {
  formatChatPresenceSubtitle,
  isDmPeerOnline,
} from "@/lib/chat/formatPresence";
import type { Chat, Message } from "@/lib/chat/types";

function OutgoingMessageStatus({ message }: { message: Message }) {
  if (message.sendState === "pending") {
    return <Clock className="w-3.5 h-3.5" />;
  }
  if (message.sendState === "failed") {
    return <span className="text-[9px] text-red-300">Failed</span>;
  }
  if (message.deliveryStatus === "DELIVERED") {
    return <CheckCheck className="w-3.5 h-3.5" />;
  }
  return <Check className="w-3.5 h-3.5" />;
}

function formatTime12h(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, "0");
  const strMinutes = String(minutes).padStart(2, "0");
  return `${strHours}:${strMinutes} ${ampm}`;
}

function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const todayDate = new Date();
  const compareDate = new Date(date);

  const isToday =
    todayDate.getFullYear() === compareDate.getFullYear() &&
    todayDate.getMonth() === compareDate.getMonth() &&
    todayDate.getDate() === compareDate.getDate();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday =
    yesterdayDate.getFullYear() === compareDate.getFullYear() &&
    yesterdayDate.getMonth() === compareDate.getMonth() &&
    yesterdayDate.getDate() === compareDate.getDate();

  if (isToday) {
    return "Today";
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = compareDate.getDate();
    const monthName = months[compareDate.getMonth()];
    const year = compareDate.getFullYear();
    return `${day} ${monthName}, ${year}`;
  }
}

function formatSidebarTimestamp(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const todayDate = new Date();
  const compareDate = new Date(date);

  const isToday =
    todayDate.getFullYear() === compareDate.getFullYear() &&
    todayDate.getMonth() === compareDate.getMonth() &&
    todayDate.getDate() === compareDate.getDate();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday =
    yesterdayDate.getFullYear() === compareDate.getFullYear() &&
    yesterdayDate.getMonth() === compareDate.getMonth() &&
    yesterdayDate.getDate() === compareDate.getDate();

  if (isToday) {
    return formatTime12h(isoString);
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const day = String(compareDate.getDate()).padStart(2, "0");
    const month = String(compareDate.getMonth() + 1).padStart(2, "0");
    const year = compareDate.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ChatSidebarFallback() {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-neutral-200 rounded-md w-1/3" />
            <div className="h-3 bg-neutral-200 rounded-md w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatTimelineFallback() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-neutral-100">
      {Array.from({ length: 5 }).map((_, i) => {
        const isYou = i % 2 === 0;
        return (
          <div
            key={i}
            className={`flex ${isYou ? "justify-end" : "justify-start"} w-full animate-pulse`}
          >
            <div
              className={`flex items-end gap-2 max-w-[70%] ${
                isYou ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`h-16 w-48 md:w-64 rounded-2xl bg-neutral-200 ${
                  isYou ? "rounded-br-none" : "rounded-bl-none"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-300 text-neutral-900 rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function ChatsPage() {
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

  const galleryItems =
    sidebarMedia.length > 0
      ? sidebarMedia
      : activeChat
        ? activeChat.messages
            .filter((m) => m.imageUrl && !m.id.startsWith("optimistic-"))
            .map((m) => ({
              messageId: m.id,
              fileName: messageDownloadName(m),
            }))
        : [];

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

  const getLastMessageText = (chat: Chat) =>
    formatLastMessagePreview(chat.lastMessagePreview, chat, currentUserId);

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

  const getLastMessageTimestamp = (chat: Chat) => {
    const lastMsg = chat.messages[chat.messages.length - 1];
    if (lastMsg) return formatSidebarTimestamp(lastMsg.timestamp);
    if (chat.lastMessagePreview) {
      return formatSidebarTimestamp(chat.lastMessagePreview.createdAt);
    }
    return "";
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

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-background overflow-hidden relative font-sans text-neutral-900">
      {/* ── LEFT SIDEBAR ───────────────────────────────────── */}
      {/* Mobile/Tablet: slide-over drawer + semi-transparent backdrop */}
      {/* Desktop (lg+): inline panel, always visible */}

      {/* Backdrop (mobile/tablet only — covers the chat area behind the drawer) */}
      <AnimatePresence>
        {showLeftSidebar && selectedChatId && (
          <motion.div
            key="left-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.div
        key="left-sidebar"
        initial={selectedChatId ? { x: "-100%" } : false}
        animate={{ x: showLeftSidebar || !selectedChatId ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-10
          ${selectedChatId ? "w-[85vw] max-w-[360px]" : "w-full max-w-none"}
          md:w-[320px] lg:w-[380px]
          border-r border-neutral-300 flex flex-col bg-white shrink-0 h-full lg:!transform-none
        `}
      >
        {/* Search Header */}
        <div className="p-5 pb-3">
          <div className="relative border border-primary-400 rounded-full px-5 py-3 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <span className="absolute left-6 -top-2.5 bg-white px-2 text-xs text-primary-500 font-semibold uppercase tracking-wider">
              Search Chat
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                runSearch(e.target.value);
              }}
              placeholder="Search conversations..."
              className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-400 focus:ring-0"
            />
            <Search className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex px-4 border-b border-neutral-200 overflow-x-auto scrollbar-none">
          {(["All", "Unread", "Groups", "Individual"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                shrink-0 px-3 text-center py-3 text-xs font-semibold tracking-wide transition-all border-b-2 relative uppercase whitespace-nowrap
                ${
                  activeTab === tab
                    ? "text-primary-600 border-primary-500"
                    : "text-neutral-500 border-transparent hover:text-neutral-700"
                }
              `}
            >
              {tab}
              {tab === "Unread" && chats.some((c) => c.unreadCount > 0) && (
                <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-UI-Success animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 scrollbar">
          <BoneyardSkeleton
            loading={loading}
            name="chat-sidebar-list"
            fallback={<ChatSidebarFallback />}
          >
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 p-5 text-center">
                <MessageSquare className="w-10 h-10 text-neutral-400 mb-2" />
                <p className="text-sm font-medium text-neutral-600">
                  No chats found
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Try resetting filters or search terms
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const lastPreview = chat.lastMessagePreview;
                const isSelected = chat.id === selectedChatId;
                const peerOnline = isDmPeerOnline(chat, currentUserId);
                return (
                  <div
                    key={chat.id}
                    onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                    className={`
                      flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-primary-100/40
                      border-l-4 pl-3
                      ${isSelected ? "bg-primary-100/70 border-l-primary-500" : "border-l-transparent"}
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={chat.imageUrl}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                      />
                      {!chat.isGroup && peerOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-UI-Success border-2 border-white"
                          aria-label="Online"
                        />
                      )}
                    </div>

                    {/* Name and message details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-semibold text-neutral-900 truncate font-aeonicPro">
                          {chat.name}
                        </h4>
                        <span className="text-[10px] font-medium text-neutral-500 shrink-0 ml-1">
                          {getLastMessageTimestamp(chat)}
                        </span>
                      </div>

                      {/* Last message content */}
                      <div className="text-xs font-normal text-neutral-600 line-clamp-1 break-all">
                        {getLastMessageText(chat)}
                      </div>

                      {/* Attachment preview inside list item */}
                      {(lastMsg?.attachment ||
                        (lastPreview &&
                          (lastPreview.type === "DOCUMENT" ||
                            lastPreview.type === "IMAGE" ||
                            lastPreview.type === "VIDEO"))) && (
                        <div className="mt-1 flex items-center gap-1.5 py-0.5 px-2 rounded-full bg-neutral-100 border border-neutral-300 text-[10px] w-fit font-medium text-neutral-700">
                          <FileText className="w-3.5 h-3.5 text-primary-500" />
                          <span className="truncate max-w-[130px]">
                            {lastMsg?.attachment?.name ??
                              lastPreview?.body ??
                              "Attachment"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unread badge & state */}
                    {chat.unreadCount > 0 && (
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="w-5 h-5 rounded-full bg-UI-Success text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {chat.unreadCount}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </BoneyardSkeleton>

          {searchQuery.trim().length > 0 && searchUsers.length > 0 && (
            <div className="px-4 pb-3 border-t border-neutral-200">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider py-2">
                People on OppSkills
              </p>
              {searchUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => void openUserChat(u.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary-100/40 transition-colors text-left"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {u.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating action button */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 py-3 px-5 text-white bg-primary-700 hover:bg-primary-800 transition-all cursor-pointer rounded-full shadow-lg hover:shadow-xl font-semibold text-xs tracking-wider z-20 uppercase font-aeonicPro"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </motion.div>

      {/* ── MAIN BODY (Chat Area) ──────────────────────────── */}
      <div className="flex flex-1 flex-col h-full bg-neutral-100 relative min-w-0">
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="h-16 border-b border-neutral-300 bg-white px-3 md:px-5 flex items-center justify-between shrink-0 shadow-sm z-20">
              {/* Left side: nav controls + clickable chat profile */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Sidebar toggle — tablet only (md, not lg) */}
                <button
                  onClick={() => setShowLeftSidebar((v) => !v)}
                  className="hidden md:flex lg:hidden p-2 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 shrink-0 transition-colors"
                  aria-label="Toggle chat list"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>

                {/* Back button — mobile only */}
                <button
                  onClick={() => {
                    router.push("/dashboard/chats");
                    setShowLeftSidebar(true);
                  }}
                  className="flex md:hidden p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Clickable profile area */}
                <div
                  onClick={() => setShowRightSidebar(!showRightSidebar)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-all"
                  title="Click to view details"
                >
                  <img
                    src={activeChat.imageUrl}
                    alt={activeChat.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-bold text-neutral-900 truncate font-aeonicPro">
                      {activeChat.name}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs truncate ${
                        !activeChat.isGroup &&
                        isDmPeerOnline(activeChat, currentUserId)
                          ? "text-emerald-600"
                          : "text-neutral-500"
                      }`}
                    >
                      {chatPresenceSubtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Utility Header Actions */}
              <div className="flex items-center gap-1 text-neutral-600 shrink-0">
                {/* Audio/video calls — post-MVP
                <button className="p-2 rounded-full hover:bg-neutral-100 hover:text-primary-600 transition-colors">
                  <Phone className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-neutral-100 hover:text-primary-600 transition-colors">
                  <Video className="w-4 h-4 md:w-5 h-5" />
                </button>
                */}
                <div className="relative" ref={chatMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowChatMenu((v) => !v)}
                    className="p-2 rounded-full hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    aria-label="Chat options"
                  >
                    <MoreVertical className="size-4 md:size-5" />
                  </button>
                  {showChatMenu && activeChat && (
                    <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchingMessages(true);
                          setShowChatMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
                      >
                        <Search className="w-4 h-4 shrink-0" />
                        Search messages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDateFilter(true);
                          setShowChatMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        Filter by date
                      </button>

                      <div className="border-t border-neutral-100 my-1"></div>

                      {activeChat.isGroup && !isGroupAdmin && (
                        <button
                          type="button"
                          onClick={requestLeaveGroup}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          Leave group
                        </button>
                      )}
                      {activeChat.isGroup && isGroupAdmin && (
                        <button
                          type="button"
                          onClick={requestDeleteGroup}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          Delete group for all
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={requestDeleteChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        {activeChat.isGroup
                          ? "Delete chat"
                          : "Delete conversation"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                {/* Sticky Date Header */}
                <AnimatePresence>
                  {showSticky && stickyDate && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                      <span className="bg-white border border-neutral-200 text-neutral-700 px-4 py-1.5 rounded-full shadow-md font-semibold text-xs whitespace-nowrap">
                        {stickyDate}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Filter / Search Bar */}
                {(isSearchingMessages || showDateFilter) && (
                  <div className="bg-white border-b border-neutral-300 px-3 md:px-5 py-2.5 flex flex-wrap items-center gap-2 md:gap-3 shrink-0 shadow-xs z-10">
                    {isSearchingMessages && (
                      <div className="relative flex items-center flex-1 min-w-0 w-full md:w-auto">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={messageSearchQuery}
                            onChange={(e) =>
                              setMessageSearchQuery(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (matchingMessageIds.length > 0) {
                                  if (e.shiftKey) {
                                    // Shift+Enter: go up (older match)
                                    setCurrentMatchIndex((prev) =>
                                      prev > 0
                                        ? prev - 1
                                        : matchingMessageIds.length - 1,
                                    );
                                  } else {
                                    // Enter: go down (newer match)
                                    setCurrentMatchIndex((prev) =>
                                      prev < matchingMessageIds.length - 1
                                        ? prev + 1
                                        : 0,
                                    );
                                  }
                                }
                              }
                            }}
                            placeholder="Search messages in this chat..."
                            className="w-full pl-9 pr-24 py-1.5 border border-neutral-300 focus:border-primary-500 outline-none rounded-xl text-xs font-semibold shadow-2xs bg-white text-neutral-900"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />

                          {/* Search details and clear button */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 bg-white pl-1 select-none">
                            {messageSearchQuery.trim() && (
                              <span className="font-mono">
                                {matchingMessageIds.length > 0
                                  ? `${currentMatchIndex + 1}/${matchingMessageIds.length}`
                                  : "0/0"}
                              </span>
                            )}
                            {messageSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setMessageSearchQuery("")}
                                className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full hover:bg-neutral-100 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Navigation arrows (Up for older, Down for newer) */}
                        {messageSearchQuery.trim() &&
                          matchingMessageIds.length > 0 && (
                            <div className="flex items-center gap-1 ml-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentMatchIndex((prev) =>
                                    prev > 0
                                      ? prev - 1
                                      : matchingMessageIds.length - 1,
                                  )
                                }
                                title="Previous match (Shift+Enter / Up)"
                                className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-xl text-neutral-600 transition-colors shadow-2xs cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentMatchIndex((prev) =>
                                    prev < matchingMessageIds.length - 1
                                      ? prev + 1
                                      : 0,
                                  )
                                }
                                title="Next match (Enter / Down)"
                                className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-xl text-neutral-600 transition-colors shadow-2xs cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                      </div>
                    )}

                    {showDateFilter && (
                      <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
                        <span className="font-semibold text-neutral-500">
                          From:
                        </span>
                        <input
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => setStartDateFilter(e.target.value)}
                          className="flex-1 min-w-[130px] px-2.5 py-1.5 border border-neutral-300 rounded-xl text-xs outline-none focus:border-primary-500 font-semibold shadow-2xs bg-white"
                        />
                        <span className="font-semibold text-neutral-500">
                          To:
                        </span>
                        <input
                          type="date"
                          value={endDateFilter}
                          onChange={(e) => setEndDateFilter(e.target.value)}
                          className="flex-1 min-w-[130px] px-2.5 py-1.5 border border-neutral-300 rounded-xl text-xs outline-none focus:border-primary-500 font-semibold shadow-2xs bg-white"
                        />
                        {(startDateFilter || endDateFilter) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStartDateFilter("");
                              setEndDateFilter("");
                            }}
                            className="text-primary-600 hover:text-primary-800 underline font-bold ml-1 cursor-pointer"
                          >
                            Clear dates
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchingMessages(false);
                        setMessageSearchQuery("");
                        setShowDateFilter(false);
                        setStartDateFilter("");
                        setEndDateFilter("");
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-bold ml-auto cursor-pointer"
                    >
                      Close Filters
                    </button>
                  </div>
                )}

                {/* Chat Timeline Container */}
                <div className="flex-1 min-h-0 relative flex flex-col">
                  {/* Background illustration – fixed so it doesn't scroll with messages */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute inset-0 z-0 bg-neutral-100"
                    style={{
                      backgroundImage:
                        "url('/illustrations/chats/active_chat_bg.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: 0.1,
                    }}
                  />
                  {/* Chat Timeline (Scrollable Messages) */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar relative z-10 bg-transparent"
                  >
                    <BoneyardSkeleton
                      loading={messagesLoading}
                      name="chat-message-timeline"
                      fallback={<ChatTimelineFallback />}
                    >
                      {activeChat.messages.length > 0 ? (
                        (() => {
                          const sortedMessages = [...activeChat.messages].sort(
                            (a, b) => {
                              return (
                                new Date(a.timestamp).getTime() -
                                new Date(b.timestamp).getTime()
                              );
                            },
                          );

                          const filteredMessages = sortedMessages.filter(
                            (message) => {
                              if (showDateFilter) {
                                const msgTime = new Date(
                                  message.timestamp,
                                ).getTime();
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

                              return true;
                            },
                          );

                          let lastMessageDateStr = "";

                          return filteredMessages.map((message, index) => {
                            const isSystem = message.type === "SYSTEM";

                            // Check for date separator
                            const messageDate = new Date(message.timestamp);
                            let separatorElement = null;

                            if (!isNaN(messageDate.getTime())) {
                              const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
                              if (dateKey !== lastMessageDateStr) {
                                lastMessageDateStr = dateKey;
                                const dateText = formatDateSeparator(
                                  message.timestamp,
                                );
                                separatorElement = (
                                  <div
                                    key={`sep-${message.id}`}
                                    data-date-separator={dateText}
                                    className="flex items-center justify-center my-6 select-none"
                                  >
                                    <div className="flex items-center w-full max-w-lg justify-center text-neutral-500 text-xs font-medium tracking-wide">
                                      <span className="bg-white border border-neutral-200 text-neutral-700 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-xs font-semibold shrink-0">
                                        {dateText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            }

                            const messageElement = isSystem ? (
                              <div
                                key={message.id}
                                data-message-date={message.timestamp}
                                className="flex justify-center my-3"
                              >
                                <div className="bg-neutral-200 text-neutral-600 text-[10px] md:text-xs font-semibold py-1 px-3.5 rounded-full shadow-sm">
                                  {message.text}
                                </div>
                              </div>
                            ) : message.isYou ? (
                              <div
                                key={message.stableKey ?? message.id}
                                id={`msg-${message.id}`}
                                data-message-date={message.timestamp}
                                className="flex justify-end items-end gap-2 transition-all duration-300 w-full my-1.5"
                              >
                                <div className="relative group flex items-end gap-2 max-w-[75%] md:max-w-[60%]">
                                  {/* Hover reply action icon: immediately to the left of the bubble */}
                                  <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingToMessage(message);
                                        focusInput();
                                      }}
                                      title="Reply"
                                      className="p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 shadow-md border border-neutral-200 transition-all active:scale-90"
                                    >
                                      <CornerUpLeft className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="w-full flex flex-col relative">
                                    {/* Swipe reply icon behind bubble */}
                                    {isMobile && (
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-0 flex items-center justify-center text-primary-500 pointer-events-none">
                                        <CornerUpLeft className="w-5 h-5 text-neutral-400 animate-pulse" />
                                      </div>
                                    )}
                                    {/* Bubble content */}
                                    <motion.div
                                      drag={isMobile ? "x" : false}
                                      dragConstraints={{ left: 0, right: 0 }}
                                      dragElastic={0.3}
                                      animate={{ x: 0 }}
                                      onDragEnd={(event, info) => {
                                        const threshold = 55;
                                        if (info.offset.x < -threshold) {
                                          setReplyingToMessage(message);
                                          focusInput();
                                        }
                                      }}
                                      dragTransition={{
                                        bounceStiffness: 800,
                                        bounceDamping: 40,
                                      }}
                                      className={`
                                        p-3 md:p-4 rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed min-w-[80px] cursor-grab active:cursor-grabbing select-none z-10
                                        bg-primary-600 text-white rounded-br-none transition-[box-shadow,border-color,background-color] duration-300
                                        ${
                                          highlightedMessageId === message.id ||
                                          (isSearchingMessages &&
                                            matchingMessageIds[
                                              currentMatchIndex
                                            ] === message.id)
                                            ? "ring-4 ring-yellow-400 ring-offset-2 scale-[1.02]"
                                            : ""
                                        }
                                      `}
                                    >
                                      {/* Reply reference preview inside the bubble */}
                                      {message.replyTo && (
                                        <div
                                          onClick={() =>
                                            message.replyTo &&
                                            scrollToMessage(
                                              message.replyTo.messageId,
                                            )
                                          }
                                          className="mb-2.5 p-2 rounded-lg border-l-4 text-xs cursor-pointer text-left transition-all hover:opacity-90 select-none bg-primary-700/80 border-primary-300 text-white/90"
                                        >
                                          <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-primary-200">
                                            {message.replyTo.senderName}
                                          </p>
                                          <p className="truncate opacity-80">
                                            {message.replyTo.text}
                                          </p>
                                        </div>
                                      )}

                                      {message.imageUrl && (
                                        <ChatMessageImage
                                          message={message}
                                          conversationId={selectedChatId}
                                          onOpen={() =>
                                            openImageInModal(message.id)
                                          }
                                          onDownload={() =>
                                            handleDownloadMessage(message)
                                          }
                                        />
                                      )}

                                      {message.attachment &&
                                        !message.imageUrl && (
                                          <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-primary-700 border-primary-500 text-white">
                                            <FileText className="w-7 h-7 shrink-0 text-white fill-neutral-500/10" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold truncate leading-tight">
                                                {message.attachment.name}
                                              </p>
                                              <p className="text-[9px] mt-0.5 text-primary-200">
                                                {message.attachment.size ||
                                                  "Unknown size"}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDownloadMessage(message)
                                              }
                                              className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0"
                                              title="Download"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}

                                      {message.attachment &&
                                        message.imageUrl &&
                                        message.attachment.type === "video" && (
                                          <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-primary-700 border-primary-500 text-white">
                                            <FileText className="w-7 h-7 shrink-0 text-white" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold truncate leading-tight">
                                                {message.attachment.name}
                                              </p>
                                              <p className="text-[9px] mt-0.5 text-primary-200">
                                                {message.attachment.size ||
                                                  "Video"}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDownloadMessage(message)
                                              }
                                              className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0"
                                              title="Download video"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}

                                      {message.text.trim() ? (
                                        <p className="wrap-break-word">
                                          <HighlightedText
                                            text={message.text}
                                            highlight={
                                              isSearchingMessages
                                                ? messageSearchQuery
                                                : ""
                                            }
                                          />
                                        </p>
                                      ) : null}

                                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                                        <span>
                                          {formatTime12h(message.timestamp)}
                                        </span>
                                        <OutgoingMessageStatus
                                          message={message}
                                        />
                                      </div>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={message.id}
                                id={`msg-${message.id}`}
                                data-message-date={message.timestamp}
                                className="flex justify-start items-end gap-2 transition-all duration-300 w-full my-1.5"
                              >
                                {/* Participant Avatar for group chat left-aligned messages */}
                                {!message.isYou && activeChat.isGroup && (
                                  <div className="w-7 h-7 rounded-full bg-primary-300 text-[10px] font-bold text-white flex items-center justify-center shrink-0 uppercase shadow-sm mb-0.5">
                                    {message.senderName.substring(0, 2)}
                                  </div>
                                )}

                                <div className="relative group flex items-end gap-2 max-w-[75%] md:max-w-[60%]">
                                  <div className="w-full flex flex-col relative">
                                    {/* Swipe reply icon behind bubble */}
                                    {isMobile && (
                                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-0 flex items-center justify-center text-primary-500 pointer-events-none">
                                        <CornerUpLeft className="w-5 h-5 text-neutral-400 animate-pulse" />
                                      </div>
                                    )}
                                    {/* Bubble content */}
                                    <motion.div
                                      drag={isMobile ? "x" : false}
                                      dragConstraints={{ left: 0, right: 0 }}
                                      dragElastic={0.3}
                                      animate={{ x: 0 }}
                                      onDragEnd={(event, info) => {
                                        const threshold = 55;
                                        if (info.offset.x > threshold) {
                                          setReplyingToMessage(message);
                                          focusInput();
                                        }
                                      }}
                                      dragTransition={{
                                        bounceStiffness: 800,
                                        bounceDamping: 40,
                                      }}
                                      className={`
                                        p-3 md:p-4 rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed min-w-[80px] cursor-grab active:cursor-grabbing select-none z-10
                                        bg-white text-neutral-900 rounded-bl-none border border-neutral-200 transition-[box-shadow,border-color,background-color] duration-300
                                        ${
                                          highlightedMessageId === message.id ||
                                          (isSearchingMessages &&
                                            matchingMessageIds[
                                              currentMatchIndex
                                            ] === message.id)
                                            ? "ring-4 ring-yellow-400 ring-offset-2 scale-[1.02]"
                                            : ""
                                        }
                                      `}
                                    >
                                      {/* Reply reference preview inside the bubble */}
                                      {message.replyTo && (
                                        <div
                                          onClick={() =>
                                            message.replyTo &&
                                            scrollToMessage(
                                              message.replyTo.messageId,
                                            )
                                          }
                                          className="mb-2.5 p-2 rounded-lg border-l-4 text-xs cursor-pointer text-left transition-all hover:opacity-90 select-none bg-neutral-100 border-primary-500 text-neutral-700"
                                        >
                                          <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-primary-600">
                                            {message.replyTo.senderName}
                                          </p>
                                          <p className="truncate opacity-80">
                                            {message.replyTo.text}
                                          </p>
                                        </div>
                                      )}

                                      {message.imageUrl && (
                                        <ChatMessageImage
                                          message={message}
                                          conversationId={selectedChatId}
                                          onOpen={() =>
                                            openImageInModal(message.id)
                                          }
                                          onDownload={() =>
                                            handleDownloadMessage(message)
                                          }
                                        />
                                      )}

                                      {message.attachment &&
                                        !message.imageUrl && (
                                          <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-neutral-100 border-neutral-300 text-neutral-800">
                                            <FileText className="w-7 h-7 shrink-0 text-primary-600" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold truncate leading-tight">
                                                {message.attachment.name}
                                              </p>
                                              <p className="text-[9px] mt-0.5 text-neutral-500">
                                                {message.attachment.size ||
                                                  "Unknown size"}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDownloadMessage(message)
                                              }
                                              className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0"
                                              title="Download"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}

                                      {message.attachment &&
                                        message.imageUrl &&
                                        message.attachment.type !== "image" && (
                                          <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-neutral-100 border-neutral-300 text-neutral-800">
                                            <FileText className="w-7 h-7 shrink-0 text-primary-600" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold truncate leading-tight">
                                                {message.attachment.name}
                                              </p>
                                              <p className="text-[9px] mt-0.5 text-neutral-500">
                                                {message.attachment.size ||
                                                  "Unknown size"}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDownloadMessage(message)
                                              }
                                              className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0"
                                              title="Download"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}

                                      {message.text.trim() ? (
                                        <p className="wrap-break-word">
                                          <HighlightedText
                                            text={message.text}
                                            highlight={
                                              isSearchingMessages
                                                ? messageSearchQuery
                                                : ""
                                            }
                                          />
                                        </p>
                                      ) : null}

                                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                                        <span>
                                          {formatTime12h(message.timestamp)}
                                        </span>
                                      </div>
                                    </motion.div>
                                  </div>

                                  {/* Hover reply action icon: immediately to the right of the bubble */}
                                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingToMessage(message);
                                        focusInput();
                                      }}
                                      title="Reply"
                                      className="p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 shadow-md border border-neutral-200 transition-all active:scale-90"
                                    >
                                      <CornerUpLeft className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );

                            return (
                              <React.Fragment
                                key={message.stableKey ?? message.id}
                              >
                                {separatorElement}
                                {messageElement}
                              </React.Fragment>
                            );
                          });
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4">
                          <img
                            src="/images/no-messages.svg"
                            alt="No messages"
                            className="w-48 h-48 opacity-50"
                          />
                          <p className="text-sm font-medium">No messages yet</p>
                        </div>
                      )}
                    </BoneyardSkeleton>
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input Container (with Reply Preview) */}
                <div
                  className="border-t border-neutral-300 bg-white shrink-0 z-10 flex flex-col shadow-inner"
                  style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
                >
                  {/* Reply Preview Bar */}
                  <AnimatePresence>
                    {replyingToMessage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-neutral-100 border-b border-neutral-200 flex items-center justify-between px-6 py-2.5 gap-4"
                      >
                        <div className="flex items-center gap-2 border-l-4 border-primary-500 pl-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                              Replying to {replyingToMessage.senderName}
                            </p>
                            <p className="text-xs text-neutral-600 truncate">
                              {replyingToMessage.text}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingToMessage(null)}
                          className="p-1 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="min-h-[5rem] py-3 px-4 md:px-6 flex items-end gap-3 w-full"
                  >
                    <div
                      className="relative shrink-0"
                      ref={attachmentAnchorRef}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          fileComposer.setAttachmentMenuOpen((v) => !v)
                        }
                        className="p-2.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <ChatAttachmentMenu
                        open={fileComposer.attachmentMenuOpen}
                        onClose={() =>
                          fileComposer.setAttachmentMenuOpen(false)
                        }
                        onPickDocument={fileComposer.triggerDocPick}
                        onPickPhotosVideos={fileComposer.triggerMediaPick}
                        onPickAudio={fileComposer.triggerAudioPick}
                        onPickCamera={fileComposer.triggerCamera}
                      />
                    </div>

                    {/* Input field */}
                    <div className="flex-1 bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-2xl px-4 py-2 flex items-end transition-colors min-h-[44px]">
                      <textarea
                        ref={inputRef}
                        rows={Math.min(
                          4,
                          Math.max(1, inputMessage.split("\n").length),
                        )}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-500 focus:ring-0 py-1 resize-none"
                      />
                      <ChatEmojiPicker
                        onEmojiSelect={insertEmoji}
                        className="p-1 text-neutral-500 hover:text-primary-600 transition-colors shrink-0 ml-2 mb-0.5"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className={`
                        p-3 rounded-full text-white transition-all shrink-0 shadow-md hover:shadow-lg mb-0.5
                        ${
                          inputMessage.trim()
                            ? "bg-primary-600 hover:bg-primary-700 cursor-pointer scale-100 active:scale-95"
                            : "bg-neutral-300 cursor-not-allowed opacity-80"
                        }
                      `}
                    >
                      <Send className="size-4 md:size-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar Details */}
              {/* Backdrop for right sidebar on small screens */}
              <AnimatePresence>
                {showRightSidebar && (
                  <motion.div
                    key="right-sidebar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="lg:hidden absolute inset-0 bg-black/40 z-40"
                    onClick={() => setShowRightSidebar(false)}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showRightSidebar && (
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute inset-y-0 right-0 lg:relative w-[90vw] sm:w-96 lg:w-[350px] shrink-0 border-l border-neutral-300 bg-white flex flex-col h-full z-45 shadow-xl lg:shadow-none overflow-hidden"
                  >
                    {/* Header profile info */}
                    <div
                      className="relative p-6 text-center border-b border-neutral-200 shrink-0"
                      style={{
                        backgroundColor: "var(--color-neutral-100)",
                        backgroundImage:
                          "radial-gradient(var(--color-neutral-300) 1px, transparent 0)",
                        backgroundSize: "16px 16px",
                      }}
                    >
                      {/* Close button (Mobile-friendly) */}
                      <button
                        onClick={() => setShowRightSidebar(false)}
                        className="absolute top-4 left-4 p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-black border border-neutral-200 shadow-sm transition-all active:scale-95 cursor-pointer z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Avatar */}
                      <div className="relative w-24 h-24 mx-auto mt-6">
                        <img
                          src={activeChat.imageUrl}
                          alt={activeChat.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        {groupPhotoUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {activeChat.isGroup && isGroupAdmin && (
                          <>
                            <input
                              ref={groupAvatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleGroupAvatarSelect}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                groupAvatarInputRef.current?.click()
                              }
                              disabled={groupPhotoUploading}
                              title="Change group photo"
                              className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-600 text-white border-2 border-white shadow-md hover:bg-primary-700 transition-colors disabled:opacity-50 z-10"
                            >
                              {groupPhotoUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Pencil className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-neutral-900 mt-3 font-aeonicPro leading-snug">
                        {activeChat.name}
                      </h3>

                      {/* Sub-label */}
                      <p className="text-[10px] font-semibold text-neutral-500 mt-1.5 uppercase tracking-wider">
                        {activeChat.isGroup
                          ? `Group • ${activeChat.members.length} members`
                          : "Direct message"}
                      </p>

                      {!activeChat.isGroup && memberProfile && (
                        <p className="text-xs text-neutral-600 mt-3 leading-relaxed px-2 font-normal">
                          {memberProfile.collegeName
                            ? `${memberProfile.collegeName}${memberProfile.skills.length > 0 ? ` • ${memberProfile.skills.slice(0, 3).join(", ")}` : ""}`
                            : memberProfile.skills.length > 0
                              ? memberProfile.skills.slice(0, 5).join(", ")
                              : "OppSkills member"}
                        </p>
                      )}

                      {activeChat.isGroup && isGroupAdmin && (
                        <p className="text-[10px] text-primary-600 font-semibold mt-2">
                          You are the group admin
                        </p>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex px-4 border-b border-neutral-200 bg-white shrink-0">
                      {groupSidebarTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveRightSidebarTab(tab)}
                          className={`
                            flex-1 text-center py-3 text-xs font-semibold tracking-wide transition-all border-b-2 relative uppercase cursor-pointer
                            ${
                              activeRightSidebarTab === tab
                                ? "text-primary-600 border-primary-500 font-bold"
                                : "text-neutral-500 border-transparent hover:text-neutral-700 font-medium"
                            }
                          `}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable list content */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar bg-white">
                      {activeRightSidebarTab === "Members" &&
                      activeChat.isGroup ? (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            All members ({activeChat.members.length})
                          </h4>
                          {activeChat.members.map((member) => {
                            const isSelf = member.id === currentUserId;
                            const canRemove =
                              isGroupAdmin && !member.isAdmin && !isSelf;
                            return (
                              <div
                                key={member.id}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
                              >
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-neutral-800 truncate">
                                      {member.name}
                                      {isSelf ? " (You)" : ""}
                                    </p>
                                    {member.isAdmin && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                                        <Crown className="w-2.5 h-2.5" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                                    {member.email}
                                  </p>
                                </div>
                                {canRemove && (
                                  <button
                                    type="button"
                                    title={`Remove ${member.name}`}
                                    disabled={removingMemberId === member.id}
                                    onClick={() =>
                                      requestRemoveGroupMember(
                                        member.id,
                                        member.name,
                                      )
                                    }
                                    className="p-1.5 rounded-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0 disabled:opacity-50"
                                  >
                                    {removingMemberId === member.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <UserMinus className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : activeRightSidebarTab === "Media" ? (
                        <div className="space-y-5">
                          {galleryItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
                              <p className="text-xs font-semibold text-neutral-600">
                                No media shared yet
                              </p>
                              <p className="text-[10px] text-neutral-400 mt-1">
                                Photos shared in this chat will show up here
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                                Shared Media ({galleryItems.length})
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                {selectedChatId &&
                                  galleryItems.map((item) => (
                                    <div
                                      key={item.messageId}
                                      className="relative aspect-square rounded-lg overflow-hidden border border-neutral-100 shadow-xs group/media-item"
                                    >
                                      <SecureChatAttachmentImage
                                        conversationId={selectedChatId}
                                        messageId={item.messageId}
                                        alt="Media content"
                                        onClick={() =>
                                          openImageInModal(item.messageId)
                                        }
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadGalleryItem(item);
                                        }}
                                        className="absolute bottom-1 right-1 p-1.5 rounded-full bg-black/55 text-white opacity-0 group-hover/media-item:opacity-100 hover:bg-black/75 transition-all"
                                        title="Download"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : sidebarDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <FileText className="w-8 h-8 text-neutral-400 mb-2" />
                          <p className="text-xs font-semibold text-neutral-600">
                            No documents shared yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sidebarDocs.map((doc) => (
                            <div
                              key={doc.messageId}
                              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors group"
                            >
                              <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-primary-600 transition-colors">
                                  {doc.name}
                                </p>
                                {doc.size && (
                                  <p className="text-[10px] text-neutral-500 mt-0.5">
                                    {doc.size}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  selectedChatId &&
                                  void downloadMessageAttachment(
                                    selectedChatId,
                                    doc.messageId,
                                    doc.name,
                                  )
                                }
                                className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500 shrink-0"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Placeholder View (Default Screen) — hidden on mobile (sidebar covers full screen) */
          <div className="hidden md:flex flex-1 items-center justify-center p-4 md:p-8 text-center bg-neutral-100 h-full overflow-hidden select-none">
            <div className="relative max-w-lg w-full aspect-[4/3] flex items-center justify-center">
              <img
                src="/illustrations/chats/chat_illustration_placeholder.png"
                alt="Workspace Chat Illustration"
                className="max-h-[70vh] w-auto max-w-full object-contain pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-300"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-200">
                <h3 className="text-base font-bold text-neutral-900 font-aeonicPro">
                  Create New Group
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateGroup}>
                <div className="p-6 space-y-4">
                  {/* Group Name input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. E-Summit Design Team"
                      className="w-full bg-neutral-100 border border-neutral-300 focus:border-primary-500 rounded-xl py-3 px-4 text-sm text-neutral-800 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Search members
                    </label>
                    <input
                      type="text"
                      value={groupMemberSearch}
                      onChange={(e) => {
                        setGroupMemberSearch(e.target.value);
                        runGroupMemberSearch(e.target.value);
                      }}
                      placeholder="Name or email..."
                      className="w-full mb-3 bg-neutral-100 border border-neutral-300 focus:border-primary-500 rounded-xl py-2.5 px-4 text-sm outline-none"
                    />
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Select Members
                    </label>
                    <div className="max-h-52 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-150 p-2 bg-neutral-50 scrollbar">
                      {groupMemberSearch.trim().length === 0 ? (
                        <p className="text-xs text-center text-neutral-500 py-6 px-2">
                          Type a name or email to find members
                        </p>
                      ) : groupSearchUsers.length === 0 ? (
                        <p className="text-xs text-center text-neutral-500 py-6 px-2">
                          No users found
                        </p>
                      ) : (
                        groupSearchUsers
                          .filter((contact) => contact.id !== currentUserId)
                          .map((contact) => {
                            const isSelected = selectedMembers.includes(
                              contact.id,
                            );
                            return (
                              <div
                                key={contact.id}
                                onClick={() => toggleSelectMember(contact.id)}
                                className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-primary-100/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={contact.avatar}
                                    alt={contact.name}
                                    className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <span className="text-sm font-semibold text-neutral-900 block truncate">
                                      {contact.name}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 block truncate">
                                      {contact.email}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`
                              w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                              ${
                                isSelected
                                  ? "bg-primary-600 border-primary-600 text-white"
                                  : "border-neutral-400 bg-white"
                              }
                            `}
                                >
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="py-2.5 px-4 text-xs font-bold text-neutral-700 hover:text-black transition-colors uppercase tracking-wider font-aeonicPro"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !newGroupName.trim() || selectedMembers.length === 0
                    }
                    className={`
                      py-2.5 px-5 text-xs font-bold text-white rounded-full transition-all uppercase tracking-wider font-aeonicPro shadow-md
                      ${
                        newGroupName.trim() && selectedMembers.length > 0
                          ? "bg-primary-600 hover:bg-primary-700 cursor-pointer"
                          : "bg-neutral-300 cursor-not-allowed"
                      }
                    `}
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Gallery Modal */}
      <AnimatePresence>
        {showImageModal && galleryItems.length > 0 && selectedChatId && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center select-none z-50">
            {/* Close button (top right) */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                const item = galleryItems[activeModalImageIndex];
                if (item) handleDownloadGalleryItem(item);
              }}
              className="absolute top-6 right-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Left navigation arrow */}
            <button
              onClick={handlePrevImage}
              className="absolute left-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
              title="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Modal Image container */}
            <motion.div
              key={activeModalImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-[85vw] max-h-[80vh] flex flex-col items-center justify-center"
            >
              <SecureChatAttachmentImage
                conversationId={selectedChatId}
                messageId={galleryItems[activeModalImageIndex]!.messageId}
                alt="Modal gallery image"
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              />
              <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-wide border border-white/10">
                {activeModalImageIndex + 1} / {galleryItems.length}
              </div>
            </motion.div>

            {/* Right navigation arrow */}
            <button
              onClick={handleNextImage}
              className="absolute right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
              title="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </AnimatePresence>

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
