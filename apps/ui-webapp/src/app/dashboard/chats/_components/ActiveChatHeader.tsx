"use client";

import React from "react";
import {
  ArrowLeft,
  Calendar,
  LogOut,
  MoreVertical,
  PanelLeftClose,
  Search,
  Trash2,
} from "lucide-react";
import { isDmPeerOnline } from "@/lib/chat/formatPresence";
import type { Chat } from "@/lib/chat/types";

interface ActiveChatHeaderProps {
  activeChat: Chat;
  chatMenuRef: React.RefObject<HTMLDivElement | null>;
  chatPresenceSubtitle: string;
  currentUserId: string | null;
  isGroupAdmin: boolean;
  showChatMenu: boolean;
  showRightSidebar: boolean;
  onBackToChats: () => void;
  onDeleteChat: () => void;
  onDeleteGroup: () => void;
  onFilterByDate: () => void;
  onLeaveGroup: () => void;
  onSearchMessages: () => void;
  onToggleChatMenu: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

const ActiveChatHeader = React.memo(function ActiveChatHeader({
  activeChat,
  chatMenuRef,
  chatPresenceSubtitle,
  currentUserId,
  isGroupAdmin,
  showChatMenu,
  showRightSidebar,
  onBackToChats,
  onDeleteChat,
  onDeleteGroup,
  onFilterByDate,
  onLeaveGroup,
  onSearchMessages,
  onToggleChatMenu,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: ActiveChatHeaderProps) {
  return (
    <div className="h-16 border-b border-neutral-300 bg-white px-3 md:px-5 flex items-center justify-between shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onToggleLeftSidebar}
          className="hidden md:flex lg:hidden p-2 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 shrink-0 transition-colors"
          aria-label="Toggle chat list"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>

        <button
          onClick={onBackToChats}
          className="flex md:hidden p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 shrink-0 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={onToggleRightSidebar}
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
                !activeChat.isGroup && isDmPeerOnline(activeChat, currentUserId)
                  ? "text-emerald-600"
                  : "text-neutral-500"
              }`}
            >
              {chatPresenceSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-neutral-600 shrink-0">
        <div className="relative" ref={chatMenuRef}>
          <button
            type="button"
            onClick={onToggleChatMenu}
            className="p-2 rounded-full hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            aria-label="Chat options"
          >
            <MoreVertical className="size-4 md:size-5" />
          </button>
          {showChatMenu && activeChat && (
            <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50">
              <button
                type="button"
                onClick={onSearchMessages}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
              >
                <Search className="w-4 h-4 shrink-0" />
                Search messages
              </button>
              <button
                type="button"
                onClick={onFilterByDate}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Filter by date
              </button>

              <div className="border-t border-neutral-100 my-1" />

              {activeChat.isGroup && !isGroupAdmin && (
                <button
                  type="button"
                  onClick={onLeaveGroup}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-700 text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Leave group
                </button>
              )}
              {activeChat.isGroup && isGroupAdmin && (
                <button
                  type="button"
                  onClick={onDeleteGroup}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  Delete group for all
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteChat}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                {activeChat.isGroup ? "Delete chat" : "Delete conversation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ActiveChatHeader;
