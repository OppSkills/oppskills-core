"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, MessageSquare, Plus, Search } from "lucide-react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { formatLastMessagePreview } from "@/lib/chat/chatMappers";
import { isDmPeerOnline } from "@/lib/chat/formatPresence";
import type { Chat, SearchUserHit } from "@/lib/chat/types";
import { ChatSidebarFallback, formatSidebarTimestamp } from "./chatDisplay";

type ChatTab = "All" | "Unread" | "Groups" | "Individual";

interface ChatSidebarProps {
  activeTab: ChatTab;
  chats: Chat[];
  currentUserId: string | null;
  filteredChats: Chat[];
  loading: boolean;
  searchQuery: string;
  searchUsers: SearchUserHit[];
  selectedChatId: string | null;
  showLeftSidebar: boolean;
  onCreateGroup: () => void;
  onOpenUserChat: (userId: string) => void;
  onRunSearch: (query: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSelectChat: (chatId: string) => void;
  onSetActiveTab: (tab: ChatTab) => void;
  onSetShowLeftSidebar: (show: boolean) => void;
}

function getLastMessageTimestamp(chat: Chat): string {
  const lastMsg = chat.messages[chat.messages.length - 1];
  if (lastMsg) return formatSidebarTimestamp(lastMsg.timestamp);
  if (chat.lastMessagePreview) {
    return formatSidebarTimestamp(chat.lastMessagePreview.createdAt);
  }
  return "";
}

const ChatSidebar = React.memo(function ChatSidebar({
  activeTab,
  chats,
  currentUserId,
  filteredChats,
  loading,
  searchQuery,
  searchUsers,
  selectedChatId,
  showLeftSidebar,
  onCreateGroup,
  onOpenUserChat,
  onRunSearch,
  onSearchQueryChange,
  onSelectChat,
  onSetActiveTab,
  onSetShowLeftSidebar,
}: ChatSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {showLeftSidebar && selectedChatId && (
          <motion.div
            key="left-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => onSetShowLeftSidebar(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        key="left-sidebar"
        initial={selectedChatId ? { x: "-100%" } : false}
        animate={{ x: showLeftSidebar || !selectedChatId ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-10
          ${selectedChatId ? "w-[85vw] max-w-[360px]" : "w-full max-w-none"}
          md:w-[320px] lg:w-[380px]
          border-r border-neutral-300 flex flex-col bg-white shrink-0 h-full lg:transform-none!
        `}
      >
        <div className="p-5 pb-3">
          <div className="relative border border-primary-400 rounded-full px-5 py-3 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <span className="absolute left-6 -top-2.5 bg-white px-2 text-xs text-primary-500 font-semibold uppercase tracking-wider">
              Search Chat
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchQueryChange(e.target.value);
                onRunSearch(e.target.value);
              }}
              placeholder="Search conversations..."
              className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-400 focus:ring-0"
            />
            <Search className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
          </div>
        </div>

        <div className="flex px-4 border-b border-neutral-200 overflow-x-auto scrollbar-none">
          {(["All", "Unread", "Groups", "Individual"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onSetActiveTab(tab)}
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
                    onClick={() => onSelectChat(chat.id)}
                    className={`
                      flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-primary-100/40
                      border-l-4 pl-3
                      ${isSelected ? "bg-primary-100/70 border-l-primary-500" : "border-l-transparent"}
                    `}
                  >
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

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-semibold text-neutral-900 truncate font-aeonicPro">
                          {chat.name}
                        </h4>
                        <span className="text-[10px] font-medium text-neutral-500 shrink-0 ml-1">
                          {getLastMessageTimestamp(chat)}
                        </span>
                      </div>

                      <div className="text-xs font-normal text-neutral-600 line-clamp-1 break-all">
                        {formatLastMessagePreview(
                          chat.lastMessagePreview,
                          chat,
                          currentUserId,
                        )}
                      </div>

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
                  onClick={() => onOpenUserChat(u.id)}
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

        <button
          onClick={onCreateGroup}
          className="absolute bottom-6 right-6 flex items-center gap-2 py-3 px-5 text-white bg-primary-700 hover:bg-primary-800 transition-all cursor-pointer rounded-full shadow-lg hover:shadow-xl font-semibold text-xs tracking-wider z-20 uppercase font-aeonicPro"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </motion.div>
    </>
  );
});

export default ChatSidebar;
