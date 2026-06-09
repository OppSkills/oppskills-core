"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, Send, X } from "lucide-react";
import { ChatAttachmentMenu } from "@/features/chat/components/shared/ChatAttachmentMenu";
import type { Message } from "@/features/chat/domain/types";

interface MessageComposerProps {
  attachmentAnchorRef: React.RefObject<HTMLDivElement | null>;
  inputMessage: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  replyingToMessage: Message | null;
  onAttachmentMenuToggle: () => void;
  onAudioPick: () => void;
  onCameraPick: () => void;
  onDocumentPick: () => void;
  onEmojiSelect: (emoji: string) => void;
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onMediaPick: () => void;
  onMenuClose: () => void;
  onReplyCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
  attachmentMenuOpen: boolean;
  EmojiPicker: React.ComponentType<{
    onEmojiSelect: (emoji: string) => void;
    disabled?: boolean;
    className?: string;
  }>;
}

const MessageComposer = React.memo(function MessageComposer({
  attachmentAnchorRef,
  attachmentMenuOpen,
  EmojiPicker,
  inputMessage,
  inputRef,
  replyingToMessage,
  onAttachmentMenuToggle,
  onAudioPick,
  onCameraPick,
  onDocumentPick,
  onEmojiSelect,
  onInputChange,
  onInputKeyDown,
  onMediaPick,
  onMenuClose,
  onReplyCancel,
  onSubmit,
}: MessageComposerProps) {
  return (
    <div
      className="border-t border-neutral-300 bg-white shrink-0 z-10 flex flex-col shadow-inner"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
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
              onClick={onReplyCancel}
              className="p-1 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={onSubmit}
        className="min-h-20 py-3 px-4 md:px-6 flex items-end gap-3 w-full"
      >
        <div className="relative shrink-0" ref={attachmentAnchorRef}>
          <button
            type="button"
            onClick={onAttachmentMenuToggle}
            className="p-2.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <ChatAttachmentMenu
            open={attachmentMenuOpen}
            onClose={onMenuClose}
            onPickDocument={onDocumentPick}
            onPickPhotosVideos={onMediaPick}
            onPickAudio={onAudioPick}
            onPickCamera={onCameraPick}
          />
        </div>

        <div className="flex-1 bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-2xl px-4 py-2 flex items-end transition-colors min-h-[44px]">
          <textarea
            ref={inputRef}
            rows={Math.min(4, Math.max(1, inputMessage.split("\n").length))}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Type a message..."
            className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-500 focus:ring-0 py-1 resize-none"
          />
          <EmojiPicker
            onEmojiSelect={onEmojiSelect}
            className="p-1 text-neutral-500 hover:text-primary-600 transition-colors shrink-0 ml-2 mb-0.5"
          />
        </div>

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
  );
});

export default MessageComposer;
