"use client";

import { Crop, FileText, Headphones, Plus, Send, X } from "lucide-react";
import type { PendingAttachment } from "@/lib/chat/attachmentTypes";
import { ChatEmojiPicker } from "./ChatEmojiPicker";
import { ChatInlineImageCrop } from "./ChatInlineImageCrop";

type ChatAttachmentComposerProps = {
  open: boolean;
  items: PendingAttachment[];
  activeIndex: number;
  caption: string;
  cropMode: boolean;
  onCaptionChange: (value: string) => void;
  onActiveIndexChange: (index: number) => void;
  onCropModeChange: (value: boolean) => void;
  onCroppedFile: (file: File) => void;
  onAddMore: () => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onSend: () => void;
};

function DocumentPreview({ item }: { item: PendingAttachment }) {
  const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);
  const ext = item.file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-32 h-40 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
        <FileText className="w-16 h-16 text-neutral-400" />
      </div>
      <div className="text-center">
        <p className="text-neutral-800 font-semibold text-sm truncate max-w-[280px]">
          {item.file.name}
        </p>
        <p className="text-neutral-500 text-xs mt-1">
          {sizeMb} MB · {ext}
        </p>
      </div>
    </div>
  );
}

export function ChatAttachmentComposer({
  open,
  items,
  activeIndex,
  caption,
  cropMode,
  onCaptionChange,
  onActiveIndexChange,
  onCropModeChange,
  onCroppedFile,
  onAddMore,
  onRemove,
  onClose,
  onSend,
}: ChatAttachmentComposerProps) {
  const active = items[activeIndex];
  const canCrop = active?.kind === "image" && Boolean(active.previewUrl);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-neutral-200 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>
        {canCrop && !cropMode && (
          <button
            type="button"
            onClick={() => onCropModeChange(true)}
            className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100"
            title="Crop"
          >
            <Crop className="w-5 h-5" />
          </button>
        )}
        {!canCrop && <div className="w-9" />}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-neutral-50">
        {cropMode && active?.previewUrl ? (
          <ChatInlineImageCrop
            imageSrc={active.previewUrl}
            fileName={active.file.name}
            onApply={(file) => {
              onCroppedFile(file);
              onCropModeChange(false);
            }}
            onCancel={() => onCropModeChange(false)}
          />
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden px-4">
            {!active ? (
              <p className="text-neutral-500 text-sm">No files selected</p>
            ) : active.kind === "image" && active.previewUrl ? (
              <img
                src={active.previewUrl}
                alt={active.file.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : active.kind === "video" && active.previewUrl ? (
              <video
                src={active.previewUrl}
                controls
                className="max-h-full max-w-full rounded-lg"
              />
            ) : active.kind === "audio" ? (
              <div className="flex flex-col items-center gap-4">
                <Headphones className="w-20 h-20 text-primary-500" />
                <p className="text-neutral-700 text-sm">{active.file.name}</p>
                {active.previewUrl && (
                  <audio
                    src={active.previewUrl}
                    controls
                    className="w-full max-w-xs"
                  />
                )}
              </div>
            ) : (
              <DocumentPreview item={active} />
            )}
          </div>
        )}
      </div>

      {!cropMode && (
        <div className="shrink-0 px-4 pb-6 pt-2 space-y-3 border-t border-neutral-200 bg-white">
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded-full px-4 py-2.5">
            <input
              type="text"
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-500"
            />
            <ChatEmojiPicker
              onEmojiSelect={(emoji) => onCaptionChange(caption + emoji)}
              className="p-1 text-neutral-500 hover:text-primary-600"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar pb-1">
            {items.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <div key={item.id} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => onActiveIndexChange(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                      isActive ? "border-primary-500" : "border-neutral-200"
                    }`}
                  >
                    {item.kind === "image" && item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        {item.kind === "audio" ? (
                          <Headphones className="w-5 h-5 text-orange-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-600 text-white text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={onAddMore}
              className="w-14 h-14 rounded-lg border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:border-primary-500 hover:text-primary-600 shrink-0"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSend}
              disabled={items.length === 0}
              className="p-4 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
