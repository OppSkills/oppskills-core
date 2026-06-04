"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { fetchChatMessageAttachmentBlob } from "@/lib/chat/downloadAttachment";
import type { Message } from "@/lib/chat/types";
import { CircularUploadProgress } from "./CircularUploadProgress";

type ChatMessageImageProps = {
  message: Message;
  conversationId?: string | null;
  onOpen: () => void;
  onDownload: () => void;
  className?: string;
};

export function ChatMessageImage({
  message,
  conversationId,
  onOpen,
  onDownload,
  className = "",
}: ChatMessageImageProps) {
  const { getToken } = useAuth();
  const targetUrl = message.imageUrl;
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(targetUrl);
  const blobRef = useRef<string | null>(null);

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
      blobRef.current = targetUrl;
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
        blobRef.current = localBlobUrl;
        setDisplayUrl(localBlobUrl);
      } catch {
        if (!cancelled) setDisplayUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
        if (blobRef.current === localBlobUrl) blobRef.current = null;
      }
    };
  }, [targetUrl, useSecureAccess, conversationId, message.id, getToken]);

  useEffect(() => {
    return () => {
      if (blobRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, []);

  if (!displayUrl) return null;

  const showProgress =
    message.isYou &&
    message.sendState === "pending" &&
    message.uploadProgress !== undefined;

  return (
    <div
      className={`relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm group/media ${className}`}
    >
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
    </div>
  );
}
