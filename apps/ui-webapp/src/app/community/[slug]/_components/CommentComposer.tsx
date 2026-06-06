"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentComposerProps {
  placeholder?: string;
  onSubmit: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export default function CommentComposer({
  placeholder = "Write a comment...",
  onSubmit,
  disabled,
}: CommentComposerProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 w-full">
      <div className="relative flex-1 flex items-center bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200/80 focus-within:border-[#5D3EBB]/60 focus-within:bg-white rounded-2xl px-4 py-3 transition-all duration-300">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={2}
          className="w-full bg-transparent outline-none text-sm text-neutral-700 font-semibold placeholder-neutral-400 resize-none"
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || isSubmitting || !text.trim()}
        className="rounded-full bg-[#2E1E66] hover:bg-[#1E1146] text-white shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
