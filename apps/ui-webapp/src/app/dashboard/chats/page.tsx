"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  FileText,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
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
  ChevronRight
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// --- Types ---
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string; // e.g. "08:45 AM" or "24-08-2026"
  isYou: boolean;
  imageUrl?: string;
  imageBadgeText?: string;
  imageTopRightText?: string;
  replyTo?: {
    senderName: string;
    text: string;
    messageId: string;
  };
  attachment?: {
    name: string;
    type: "document" | "image";
    size?: string;
  };
}

interface Chat {
  id: string;
  name: string;
  imageUrl: string;
  isGroup: boolean;
  unreadCount: number;
  members: { id: string; name: string; avatar: string }[];
  messages: Message[];
}

// --- Helper Functions for Date/Time ---
const getTodayISO = (hours: number, minutes: number) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const getYesterdayISO = (hours: number, minutes: number) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

function formatTime12h(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  const strMinutes = String(minutes).padStart(2, '0');
  return `${strHours}:${strMinutes} ${ampm}`;
}

function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  const todayDate = new Date();
  const compareDate = new Date(date);
  
  const isToday = todayDate.getFullYear() === compareDate.getFullYear() &&
                  todayDate.getMonth() === compareDate.getMonth() &&
                  todayDate.getDate() === compareDate.getDate();
                  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday = yesterdayDate.getFullYear() === compareDate.getFullYear() &&
                      yesterdayDate.getMonth() === compareDate.getMonth() &&
                      yesterdayDate.getDate() === compareDate.getDate();
                      
  if (isToday) {
    return "Today";
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
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
  
  const isToday = todayDate.getFullYear() === compareDate.getFullYear() &&
                  todayDate.getMonth() === compareDate.getMonth() &&
                  todayDate.getDate() === compareDate.getDate();
                  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday = yesterdayDate.getFullYear() === compareDate.getFullYear() &&
                      yesterdayDate.getMonth() === compareDate.getMonth() &&
                      yesterdayDate.getDate() === compareDate.getDate();
                      
  if (isToday) {
    return formatTime12h(isoString);
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const day = String(compareDate.getDate()).padStart(2, '0');
    const month = String(compareDate.getMonth() + 1).padStart(2, '0');
    const year = compareDate.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

// --- Initial Mock Data ---
const initialChats: Chat[] = [
  {
    id: "1",
    name: "Rohit",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    isGroup: false,
    unreadCount: 0,
    members: [
      { id: "current-user", name: "You", avatar: "" },
      { id: "rohit", name: "Rohit", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" }
    ],
    messages: [
      {
        id: "m1",
        senderId: "rohit",
        senderName: "Rohit",
        text: "Hey! Are you attending the OppSkills E-Summit this year?",
        timestamp: "2026-04-25T10:14:00.000Z",
        isYou: false
      },
      {
        id: "m2",
        senderId: "current-user",
        senderName: "You",
        text: "Definitely! I've already registered for the hackathon track. What about you?",
        timestamp: "2026-04-25T10:15:00.000Z",
        isYou: true
      },
      {
        id: "m3",
        senderId: "rohit",
        senderName: "Rohit",
        text: "The Great Indian E-Summit EP11: Relationships in Startup ecosystem is going live, I am super excited about that session.",
        timestamp: "2026-04-29T11:00:00.000Z",
        isYou: false
      },
      {
        id: "m-img-1",
        senderId: "rohit",
        senderName: "Rohit",
        text: "Oh! They fixed it and upgraded the security further. 🚀",
        timestamp: getYesterdayISO(10, 14),
        isYou: false,
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        imageBadgeText: "m",
        imageTopRightText: "13.5.2026"
      },
      {
        id: "m-reply-1",
        senderId: "current-user",
        senderName: "You",
        text: "Awesome! Let me look into that.",
        timestamp: getTodayISO(10, 15),
        isYou: true,
        replyTo: {
          senderName: "Rohit",
          text: "Oh! They fixed it and upgraded the security further. 🚀",
          messageId: "m-img-1"
        }
      }
    ]
  },
  {
    id: "2",
    name: "Alumini Group",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150&q=80",
    isGroup: true,
    unreadCount: 1,
    members: [
      { id: "current-user", name: "You", avatar: "" },
      { id: "utkarsh", name: "Utkarsh", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "sneha", name: "Sneha", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" }
    ],
    messages: [
      {
        id: "m4",
        senderId: "sneha",
        senderName: "Sneha",
        text: "Did anyone get in touch with the panel speaker for the design system track?",
        timestamp: getYesterdayISO(8, 30),
        isYou: false
      },
      {
        id: "m5",
        senderId: "utkarsh",
        senderName: "Utkarsh",
        text: "Utkarsh: The Great E-Summit Podcast Episode recording has been finalized.",
        timestamp: getTodayISO(8, 45),
        isYou: false
      }
    ]
  },
  {
    id: "3",
    name: "E-Summit Team",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=150&h=150&q=80",
    isGroup: true,
    unreadCount: 0,
    members: [
      { id: "current-user", name: "You", avatar: "" },
      { id: "aniket", name: "Aniket", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" }
    ],
    messages: [
      {
        id: "m6",
        senderId: "current-user",
        senderName: "You",
        text: "I've uploaded the speaker list for the main stage panels.",
        timestamp: "2026-08-24T16:00:00.000Z",
        isYou: true
      },
      {
        id: "m7",
        senderId: "aniket",
        senderName: "Aniket",
        text: "The Great Indian Podcast EP11: Relationships in the startup ecosystem is now live on all platforms.",
        timestamp: "2026-08-24T16:05:00.000Z",
        isYou: false
      }
    ]
  },
  {
    id: "4",
    name: "E-Summit Logistics",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    isGroup: true,
    unreadCount: 0,
    members: [
      { id: "current-user", name: "You", avatar: "" },
      { id: "rohit", name: "Rohit", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" },
      { id: "sneha", name: "Sneha", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" }
    ],
    messages: [
      {
        id: "m8",
        senderId: "sneha",
        senderName: "Sneha",
        text: "Hey, can anyone send the latest event agenda and time table?",
        timestamp: getYesterdayISO(14, 0),
        isYou: false
      },
      {
        id: "m9",
        senderId: "current-user",
        senderName: "You",
        text: "Here is the PDF schedule for the tracks.",
        timestamp: getTodayISO(14, 15),
        isYou: true,
        attachment: {
          name: "E Summit Time table",
          type: "document",
          size: "1.4 MB"
        }
      }
    ]
  }
];

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string | undefined;
  const selectedChatId = idParam || null;

  // Validate if URL ID is correct; if not, go back to /dashboard/chats
  useEffect(() => {
    if (idParam) {
      const exists = chats.some(c => c.id === idParam);
      if (!exists) {
        router.replace("/dashboard/chats");
      }
    }
  }, [idParam, chats, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Unread" | "Groups" | "Individual">("All");

  // Sticky Scroll & Input Focus States & Refs
  const [stickyDate, setStickyDate] = useState<string>("");
  const [showSticky, setShowSticky] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
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
      const separatorEl = container.querySelector(`[data-date-separator="${formattedDate}"]`) as HTMLElement | null;
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

  // Reset sticky state when changing conversations
  useEffect(() => {
    setStickyDate("");
    setShowSticky(false);
    lastScrollTopRef.current = 0;
  }, [selectedChatId]);

  // Input fields
  const [inputMessage, setInputMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Reply states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Right sidebar details state
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<"Media" | "Docs">("Media");

  // Auto-close right sidebar on chat switch
  useEffect(() => {
    setShowRightSidebar(false);
  }, [selectedChatId]);

  // Image modal gallery state
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);

  // Find current active chat
  const activeChat = chats.find(c => c.id === selectedChatId);

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

  // Active gallery images list
  const galleryImages = activeChat
    ? Array.from(new Set(activeChat.messages.filter(m => m.imageUrl).map(m => m.imageUrl!)))
    : [];

  const openImageInModal = (src: string) => {
    const idx = galleryImages.indexOf(src);
    if (idx !== -1) {
      setActiveModalImageIndex(idx);
    } else {
      // If not in gallery (fallback), add it temporarily
      setActiveModalImageIndex(galleryImages.length);
      galleryImages.push(src);
    }
    setShowImageModal(true);
  };

  const handleNextImage = () => {
    if (galleryImages.length === 0) return;
    setActiveModalImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    if (galleryImages.length === 0) return;
    setActiveModalImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
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
  }, [showImageModal, galleryImages]);

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

  // List of all mock users to select when creating group
  const mockContacts = [
    { id: "rohit", name: "Rohit", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" },
    { id: "utkarsh", name: "Utkarsh", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
    { id: "sneha", name: "Sneha", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
    { id: "aniket", name: "Aniket", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" }
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Mark selected chat as read
  useEffect(() => {
    if (selectedChatId) {
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === selectedChatId ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  }, [selectedChatId]);

  // Handle message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChatId) return;

    const newMessage: Message = {
      id: `m-new-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      text: inputMessage,
      timestamp: new Date().toISOString(),
      isYou: true,
      ...(replyingToMessage && {
        replyTo: {
          senderName: replyingToMessage.senderName,
          text: replyingToMessage.text,
          messageId: replyingToMessage.id
        }
      })
    };

    setChats(prevChats =>
      prevChats.map(c => {
        if (c.id === selectedChatId) {
          return {
            ...c,
            messages: [...c.messages, newMessage]
          };
        }
        return c;
      })
    );

    setInputMessage("");
    setReplyingToMessage(null);
    focusInput();
  };

  // Handle group creation
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const selectedUsers = mockContacts.filter(contact => selectedMembers.includes(contact.id));
    const newChat: Chat = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&h=150&q=80",
      isGroup: true,
      unreadCount: 0,
      members: [
        { id: "current-user", name: "You", avatar: "" },
        ...selectedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))
      ],
      messages: [
        {
          id: `m-welcome-${Date.now()}`,
          senderId: "system",
          senderName: "System",
          text: `Group "${newGroupName}" created by You.`,
          timestamp: new Date().toISOString(),
          isYou: false
        }
      ]
    };

    setChats(prev => [newChat, ...prev]);
    router.push(`/dashboard/chats/${newChat.id}`);

    // Reset Form
    setNewGroupName("");
    setSelectedMembers([]);
    setShowCreateGroup(false);
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  // Helper to format the last message description
  const getLastMessageText = (chat: Chat) => {
    if (chat.messages.length === 0) return "No messages yet";
    const lastMsg = chat.messages[chat.messages.length - 1];

    if (lastMsg.attachment) {
      if (lastMsg.isYou) {
        return `You: Sent an attachment (${lastMsg.attachment.name})`;
      }
      return `${lastMsg.senderName}: Sent an attachment (${lastMsg.attachment.name})`;
    }

    if (lastMsg.isYou) {
      return `You: ${lastMsg.text}`;
    }

    if (chat.isGroup) {
      // If group and someone else sent it, format as "SenderName: message"
      // Note: If lastMsg.text already starts with "SenderName: ", we clean it to avoid duplication
      const text = lastMsg.text;
      const prefix = `${lastMsg.senderName}: `;
      if (text.startsWith(prefix)) {
        return text;
      }
      return `${lastMsg.senderName}: ${text}`;
    }

    // Direct message by other user
    return lastMsg.text;
  };

  // Filtering Logic
  const filteredChats = chats.filter(chat => {
    // 1. Search Query filter
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Tab Filter
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

  return (
    <div className="flex flex-1 w-full h-[calc(100vh-64px)] min-h-0 bg-background overflow-hidden relative font-sans text-neutral-900">

      {/* Sidebar Container */}
      <div className={`
        ${selectedChatId ? "hidden md:flex" : "flex"}
        w-full md:w-[380px] border-r border-[var(--color-neutral-300)] flex-col bg-white shrink-0 h-full relative z-10
      `}>

        {/* Search Header */}
        <div className="p-5 pb-3">
          <div className="relative border border-[var(--color-primary-400)] rounded-full px-5 py-3 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <span className="absolute left-6 -top-2.5 bg-white px-2 text-xs text-[var(--color-primary-500)] font-semibold uppercase tracking-wider">
              Search Chat
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-neutral-800)] placeholder-[var(--color-neutral-400)] focus:ring-0"
            />
            <Search className="w-4 h-4 text-[var(--color-neutral-500)] shrink-0 ml-2" />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex px-4 border-b border-[var(--color-neutral-200)] gap-1">
          {(["All", "Unread", "Groups", "Individual"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 text-center py-3 text-xs font-semibold tracking-wide transition-all border-b-2 relative uppercase
                ${activeTab === tab
                  ? "text-[var(--color-primary-600)] border-[var(--color-primary-500)]"
                  : "text-[var(--color-neutral-500)] border-transparent hover:text-[var(--color-neutral-700)]"
                }
              `}
            >
              {tab}
              {tab === "Unread" && chats.some(c => c.unreadCount > 0) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-UI-Success)] animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-neutral-200)] scrollbar">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-5 text-center">
              <MessageSquare className="w-10 h-10 text-[var(--color-neutral-400)] mb-2" />
              <p className="text-sm font-medium text-[var(--color-neutral-600)]">No chats found</p>
              <p className="text-xs text-[var(--color-neutral-400)] mt-1">Try resetting filters or search terms</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isSelected = chat.id === selectedChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                  className={`
                    flex items-center gap-3 p-4 cursor-pointer transition-all duration-150 hover:bg-[var(--color-primary-100)]/40
                    ${isSelected ? "bg-[var(--color-primary-100)]/70 border-l-4 border-[var(--color-primary-500)] pl-3" : ""}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={chat.imageUrl}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover border border-[var(--color-neutral-200)]"
                    />
                    {!chat.isGroup && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--color-UI-Success)] border-2 border-white" />
                    )}
                  </div>

                  {/* Name and message details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-sm font-semibold text-[var(--color-neutral-900)] truncate font-aeonicPro">
                        {chat.name}
                      </h4>
                      <span className="text-[10px] font-medium text-[var(--color-neutral-500)] shrink-0 ml-1">
                        {lastMsg ? formatSidebarTimestamp(lastMsg.timestamp) : ""}
                      </span>
                    </div>

                    {/* Last message content */}
                    <div className="text-xs font-normal text-[var(--color-neutral-600)] line-clamp-1 break-all">
                      {getLastMessageText(chat)}
                    </div>

                    {/* Attachment preview inside list item */}
                    {lastMsg?.attachment && (
                      <div className="mt-1 flex items-center gap-1.5 py-0.5 px-2 rounded-full bg-[var(--color-neutral-100)] border border-[var(--color-neutral-300)] text-[10px] w-fit font-medium text-[var(--color-neutral-700)]">
                        <FileText className="w-3.5 h-3.5 text-[var(--color-primary-500)]" />
                        <span className="truncate max-w-[130px]">{lastMsg.attachment.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Unread badge & state */}
                  {chat.unreadCount > 0 && (
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-UI-Success)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {chat.unreadCount}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating action button */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 py-3 px-5 text-white bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)] transition-all cursor-pointer rounded-full shadow-lg hover:shadow-xl font-semibold text-xs tracking-wider z-20 uppercase font-aeonicPro"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Main Body (Chat Area) */}
      <div className={`
        ${selectedChatId ? "flex" : "hidden md:flex"}
        flex-1 flex-col h-full bg-[var(--color-neutral-100)] relative min-w-0
      `}>

        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="h-16 border-b border-[var(--color-neutral-300)] bg-white px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
              <div
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-all"
                title="Click to view details"
              >
                {/* Back button (Mobile only) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/dashboard/chats");
                  }}
                  className="md:hidden p-1.5 rounded-full hover:bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)] shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img
                  src={activeChat.imageUrl}
                  alt={activeChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-[var(--color-neutral-200)] shrink-0"
                />

                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-[var(--color-neutral-900)] truncate font-aeonicPro">
                    {activeChat.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[var(--color-neutral-500)] truncate">
                    {activeChat.isGroup
                      ? `${activeChat.members.map(m => m.name).join(", ")}`
                      : "Online"
                    }
                  </p>
                </div>
              </div>

              {/* Utility Header Actions */}
              <div className="flex items-center gap-1 md:gap-2 text-[var(--color-neutral-600)]">
                <button className="p-2 rounded-full hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-primary-600)] transition-colors">
                  <Phone className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-primary-600)] transition-colors">
                  <Video className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] transition-colors">
                  <MoreVertical className="w-4 h-4 md:w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split layout: messages timeline/input on left, right sidebar on right */}
            <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">

              {/* Message timeline and input */}
              <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Sticky Date Header */}
                <AnimatePresence>
                  {showSticky && stickyDate && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 z-40"
                    >
                      <span className="bg-white border border-[var(--color-neutral-200)] text-[var(--color-neutral-700)] px-4 py-1.5 rounded-full shadow-md font-semibold text-xs whitespace-nowrap">
                        {stickyDate}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Timeline (Scrollable Messages) */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar bg-[var(--color-neutral-100)]"
                >
                  {(() => {
                    const sortedMessages = [...activeChat.messages].sort((a, b) => {
                      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    });

                    let lastMessageDateStr = "";

                    return sortedMessages.map((message, index) => {
                      const isSystem = message.senderId === "system";

                      // Check for date separator
                      const messageDate = new Date(message.timestamp);
                      let separatorElement = null;

                      if (!isNaN(messageDate.getTime())) {
                        const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
                        if (dateKey !== lastMessageDateStr) {
                          lastMessageDateStr = dateKey;
                          const dateText = formatDateSeparator(message.timestamp);
                          separatorElement = (
                            <div
                              key={`sep-${message.id}`}
                              data-date-separator={dateText}
                              className="flex items-center justify-center my-6 select-none"
                            >
                              <div className="flex items-center w-full max-w-lg justify-center text-[var(--color-neutral-500)] text-xs font-medium tracking-wide">
                                <span className="bg-white border border-[var(--color-neutral-200)] text-[var(--color-neutral-700)] px-4 py-1.5 rounded-full shadow-xs backdrop-blur-xs font-semibold shrink-0">
                                  {dateText}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      }

                      const messageElement = isSystem ? (
                        <div key={message.id} data-message-date={message.timestamp} className="flex justify-center my-3">
                          <div className="bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] text-[10px] md:text-xs font-semibold py-1 px-3.5 rounded-full shadow-sm">
                            {message.text}
                          </div>
                        </div>
                      ) : (
                        message.isYou ? (
                          <div
                            key={message.id}
                            id={`msg-${message.id}`}
                            data-message-date={message.timestamp}
                            className="flex justify-end items-end gap-2 transition-all duration-300 w-full"
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
                                  className="p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-[var(--color-primary-600)] shadow-md border border-neutral-200 transition-all active:scale-90"
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-full flex flex-col">
                                {/* Bubble content */}
                                <div
                                  className={`
                                    p-3 md:p-4 rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed transition-all duration-300
                                    bg-[var(--color-primary-600)] text-white rounded-br-none
                                    ${highlightedMessageId === message.id
                                      ? "ring-4 ring-[var(--color-primary-400)] ring-offset-2 scale-[1.02]"
                                      : ""
                                    }
                                  `}
                                >
                                  {/* Reply reference preview inside the bubble */}
                                  {message.replyTo && (
                                    <div
                                      onClick={() => message.replyTo && scrollToMessage(message.replyTo.messageId)}
                                      className="mb-2.5 p-2 rounded-lg border-l-4 text-xs cursor-pointer text-left transition-all hover:opacity-90 select-none bg-[var(--color-primary-700)]/80 border-[var(--color-primary-300)] text-white/90"
                                    >
                                      <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-[var(--color-primary-200)]">
                                        {message.replyTo.senderName}
                                      </p>
                                      <p className="truncate opacity-80">{message.replyTo.text}</p>
                                    </div>
                                  )}

                                  {/* Image with caption support */}
                                  {message.imageUrl && (
                                    <div className="relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm">
                                      <img
                                        src={message.imageUrl}
                                        alt="Attached image"
                                        onClick={() => openImageInModal(message.imageUrl!)}
                                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                      {/* Logo/Icon on top left */}
                                      {message.imageBadgeText && (
                                        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                                          <span className="text-[var(--color-primary-600)] font-bold text-xs">
                                            {message.imageBadgeText}
                                          </span>
                                        </div>
                                      )}
                                      {/* Date/Time text on top right */}
                                      {message.imageTopRightText && (
                                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full font-medium shadow-xs">
                                          {message.imageTopRightText}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* If attachment exists */}
                                  {message.attachment && (
                                    <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-[var(--color-primary-700)] border-[var(--color-primary-500)] text-white">
                                      <FileText className="w-7 h-7 shrink-0 text-white fill-neutral-500/10" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate leading-tight">
                                          {message.attachment.name}
                                        </p>
                                        <p className="text-[9px] mt-0.5 text-[var(--color-primary-200)]">
                                          {message.attachment.size || "Unknown size"}
                                        </p>
                                      </div>
                                      <button className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0">
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}

                                  <p className="break-words">{message.text}</p>

                                  {/* Timestamp & Read Status inside bubble */}
                                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                                    <span>{formatTime12h(message.timestamp)}</span>
                                    <CheckCheck className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={message.id}
                            id={`msg-${message.id}`}
                            data-message-date={message.timestamp}
                            className="flex justify-start items-end gap-2 transition-all duration-300 w-full"
                          >
                            {/* Participant Avatar for group chat left-aligned messages */}
                            {!message.isYou && activeChat.isGroup && (
                              <div className="w-7 h-7 rounded-full bg-[var(--color-primary-300)] text-[10px] font-bold text-white flex items-center justify-center shrink-0 uppercase shadow-sm mb-0.5">
                                {message.senderName.substring(0, 2)}
                              </div>
                            )}

                            <div className="relative group flex items-end gap-2 max-w-[75%] md:max-w-[60%]">
                              <div className="w-full flex flex-col">
                                {/* Sender Name in Group Chat */}
                                {!message.isYou && activeChat.isGroup && (
                                  <span className="text-[10px] font-bold text-[var(--color-neutral-500)] ml-2.5 mb-0.5">
                                    {message.senderName}
                                  </span>
                                )}

                                {/* Bubble content */}
                                <div
                                  className={`
                                    p-3 md:p-4 rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed transition-all duration-300
                                    bg-white text-[var(--color-neutral-900)] rounded-bl-none border border-[var(--color-neutral-200)]
                                    ${highlightedMessageId === message.id
                                      ? "ring-4 ring-[var(--color-primary-400)] ring-offset-2 scale-[1.02]"
                                      : ""
                                    }
                                  `}
                                >
                                  {/* Reply reference preview inside the bubble */}
                                  {message.replyTo && (
                                    <div
                                      onClick={() => message.replyTo && scrollToMessage(message.replyTo.messageId)}
                                      className="mb-2.5 p-2 rounded-lg border-l-4 text-xs cursor-pointer text-left transition-all hover:opacity-90 select-none bg-neutral-100 border-[var(--color-primary-500)] text-neutral-700"
                                    >
                                      <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-[var(--color-primary-600)]">
                                        {message.replyTo.senderName}
                                      </p>
                                      <p className="truncate opacity-80">{message.replyTo.text}</p>
                                    </div>
                                  )}

                                  {/* Image with caption support */}
                                  {message.imageUrl && (
                                    <div className="relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm">
                                      <img
                                        src={message.imageUrl}
                                        alt="Attached image"
                                        onClick={() => openImageInModal(message.imageUrl!)}
                                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                      {/* Logo/Icon on top left */}
                                      {message.imageBadgeText && (
                                        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                                          <span className="text-[var(--color-primary-600)] font-bold text-xs">
                                            {message.imageBadgeText}
                                          </span>
                                        </div>
                                      )}
                                      {/* Date/Time text on top right */}
                                      {message.imageTopRightText && (
                                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full font-medium shadow-xs">
                                          {message.imageTopRightText}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* If attachment exists */}
                                  {message.attachment && (
                                    <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-[var(--color-neutral-100)] border-[var(--color-neutral-300)] text-[var(--color-neutral-800)]">
                                      <FileText className="w-7 h-7 shrink-0 text-white fill-neutral-500/10" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate leading-tight">
                                          {message.attachment.name}
                                        </p>
                                        <p className="text-[9px] mt-0.5 text-[var(--color-neutral-500)]">
                                          {message.attachment.size || "Unknown size"}
                                        </p>
                                      </div>
                                      <button className="p-1.5 rounded-full hover:bg-black/10 transition-colors shrink-0">
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}

                                  <p className="break-words">{message.text}</p>

                                  {/* Timestamp & Read Status inside bubble */}
                                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                                    <span>{formatTime12h(message.timestamp)}</span>
                                  </div>
                                </div>
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
                                  className="p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-[var(--color-primary-600)] shadow-md border border-neutral-200 transition-all active:scale-90"
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      );

                      return (
                        <React.Fragment key={message.id}>
                          {separatorElement}
                          {messageElement}
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Container (with Reply Preview) */}
                <div className="border-t border-[var(--color-neutral-300)] bg-white shrink-0 z-10 flex flex-col shadow-inner">
                  {/* Reply Preview Bar */}
                  <AnimatePresence>
                    {replyingToMessage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-[var(--color-neutral-100)] border-b border-[var(--color-neutral-200)] flex items-center justify-between px-6 py-2.5 gap-4"
                      >
                        <div className="flex items-center gap-2 border-l-4 border-[var(--color-primary-500)] pl-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-600)]">
                              Replying to {replyingToMessage.senderName}
                            </p>
                            <p className="text-xs text-[var(--color-neutral-600)] truncate">
                              {replyingToMessage.text}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingToMessage(null)}
                          className="p-1 rounded-full hover:bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)] transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="h-20 px-4 md:px-6 flex items-center gap-3 w-full"
                  >
                    {/* Attachment Button */}
                    <button
                      type="button"
                      className="p-2.5 rounded-full text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-neutral-100)] transition-colors shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Input field */}
                    <div className="flex-1 bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-300)] rounded-full px-4 py-2.5 flex items-center transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-neutral-800)] placeholder-[var(--color-neutral-500)] focus:ring-0 py-0.5"
                      />
                      <button
                        type="button"
                        className="p-1 text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] transition-colors shrink-0 ml-2"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className={`
                        p-3 rounded-full text-white transition-all shrink-0 shadow-md hover:shadow-lg
                        ${inputMessage.trim()
                          ? "bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] cursor-pointer scale-100 active:scale-95"
                          : "bg-[var(--color-neutral-300)] cursor-not-allowed opacity-80"
                        }
                      `}
                    >
                      <Send className="w-4 h-4 md:w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar Details */}
              <AnimatePresence>
                {showRightSidebar && (
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute inset-y-0 right-0 md:relative w-80 lg:w-[350px] shrink-0 border-l border-[var(--color-neutral-300)] bg-white flex flex-col h-full z-20 shadow-lg md:shadow-none overflow-hidden"
                  >
                    {/* Header profile info */}
                    <div
                      className="relative p-6 text-center border-b border-[var(--color-neutral-200)] shrink-0"
                      style={{
                        backgroundColor: "var(--color-neutral-100)",
                        backgroundImage: "radial-gradient(var(--color-neutral-300) 1px, transparent 0)",
                        backgroundSize: "16px 16px"
                      }}
                    >
                      {/* Close button (Mobile-friendly) */}
                      <button
                        onClick={() => setShowRightSidebar(false)}
                        className="absolute top-4 left-4 p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-black border border-neutral-200 shadow-sm transition-all active:scale-95 cursor-pointer z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Pencil icon */}
                      <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 shadow-sm transition-all active:scale-95 cursor-pointer z-10"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Avatar */}
                      <img
                        src={activeChat.imageUrl}
                        alt={activeChat.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto mt-6"
                      />

                      {/* Title */}
                      <h3 className="text-base font-bold text-[var(--color-neutral-900)] mt-3 font-aeonicPro leading-snug">
                        {activeChat.name}
                      </h3>

                      {/* Sub-label */}
                      <p className="text-[10px] font-semibold text-[var(--color-neutral-500)] mt-1.5 uppercase tracking-wider">
                        {activeChat.isGroup
                          ? `Group • ${activeChat.id === "2" ? "1022" : activeChat.id === "3" ? "28" : "12"} Members`
                          : "Individual • Member"
                        }
                      </p>

                      {/* Custom dynamic description */}
                      <p className="text-xs text-[var(--color-neutral-600)] mt-3 leading-relaxed px-2 font-normal">
                        {activeChat.id === "1" && "OppSkills Student Ambassador and Hackathon developer."}
                        {activeChat.id === "2" && "This Group is part of Ecell Community of NIT Bhopal here only alumni is present."}
                        {activeChat.id === "3" && "Organizing committee for the annual OppSkills E-Summit festival."}
                        {activeChat.id === "4" && "Coordination channel for operations, timetables, and venue setup."}
                      </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-4 border-b border-[var(--color-neutral-200)] bg-white shrink-0">
                      {(["Media", "Docs"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveRightSidebarTab(tab)}
                          className={`
                            flex-1 text-center py-3 text-xs font-semibold tracking-wide transition-all border-b-2 relative uppercase cursor-pointer
                            ${activeRightSidebarTab === tab
                              ? "text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-bold"
                              : "text-[var(--color-neutral-500)] border-transparent hover:text-[var(--color-neutral-700)] font-medium"
                            }
                          `}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable list content */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar bg-white">
                      {activeRightSidebarTab === "Media" ? (
                        <div className="space-y-5">
                          {galleryImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <ImageIcon className="w-8 h-8 text-[var(--color-neutral-400)] mb-2" />
                              <p className="text-xs font-semibold text-[var(--color-neutral-600)]">No media shared yet</p>
                              <p className="text-[10px] text-[var(--color-neutral-400)] mt-1">Photos shared in this chat will show up here</p>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-[10px] font-bold text-[var(--color-neutral-700)] uppercase tracking-wider mb-2.5">
                                Shared Media ({galleryImages.length})
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                {galleryImages.map((src, i) => {
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => openImageInModal(src)}
                                      className="aspect-square rounded-lg overflow-hidden border border-neutral-100 shadow-xs hover:scale-105 transition-transform duration-200 cursor-pointer"
                                    >
                                      <img src={src} className="w-full h-full object-cover" alt="Media content" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Shared Documents list */}
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer group">
                            <div className="p-2 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-[var(--color-primary-600)] transition-colors">
                                E Summit Time table.pdf
                              </p>
                              <p className="text-[10px] text-neutral-500 mt-0.5">
                                1.4 MB • 24 Aug 2026
                              </p>
                            </div>
                            <button className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer group">
                            <div className="p-2 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-[var(--color-primary-600)] transition-colors">
                                OppSkills Code of Conduct.pdf
                              </p>
                              <p className="text-[10px] text-neutral-500 mt-0.5">
                                480 KB • 12 May 2026
                              </p>
                            </div>
                            <button className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </>
        ) : (
          /* Placeholder View (Default Screen) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--color-neutral-100)]">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-600)]">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-300 text-[var(--color-neutral-800)] flex items-center justify-center shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-[var(--color-neutral-900)] mb-2 font-aeonicPro tracking-tight">
              Your OppSkills Workspace Chat
            </h2>
            <p className="text-sm text-[var(--color-neutral-600)] max-w-sm leading-relaxed mb-6">
              Select an active conversation or user from the sidebar directory to view messages, attachments, and coordinate on college events.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[var(--color-neutral-600)]">
              <span className="py-1.5 px-3 rounded-full bg-white border border-[var(--color-neutral-200)] shadow-sm">
                💬 Event Coordination
              </span>
              <span className="py-1.5 px-3 rounded-full bg-white border border-[var(--color-neutral-200)] shadow-sm">
                👥 Group Channels
              </span>
              <span className="py-1.5 px-3 rounded-full bg-white border border-[var(--color-neutral-200)] shadow-sm">
                📂 File Sharing
              </span>
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
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-neutral-300)]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--color-neutral-200)]">
                <h3 className="text-base font-bold text-[var(--color-neutral-900)] font-aeonicPro">
                  Create New Group
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="p-1.5 rounded-full hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateGroup}>
                <div className="p-6 space-y-4">
                  {/* Group Name input */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-neutral-700)] uppercase tracking-wider mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. E-Summit Design Team"
                      className="w-full bg-[var(--color-neutral-100)] border border-[var(--color-neutral-300)] focus:border-[var(--color-primary-500)] rounded-xl py-3 px-4 text-sm text-[var(--color-neutral-800)] outline-none transition-colors"
                    />
                  </div>

                  {/* Add Members checklist */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-neutral-700)] uppercase tracking-wider mb-2">
                      Select Members
                    </label>
                    <div className="max-h-52 overflow-y-auto border border-[var(--color-neutral-200)] rounded-xl divide-y divide-[var(--color-neutral-150)] p-2 bg-[var(--color-neutral-50)] scrollbar">
                      {mockContacts.map((contact) => {
                        const isSelected = selectedMembers.includes(contact.id);
                        return (
                          <div
                            key={contact.id}
                            onClick={() => toggleSelectMember(contact.id)}
                            className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-[var(--color-primary-100)]/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-9 h-9 rounded-full object-cover border border-[var(--color-neutral-200)]"
                              />
                              <span className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                {contact.name}
                              </span>
                            </div>

                            <div className={`
                              w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                              ${isSelected
                                ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white"
                                : "border-[var(--color-neutral-400)] bg-white"
                              }
                            `}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--color-neutral-50)] border-t border-[var(--color-neutral-200)]">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="py-2.5 px-4 text-xs font-bold text-[var(--color-neutral-700)] hover:text-black transition-colors uppercase tracking-wider font-aeonicPro"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newGroupName.trim() || selectedMembers.length === 0}
                    className={`
                      py-2.5 px-5 text-xs font-bold text-white rounded-full transition-all uppercase tracking-wider font-aeonicPro shadow-md
                      ${newGroupName.trim() && selectedMembers.length > 0
                        ? "bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] cursor-pointer"
                        : "bg-[var(--color-neutral-300)] cursor-not-allowed"
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
        {showImageModal && galleryImages.length > 0 && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center select-none z-50">
            {/* Close button (top right) */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
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
              <img
                src={galleryImages[activeModalImageIndex]}
                alt="Modal gallery image"
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              />
              {/* Image index counter indicator */}
              <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-wide border border-white/10">
                {activeModalImageIndex + 1} / {galleryImages.length}
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

    </div>
  );
}