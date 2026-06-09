"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { fetchChatMessageAttachmentBlob } from "@/features/chat/lib/downloadAttachment";
import type { Message } from "@/features/chat/domain/types";
import { CircularUploadProgress } from "./CircularUploadProgress";

type ChatMessageImageProps = {
  message: Message;
  conversationId?: string | null;
  onOpen: () => void;
  onDownload: () => void;
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
  className = "",
  overlayTimestamp,
  overlayFooter,
  flush = false,
}: ChatMessageImageProps) {
  const { getToken } = useAuth();
  const targetUrl = message.imageUrl;
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(targetUrl);
  /** Blob URLs created by this component (secure fetch). Never revoke message-owned blobs. */
  const ownedBlobRef = useRef<string | null>(null);

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
      setDisplayUrl(targetUrl);
      return;
    }

    if (!useSecureAccess || !conversationId) {
      setDisplayUrl(targetUrl);
      return;
    }

    let localBlobUrl: string | null = null;
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
        localBlobUrl = URL.createObjectURL(blob);
        ownedBlobRef.current = localBlobUrl;
        setDisplayUrl(localBlobUrl);
      } catch {
        if (!cancelled) setDisplayUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
        if (ownedBlobRef.current === localBlobUrl) ownedBlobRef.current = null;
      }
    };
  }, [targetUrl, useSecureAccess, conversationId, message.id, getToken]);

  useEffect(() => {
    return () => {
      if (ownedBlobRef.current) {
        URL.revokeObjectURL(ownedBlobRef.current);
        ownedBlobRef.current = null;
      }
    };
  }, []);

  if (!displayUrl) return null;

  const showProgress =
    message.isYou &&
    message.sendState === "pending" &&
    message.uploadProgress !== undefined;

  const containerClass = flush
    ? "relative rounded-2xl overflow-hidden shadow-sm group/media"
    : "relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm group/media";

  return (
    <div className={`${containerClass} ${className}`}>
      <img
        src={displayUrl}
        alt="Attached image"
        onClick={onOpen}
        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
      />
      {showProgress && (
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center pointer-events-none">
          <CircularUploadProgress percent={message.uploadProgress!} size={52} />
        </div>
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
