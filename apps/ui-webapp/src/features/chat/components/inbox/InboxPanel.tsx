"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Chat, SearchUserHit } from "../../domain/types";
import ChatSidebar from "./ChatSidebar";

const CreateGroupModal = dynamic(() => import("./CreateGroupModal"), {
  ssr: false,
});

type ChatTab = "All" | "Unread" | "Groups" | "Individual";

type InboxPanelProps = {
  chats: Chat[];
  currentUserId: string | null;
  loading: boolean;
  searchUsers: SearchUserHit[];
  groupSearchUsers: SearchUserHit[];
  selectedChatId: string | null;
  showLeftSidebar: boolean;
  onOpenUserChat: (userId: string) => void;
  onRunSearch: (query: string) => void;
  onRunGroupMemberSearch: (query: string) => void;
  onSelectChat: (chatId: string) => void;
  onSetShowLeftSidebar: (show: boolean) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
};

export function InboxPanel({
  chats,
  currentUserId,
  loading,
  searchUsers,
  groupSearchUsers,
  selectedChatId,
  showLeftSidebar,
  onOpenUserChat,
  onRunSearch,
  onRunGroupMemberSearch,
  onSelectChat,
  onSetShowLeftSidebar,
  onCreateGroup,
}: InboxPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("All");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      switch (activeTab) {
        case "Unread":
          return chat.unreadCount > 0;
        case "Groups":
          return chat.isGroup;
        case "Individual":
          return !chat.isGroup;
        default:
          return true;
      }
    });
  }, [chats, activeTab]);

  const handleSidebarSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleGroupMemberSearchChange = useCallback(
    (value: string) => {
      setGroupMemberSearch(value);
      onRunGroupMemberSearch(value);
    },
    [onRunGroupMemberSearch],
  );

  const toggleSelectMember = useCallback((id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  }, []);

  const handleCreateGroup = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGroupName.trim()) return;
      onCreateGroup(newGroupName.trim(), selectedMembers);
      setNewGroupName("");
      setSelectedMembers([]);
      setGroupMemberSearch("");
      setShowCreateGroup(false);
    },
    [newGroupName, onCreateGroup, selectedMembers],
  );

  return (
    <>
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
        onCreateGroup={() => setShowCreateGroup(true)}
        onOpenUserChat={onOpenUserChat}
        onRunSearch={onRunSearch}
        onSearchQueryChange={handleSidebarSearchChange}
        onSelectChat={onSelectChat}
        onSetActiveTab={setActiveTab}
        onSetShowLeftSidebar={onSetShowLeftSidebar}
      />

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
    </>
  );
}
