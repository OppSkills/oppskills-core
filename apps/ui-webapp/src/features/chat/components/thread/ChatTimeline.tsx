"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, FileText, CornerUpLeft } from "lucide-react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ChatMessageImage } from "@/features/chat/components/shared/ChatMessageImage";
import { ChatMessageVideo } from "@/features/chat/components/shared/ChatMessageVideo";
import type { Chat, Message } from "@/features/chat/domain/types";

function isVideoMessage(message: Message): boolean {
  return message.attachment?.type === "video";
}
import {
  ChatTimelineFallback,
  formatDateSeparator,
  formatTime12h,
  HighlightedText,
  OutgoingMessageStatus,
} from "./chatDisplay";

interface ChatTimelineProps {
  activeChat: Chat;
  currentMatchIndex: number;
  endDateFilter: string;
  highlightedMessageId: string | null;
  isMobile: boolean;
  isSearchingMessages: boolean;
  matchingMessageIds: string[];
  messageSearchQuery: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesLoading: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedChatId: string;
  showDateFilter: boolean;
  startDateFilter: string;
  onDownloadMessage: (message: Message) => void;
  onOpenImage: (messageId: string) => void;
  onReply: (message: Message) => void;
  onScroll: () => void;
  onScrollToMessage: (messageId: string) => void;
}

