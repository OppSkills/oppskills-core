"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Repeat2 } from "lucide-react";
import CustomModal from "./CustomModal";
import { Button } from "@/components/ui/button";
import { COMMUNITY_POST_CONTENT_MAX_LENGTH } from "@oppskills/types/constants";
import { toast } from "sonner";

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectRepost: () => Promise<void>;
  onQuoteRepost: (caption: string) => Promise<void>;
  isReposted?: boolean;
  onUndoRepost?: () => Promise<void>;
}

export default function RepostModal({
  isOpen,
  onClose,
  onDirectRepost,
  onQuoteRepost,
  isReposted,
  onUndoRepost,
}: RepostModalProps) {
  const [mode, setMode] = useState<"choose" | "quote">("choose");
  const [caption, setCaption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    if (isProcessing) return;
    setMode("choose");
    setCaption("");
    onClose();
  };

  const handleDirect = async () => {
    setIsProcessing(true);
    try {
      await onDirectRepost();
      handleClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuote = async () => {
    if (!caption.trim()) return;
    if (caption.length > COMMUNITY_POST_CONTENT_MAX_LENGTH) {
      toast.error(
        `Caption cannot exceed ${COMMUNITY_POST_CONTENT_MAX_LENGTH} characters.`,
      );
      return;
    }
    setIsProcessing(true);
    try {
      await onQuoteRepost(caption);
      handleClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async () => {
    if (!onUndoRepost) return;
    setIsProcessing(true);
    try {
      await onUndoRepost();
      handleClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const footer =
    mode === "quote" ? (
      <div className="flex gap-3 justify-end w-full">
        <Button
          variant="outline"
          onClick={() => setMode("choose")}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={handleQuote}
          disabled={isProcessing || !caption.trim()}
          className="bg-[#2E1E66] hover:bg-[#1E1146] text-white rounded-full"
        >
          {isProcessing ? "Reposting..." : "Repost with caption"}
        </Button>
      </div>
    ) : null;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Repost"
      footer={footer}
      className="max-w-lg"
    >
      {mode === "choose" ? (
        <div className="flex flex-col gap-4">
          {isReposted && onUndoRepost && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isProcessing}
              className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl py-4 px-5 text-left font-bold transition-colors"
            >
              Undo repost
            </button>
          )}
          <button
            type="button"
            onClick={handleDirect}
            disabled={isProcessing || isReposted}
            className="w-full border border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/10 rounded-2xl py-4 px-5 text-left flex items-center gap-3 transition-colors disabled:opacity-50"
          >
            <Repeat2 className="w-5 h-5 text-[#5D3EBB]" />
            <div>
              <p className="font-bold text-neutral-800">Repost</p>
              <p className="text-sm text-neutral-500 font-medium">
                Instantly share to your feed
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("quote")}
            disabled={isProcessing}
            className="w-full border border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/10 rounded-2xl py-4 px-5 text-left flex items-center gap-3 transition-colors"
          >
            <Repeat2 className="w-5 h-5 text-[#5D3EBB]" />
            <div>
              <p className="font-bold text-neutral-800">Repost with caption</p>
              <p className="text-sm text-neutral-500 font-medium">
                Add your thoughts before sharing
              </p>
            </div>
          </button>
        </div>
      ) : (
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          maxLength={COMMUNITY_POST_CONTENT_MAX_LENGTH}
          rows={6}
          className="w-full min-h-[160px] bg-white border border-neutral-200 focus:border-[#5D3EBB]/60 focus:ring-1 focus:ring-[#5D3EBB]/60 text-sm p-4 rounded-2xl outline-none resize-none transition-all placeholder:text-neutral-400 font-semibold text-neutral-700 leading-relaxed"
        />
      )}
    </CustomModal>
  );
}
