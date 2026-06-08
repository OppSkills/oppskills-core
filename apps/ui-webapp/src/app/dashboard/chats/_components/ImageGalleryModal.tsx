"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { SecureChatAttachmentImage } from "@/components/chat/SecureChatAttachmentImage";

interface GalleryItem {
  messageId: string;
  fileName: string;
}

interface ImageGalleryModalProps {
  activeIndex: number;
  conversationId: string;
  items: GalleryItem[];
  onClose: () => void;
  onDownload: (item: GalleryItem) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ImageGalleryModal = React.memo(function ImageGalleryModal({
  activeIndex,
  conversationId,
  items,
  onClose,
  onDownload,
  onNext,
  onPrev,
}: ImageGalleryModalProps) {
  const activeItem = items[activeIndex];
  if (!activeItem) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center select-none z-50">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => onDownload(activeItem)}
        className="absolute top-6 right-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </button>

      <button
        onClick={onPrev}
        className="absolute left-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
        title="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="max-w-[85vw] max-h-[80vh] flex flex-col items-center justify-center"
      >
        <SecureChatAttachmentImage
          conversationId={conversationId}
          messageId={activeItem.messageId}
          alt="Modal gallery image"
          className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
        />
        <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-wide border border-white/10">
          {activeIndex + 1} / {items.length}
        </div>
      </motion.div>

      <button
        onClick={onNext}
        className="absolute right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
        title="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
});

export type { GalleryItem };
export default ImageGalleryModal;