const ChatTimeline = React.memo(function ChatTimeline({
  activeChat,
  currentMatchIndex,
  endDateFilter,
  highlightedMessageId,
  isMobile,
  isSearchingMessages,
  matchingMessageIds,
  messageSearchQuery,
  messagesEndRef,
  messagesLoading,
  scrollContainerRef,
  selectedChatId,
  showDateFilter,
  startDateFilter,
  onDownloadMessage,
  onOpenImage,
  onReply,
  onScroll,
  onScrollToMessage,
}: ChatTimelineProps) {
  const renderedMessages = React.useMemo(() => {
    if (activeChat.messages.length === 0) return null;

    const sortedMessages = [...activeChat.messages].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const filteredMessages = sortedMessages.filter((message) => {
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

      return true;
    });

    let lastMessageDateStr = "";

    return filteredMessages.map((message) => {
      const isSystem = message.type === "SYSTEM";

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
              <div className="flex items-center w-full max-w-lg justify-center text-neutral-500 text-xs font-medium tracking-wide">
                <span className="bg-white border border-neutral-200 text-neutral-700 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-xs font-semibold shrink-0">
                  {dateText}
                </span>
              </div>
            </div>
          );
        }
      }

      const isHighlighted =
        highlightedMessageId === message.id ||
        (isSearchingMessages &&
          matchingMessageIds[currentMatchIndex] === message.id);

      const isVideo = isVideoMessage(message);
      const isImageOnly =
        Boolean(message.imageUrl) && !isVideo && !message.text.trim();
      const isVideoOnly = isVideo && !message.text.trim();
      const isMediaOnly = isImageOnly || isVideoOnly;

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
            <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
              <button
                type="button"
                onClick={() => onReply(message)}
                title="Reply"
                className="p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 shadow-md border border-neutral-200 transition-all active:scale-90"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full flex flex-col relative">
              {isMobile && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-0 flex items-center justify-center text-primary-500 pointer-events-none">
                  <CornerUpLeft className="w-5 h-5 text-neutral-400 animate-pulse" />
                </div>
              )}
              <motion.div
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                animate={{ x: 0 }}
                onDragEnd={(event, info) => {
                  const threshold = 55;
                  if (info.offset.x < -threshold) {
                    onReply(message);
                  }
                }}
                dragTransition={{
                  bounceStiffness: 800,
                  bounceDamping: 40,
                }}
                className={`
                  ${isMediaOnly ? "p-0 overflow-hidden" : "p-3 md:p-4"} rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed min-w-[80px] cursor-grab active:cursor-grabbing select-none z-10
                  bg-primary-600 text-white rounded-br-none transition-[box-shadow,border-color,background-color] duration-300
                  ${isHighlighted ? "ring-4 ring-yellow-400 ring-offset-2 scale-[1.02]" : ""}
                `}
              >
                {message.replyTo && (
                  <div
                    onClick={() =>
                      message.replyTo &&
                      onScrollToMessage(message.replyTo.messageId)
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

                {isVideo && (
                  <ChatMessageVideo
                    message={message}
                    conversationId={selectedChatId}
                    flush={isVideoOnly}
                    overlayTimestamp={
                      isVideoOnly
                        ? formatTime12h(message.timestamp)
                        : undefined
                    }
                    overlayFooter={
                      isVideoOnly ? (
                        <OutgoingMessageStatus message={message} />
                      ) : undefined
                    }
                    className={isVideoOnly ? "rounded-br-none" : ""}
                    onOpen={() => onOpenImage(message.id)}
                    onDownload={() => onDownloadMessage(message)}
                  />
                )}

                {message.imageUrl && !isVideo && (
                  <ChatMessageImage
                    message={message}
                    conversationId={selectedChatId}
                    flush={isImageOnly}
                    overlayTimestamp={
                      isImageOnly
                        ? formatTime12h(message.timestamp)
                        : undefined
                    }
                    overlayFooter={
                      isImageOnly ? (
                        <OutgoingMessageStatus message={message} />
                      ) : undefined
                    }
                    className={isImageOnly ? "rounded-br-none" : ""}
                    onOpen={() => onOpenImage(message.id)}
                    onDownload={() => onDownloadMessage(message)}
                  />
                )}

                {message.attachment && !message.imageUrl && !isVideo && (
                  <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-primary-700 border-primary-500 text-white">
                    <FileText className="w-7 h-7 shrink-0 text-white fill-neutral-500/10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {message.attachment.name}
                      </p>
                      <p className="text-[9px] mt-0.5 text-primary-200">
                        {message.attachment.size || "Unknown size"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDownloadMessage(message)}
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
                      highlight={isSearchingMessages ? messageSearchQuery : ""}
                    />
                  </p>
                ) : null}

                {!isMediaOnly && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                    <span>{formatTime12h(message.timestamp)}</span>
                    <OutgoingMessageStatus message={message} />
                  </div>
                )}
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
          {!message.isYou && activeChat.isGroup && (
            <div className="w-7 h-7 rounded-full bg-primary-300 text-[10px] font-bold text-white flex items-center justify-center shrink-0 uppercase shadow-sm mb-0.5">
              {message.senderName.substring(0, 2)}
            </div>
          )}

          <div className="relative group flex items-end gap-2 max-w-[75%] md:max-w-[60%]">
            <div className="w-full flex flex-col relative">
              {isMobile && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-0 flex items-center justify-center text-primary-500 pointer-events-none">
                  <CornerUpLeft className="w-5 h-5 text-neutral-400 animate-pulse" />
                </div>
              )}
              <motion.div
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                animate={{ x: 0 }}
                onDragEnd={(event, info) => {
                  const threshold = 55;
                  if (info.offset.x > threshold) {
                    onReply(message);
                  }
                }}
                dragTransition={{
                  bounceStiffness: 800,
                  bounceDamping: 40,
                }}
                className={`
                  ${isMediaOnly ? "p-0 overflow-hidden border-0" : "p-3 md:p-4 border border-neutral-200"} rounded-2xl shadow-sm text-sm font-normal relative leading-relaxed min-w-[80px] cursor-grab active:cursor-grabbing select-none z-10
                  bg-white text-neutral-900 rounded-bl-none transition-[box-shadow,border-color,background-color] duration-300
                  ${isHighlighted ? "ring-4 ring-yellow-400 ring-offset-2 scale-[1.02]" : ""}
                `}
              >
                {message.replyTo && (
                  <div
                    onClick={() =>
                      message.replyTo &&
                      onScrollToMessage(message.replyTo.messageId)
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

                {isVideo && (
                  <ChatMessageVideo
                    message={message}
                    conversationId={selectedChatId}
                    flush={isVideoOnly}
                    overlayTimestamp={
                      isVideoOnly
                        ? formatTime12h(message.timestamp)
                        : undefined
                    }
                    className={isVideoOnly ? "rounded-bl-none" : ""}
                    onOpen={() => onOpenImage(message.id)}
                    onDownload={() => onDownloadMessage(message)}
                  />
                )}

                {message.imageUrl && !isVideo && (
                  <ChatMessageImage
                    message={message}
                    conversationId={selectedChatId}
                    flush={isImageOnly}
                    overlayTimestamp={
                      isImageOnly
                        ? formatTime12h(message.timestamp)
                        : undefined
                    }
                    className={isImageOnly ? "rounded-bl-none" : ""}
                    onOpen={() => onOpenImage(message.id)}
                    onDownload={() => onDownloadMessage(message)}
                  />
                )}

                {message.attachment && !message.imageUrl && !isVideo && (
                  <div className="mb-2 p-3 rounded-lg flex items-center gap-3 border bg-neutral-100 border-neutral-300 text-neutral-800">
                    <FileText className="w-7 h-7 shrink-0 text-primary-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {message.attachment.name}
                      </p>
                      <p className="text-[9px] mt-0.5 text-neutral-500">
                        {message.attachment.size || "Unknown size"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDownloadMessage(message)}
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
                      highlight={isSearchingMessages ? messageSearchQuery : ""}
                    />
                  </p>
                ) : null}

                {!isMediaOnly && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                    <span>{formatTime12h(message.timestamp)}</span>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
              <button
                type="button"
                onClick={() => onReply(message)}
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
        <React.Fragment key={message.stableKey ?? message.id}>
          {separatorElement}
          {messageElement}
        </React.Fragment>
      );
    });
  }, [
    activeChat.isGroup,
    activeChat.messages,
    currentMatchIndex,
    endDateFilter,
    highlightedMessageId,
    isMobile,
    isSearchingMessages,
    matchingMessageIds,
    messageSearchQuery,
    onDownloadMessage,
    onOpenImage,
    onReply,
    onScrollToMessage,
    selectedChatId,
    showDateFilter,
    startDateFilter,
  ]);

  return (
    <div className="flex-1 min-h-0 relative flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 z-0 bg-neutral-100"
        style={{
          backgroundImage: "url('/illustrations/chats/active_chat_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.1,
        }}
      />
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar relative z-10 bg-transparent"
      >
        <BoneyardSkeleton
          loading={messagesLoading}
          name="chat-message-timeline"
          fallback={<ChatTimelineFallback />}
        >
          {renderedMessages ?? (
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
  );
});

export default ChatTimeline;
