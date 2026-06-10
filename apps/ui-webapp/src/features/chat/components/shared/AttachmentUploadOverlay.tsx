"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { CircularUploadProgress } from "./CircularUploadProgress";

type AttachmentUploadOverlayProps = {
  percent: number;
  onCancel?: () => void;
  onRetry?: () => void;
  variant?: "uploading" | "cancelled" | "failed";
};

export function AttachmentUploadOverlay({
  percent,
  onCancel,
  onRetry,
  variant = "uploading",
}: AttachmentUploadOverlayProps) {
  const [hovered, setHovered] = useState(false);

  if (variant === "cancelled" || variant === "failed") {
    return (
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
        <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wide">
          {variant === "cancelled" ? "Cancelled" : "Failed"}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-black/45 flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && onCancel ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="w-12 h-12 rounded-full bg-black/60 hover:bg-red-600/80 flex items-center justify-center text-white transition-colors"
          title="Cancel upload"
          aria-label="Cancel upload"
        >
          <X className="w-6 h-6" />
        </button>
      ) : (
        <CircularUploadProgress percent={percent} size={52} />
      )}
    </div>
  );
}
