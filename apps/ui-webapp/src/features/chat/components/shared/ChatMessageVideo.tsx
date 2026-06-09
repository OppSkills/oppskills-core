"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Play } from "lucide-react";
import { fetchChatMessageAttachmentBlob } from "@/features/chat/lib/downloadAttachment";
import type { Message } from "@/features/chat/domain/types";
import { CircularUploadProgress } from "./CircularUploadProgress";

type ChatMessageVideoProps = {
  message: Message;
  conversationId?: string | null;
  onOpen: () => void;
  onDownload: () => void;
  className?: string;
  overlayTimestamp?: string;
  overlayFooter?: ReactNode;
  flush?: boolean;
};

function resolveVideoSource(message: Message): string | undefined {
  return message.attachment?.url ?? message.imageUrl;
}

function resolvePosterSource(message: Message): string | undefined {
  const videoUrl = resolveVideoSource(message);
  if (message.imageUrl && message.imageUrl !== videoUrl) {
    return message.imageUrl;
  }
  return undefined;
}

export function ChatMessageVideo({
  message,
  conversationId,
  onOpen,
  onDownload,
  className = "",
  overlayTimestamp,
  overlayFooter,
  flush = false,
}: ChatMessageVideoProps) {
  const { getToken } = useAuth();
  const targetUrl = resolveVideoSource(message);
  const posterUrl = resolvePosterSource(message);
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(targetUrl);
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
      <button
        type="button"
        onClick={onOpen}
        className="block w-full relative cursor-pointer"
      >
        <video
          src={displayUrl}
          poster={posterUrl}
          muted
          playsInline
          preload="metadata"
          className="w-full max-h-64 object-cover bg-black pointer-events-none"
        />
        {!showProgress && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </button>
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
