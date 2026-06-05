"use client";

import { Camera, FileText, Headphones, Image as ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ChatAttachmentMenuProps = {
  open: boolean;
  onClose: () => void;
  onPickDocument: () => void;
  onPickPhotosVideos: () => void;
  onPickAudio: () => void;
  onPickCamera: () => void;
};

const items = [
  {
    key: "document",
    label: "Document",
    icon: FileText,
    color: "text-primary-600",
    bg: "bg-primary-100",
    hover: "hover:bg-primary-50",
  },
  {
    key: "media",
    label: "Photos & videos",
    icon: ImageIcon,
    color: "text-blue-600",
    bg: "bg-blue-100",
    hover: "hover:bg-blue-50",
  },
  {
    key: "audio",
    label: "Audio",
    icon: Headphones,
    color: "text-orange-600",
    bg: "bg-orange-100",
    hover: "hover:bg-orange-50",
  },
  {
    key: "camera",
    label: "Camera",
    icon: Camera,
    color: "text-pink-600",
    bg: "bg-pink-100",
    hover: "hover:bg-pink-50",
  },
] as const;

export function ChatAttachmentMenu({
  open,
  onClose,
  onPickDocument,
  onPickPhotosVideos,
  onPickAudio,
  onPickCamera,
}: ChatAttachmentMenuProps) {
  const handlers: Record<(typeof items)[number]["key"], () => void> = {
    document: onPickDocument,
    media: onPickPhotosVideos,
    audio: onPickAudio,
    camera: onPickCamera,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-2xl bg-white border border-neutral-200 shadow-xl py-1.5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlers[item.key]();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${item.hover}`}
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </span>
                  <span className="text-sm font-medium text-neutral-800">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
