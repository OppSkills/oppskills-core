"use client";

import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

type ChatEmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ChatEmojiPicker({
  onEmojiSelect,
  disabled,
  className,
}: ChatEmojiPickerProps) {
  const handleClick = (data: EmojiClickData) => {
    onEmojiSelect(data.emoji);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={
            className ??
            "p-1 text-neutral-500 hover:text-primary-600 transition-colors shrink-0"
          }
          aria-label="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-auto p-0 border-none shadow-xl"
      >
        <EmojiPicker
          theme={Theme.LIGHT}
          width={320}
          height={380}
          searchPlaceHolder="Search emoji"
          previewConfig={{ showPreview: false }}
          onEmojiClick={handleClick}
        />
      </PopoverContent>
    </Popover>
  );
}
