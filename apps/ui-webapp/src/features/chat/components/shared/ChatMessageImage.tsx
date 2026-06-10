"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { fetchChatMessageAttachmentBlob } from "@/features/chat/lib/downloadAttachment";
import type { Message } from "@/features/chat/domain/types";
import {
  peekImageObjectUrl,
  storeImageObjectUrl,
} from "@/features/chat/lib/imageCache/imageCacheBridge";
import { AttachmentUploadOverlay } from "./AttachmentUploadOverlay";

type ChatMessageImageProps = {
  message: Message;
  conversationId?: string | null;
  onOpen: (displaySrc: string) => void;
  onDownload: () => void;
  onCancelUpload?: () => void;
  onRetryUpload?: () => void;
  className?: string;
  /** When set, time is overlaid on the image (image-only bubbles). */
  overlayTimestamp?: string;
  overlayFooter?: ReactNode;
  /** Full-bleed inside the bubble with no extra padding below the image. */
  flush?: boolean;
};

export function ChatMessageImage({
  message,
  conversationId,
  onOpen,
  onDownload,
  onCancelUpload,
  onRetryUpload,
  className = "",
  overlayTimestamp,
  overlayFooter,
  flush = false,
}: ChatMessageImageProps) {
  const { getToken } = useAuth();
  const targetUrl = message.imageUrl;
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(() => {
    if (!targetUrl) return undefined;
    if (targetUrl.startsWith("blob:")) {
      storeImageObjectUrl(message.id, targetUrl);
      return targetUrl;
    }
    const cached = peekImageObjectUrl(message.id);
    return cached ?? targetUrl;
  });

  const useSecureAccess =
    Boolean(conversationId) &&
    Boolean(message.id) &&
    !message.id.startsWith("optimistic-") &&
    Boolean(targetUrl) &&
    !targetUrl!.startsWith("blob:");

  useEffect(() => {
    if (!targetUrl) {
      setDisplayUrl(undefined);
      return;
    }

    if (targetUrl.startsWith("blob:")) {
      storeImageObjectUrl(message.id, targetUrl);
      setDisplayUrl(targetUrl);
      return;
    }

    const cached = peekImageObjectUrl(message.id);
    if (cached) {
      setDisplayUrl(cached);
      return;
    }

    if (!useSecureAccess || !conversationId) {
      setDisplayUrl(targetUrl);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const blob = await fetchChatMessageAttachmentBlob(
          token,
          conversationId,
          message.id,
        );
        if (cancelled) return;
        const localBlobUrl = URL.createObjectURL(blob);
        storeImageObjectUrl(message.id, localBlobUrl);
        setDisplayUrl(localBlobUrl);
      } catch {
        if (!cancelled) setDisplayUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUrl, useSecureAccess, conversationId, message.id, getToken]);

  if (!displayUrl) return null;

  const showUploading =
    message.isYou &&
    message.sendState === "pending" &&
    message.uploadProgress !== undefined;
  const showCancelled = message.isYou && message.sendState === "cancelled";
  const showFailed = message.isYou && message.sendState === "failed";

  const containerClass = flush
    ? "relative rounded-2xl overflow-hidden shadow-sm group/media"
    : "relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm group/media";

  return (
    <div className={`${containerClass} ${className}`}>
      <img
        src={displayUrl}
        alt="Attached image"
        onClick={() => onOpen(displayUrl)}
        className="block w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
      />
      {showUploading && (
        <AttachmentUploadOverlay
          percent={message.uploadProgress!}
          onCancel={onCancelUpload}
        />
      )}
      {(showCancelled || showFailed) && (
        <AttachmentUploadOverlay
          percent={0}
          variant={showCancelled ? "cancelled" : "failed"}
          onRetry={onRetryUpload}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover/media:opacity-100 hover:bg-black/70 transition-all"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </button>
      {message.imageBadgeText && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
          <span className="text-primary-600 font-bold text-xs">
            {message.imageBadgeText}
          </span>
        </div>
      )}
      {message.imageTopRightText && (
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full font-medium shadow-xs">
          {message.imageTopRightText}
        </div>
      )}
      {overlayTimestamp && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 pointer-events-none text-white">
          <span className="text-[9px] font-medium bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            {overlayTimestamp}
          </span>
          {overlayFooter}
        </div>
      )}
    </div>
  );
}
