"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { Chat, Message } from "../../domain/types";
import type { useChatComposer } from "../../hooks/composer/useChatComposer";

const ActiveChatHeader = dynamic(
  () => import("../details/ActiveChatHeader"),
  { ssr: false },
);

const ChatTimeline = dynamic(() => import("./ChatTimeline"), { ssr: false });

const MessageComposer = dynamic(() => import("./MessageComposer"), {
  ssr: false,
});

const MessageFilterBar = dynamic(() => import("./MessageFilterBar"), {
  ssr: false,
});

const StickyDateBadge = dynamic(() => import("./StickyDateBadge"), {
  ssr: false,
});

const ChatAttachmentComposer = dynamic(
  () =>
    import("../shared/ChatAttachmentComposer").then(
      (mod) => mod.ChatAttachmentComposer,
    ),
  { ssr: false },
);

const ChatEmojiPicker = dynamic(
  () =>
    import("../shared/ChatEmojiPicker").then((mod) => mod.ChatEmojiPicker),
  { ssr: false },
);

type FileComposer = ReturnType<typeof useChatComposer>;

type ThreadPanelProps = {
  activeChat: Chat;
  chatMenuRef: React.RefObject<HTMLDivElement | null>;
  chatPresenceSubtitle: string;
  currentUserId: string | null;
  currentMatchIndex: number;
  endDateFilter: string;
  fileComposer: FileComposer;
  highlightedMessageId: string | null;
  inputMessage: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isGroupAdmin: boolean;
  isMobile: boolean;
  isSearchingMessages: boolean;
  matchingMessageIds: string[];
  messageSearchQuery: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesLoading: boolean;
  isLoadingOlder: boolean;
  replyingToMessage: Message | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  topSentinelRef: React.RefObject<HTMLDivElement | null>;
  showChatMenu: boolean;
  showDateFilter: boolean;
  showRightSidebar: boolean;
  showSticky: boolean;
  startDateFilter: string;
  stickyDate: string;
  attachmentAnchorRef: React.RefObject<HTMLDivElement | null>;
  onAttachmentMenuClose: () => void;
  onAttachmentMenuToggle: () => void;
  onBackToChats: () => void;
  onClearDateFilters: () => void;
  onCloseMessageFilters: () => void;
  onComposerCloseRequest: () => void;
  onCurrentMatchIndexChange: React.Dispatch<React.SetStateAction<number>>;
  onDeleteChat: () => void;
  onDeleteGroup: () => void;
  onCancelUpload?: (messageId: string) => void;
  onDownloadMessage: (message: Message) => void;
  onEmojiSelect: (emoji: string) => void;
  onEndDateFilterChange: (value: string) => void;
  onFilterByDate: () => void;
  onInputChange: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLeaveGroup: () => void;
  onMessageSearchQueryChange: (value: string) => void;
  onOpenImage: (messageId: string, displaySrc?: string) => void;
  onReply: (message: Message) => void;
  onReplyCancel: () => void;
  onRetryUpload?: (messageId: string) => void;
  onScroll: () => void;
  onScrollToMessage: (messageId: string) => void;
  onSearchMessages: () => void;
  onSendAttachments: () => void;
  onSendMessage: (e: React.FormEvent) => void;
  onStartDateFilterChange: (value: string) => void;
  onToggleChatMenu: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  detailsSidebar: React.ReactNode;
};

export function ThreadPanel({
  activeChat,
  chatMenuRef,
  chatPresenceSubtitle,
  currentUserId,
  currentMatchIndex,
  endDateFilter,
  fileComposer,
  highlightedMessageId,
  inputMessage,
  inputRef,
  isGroupAdmin,
  isMobile,
  isSearchingMessages,
  matchingMessageIds,
  messageSearchQuery,
  messagesEndRef,
  messagesLoading,
  isLoadingOlder,
  replyingToMessage,
  scrollContainerRef,
  topSentinelRef,
  showChatMenu,
  showDateFilter,
  showRightSidebar,
  showSticky,
  startDateFilter,
  stickyDate,
  attachmentAnchorRef,
  onAttachmentMenuClose,
  onAttachmentMenuToggle,
  onBackToChats,
  onClearDateFilters,
  onCloseMessageFilters,
  onComposerCloseRequest,
  onCurrentMatchIndexChange,
  onDeleteChat,
  onDeleteGroup,
  onCancelUpload,
  onDownloadMessage,
  onEmojiSelect,
  onEndDateFilterChange,
  onFilterByDate,
  onInputChange,
  onInputKeyDown,
  onLeaveGroup,
  onMessageSearchQueryChange,
  onOpenImage,
  onReply,
  onReplyCancel,
  onRetryUpload,
  onScroll,
  onScrollToMessage,
  onSearchMessages,
  onSendAttachments,
  onSendMessage,
  onStartDateFilterChange,
  onToggleChatMenu,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  detailsSidebar,
}: ThreadPanelProps) {
  return (
    <>
      <ActiveChatHeader
        activeChat={activeChat}
        chatMenuRef={chatMenuRef}
        chatPresenceSubtitle={chatPresenceSubtitle}
        currentUserId={currentUserId}
        isGroupAdmin={isGroupAdmin}
        showChatMenu={showChatMenu}
        showRightSidebar={showRightSidebar}
        onBackToChats={onBackToChats}
        onDeleteChat={onDeleteChat}
        onDeleteGroup={onDeleteGroup}
        onFilterByDate={onFilterByDate}
        onLeaveGroup={onLeaveGroup}
        onSearchMessages={onSearchMessages}
        onToggleChatMenu={onToggleChatMenu}
        onToggleLeftSidebar={onToggleLeftSidebar}
        onToggleRightSidebar={onToggleRightSidebar}
      />

      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
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
            onClose={onComposerCloseRequest}
            onSend={onSendAttachments}
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
            onClearDates={onClearDateFilters}
            onClose={onCloseMessageFilters}
            onCurrentMatchIndexChange={onCurrentMatchIndexChange}
            onEndDateFilterChange={onEndDateFilterChange}
            onMessageSearchQueryChange={onMessageSearchQueryChange}
            onStartDateFilterChange={onStartDateFilterChange}
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
            isLoadingOlder={isLoadingOlder}
            scrollContainerRef={scrollContainerRef}
            topSentinelRef={topSentinelRef}
            selectedChatId={activeChat.id}
            showDateFilter={showDateFilter}
            startDateFilter={startDateFilter}
            onCancelUpload={onCancelUpload}
            onDownloadMessage={onDownloadMessage}
            onOpenImage={onOpenImage}
            onReply={onReply}
            onRetryUpload={onRetryUpload}
            onScroll={onScroll}
            onScrollToMessage={onScrollToMessage}
          />

          <MessageComposer
            attachmentAnchorRef={attachmentAnchorRef}
            attachmentMenuOpen={fileComposer.attachmentMenuOpen}
            EmojiPicker={ChatEmojiPicker}
            inputMessage={inputMessage}
            inputRef={inputRef}
            replyingToMessage={replyingToMessage}
            onAttachmentMenuToggle={onAttachmentMenuToggle}
            onAudioPick={fileComposer.triggerAudioPick}
            onCameraPick={fileComposer.triggerCamera}
            onDocumentPick={fileComposer.triggerDocPick}
            onEmojiSelect={onEmojiSelect}
            onInputChange={onInputChange}
            onInputKeyDown={onInputKeyDown}
            onMediaPick={fileComposer.triggerMediaPick}
            onMenuClose={onAttachmentMenuClose}
            onReplyCancel={onReplyCancel}
            onSubmit={onSendMessage}
          />
        </div>

        {detailsSidebar}
      </div>
    </>
  );
}
