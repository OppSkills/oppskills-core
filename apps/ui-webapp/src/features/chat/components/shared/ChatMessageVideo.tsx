"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Play } from "lucide-react";
import type { Message } from "@/features/chat/domain/types";
import { useVideoCache } from "@/features/chat/hooks/useVideoCache";
import {
  formatVideoDuration,
  isVideoMessage,
} from "@/features/chat/lib/galleryMedia";
import { fetchVideoThumbnailBlobUrl } from "@/features/chat/lib/videoCache/fetchThumbnail";
import { AttachmentUploadOverlay } from "./AttachmentUploadOverlay";
import { CircularUploadProgress } from "./CircularUploadProgress";

type ChatMessageVideoProps = {
  message: Message;
  conversationId?: string | null;
  onOpen: () => void;
  onDownload: () => void;
  onCancelUpload?: () => void;
  onRetryUpload?: () => void;
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

export function VideoMessage(props: ChatMessageVideoProps) {
  return <ChatMessageVideoInner {...props} />;
}

/** @deprecated Use VideoMessage */
export const ChatMessageVideo = VideoMessage;

function ChatMessageVideoInner({
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
}: ChatMessageVideoProps) {
  const { getToken } = useAuth();
  const targetUrl = resolveVideoSource(message);
  const localPoster = resolvePosterSource(message);
  const retainedPosterRef = useRef<string | undefined>(localPoster);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    localPoster,
  );

  if (localPoster) {
    retainedPosterRef.current = localPoster;
  }

  const isOptimistic = message.id.startsWith("optimistic-");
  const canCache =
    Boolean(conversationId) &&
    Boolean(message.id) &&
    !isOptimistic &&
    isVideoMessage(message);

  const shouldPrefetchCache = canCache && !message.isYou;

  const { status, progress } = useVideoCache({
    conversationId,
    messageId: message.id,
    enabled: canCache,
    prefetch: shouldPrefetchCache,
  });

  useEffect(() => {
    if (localPoster) {
      setThumbnailUrl(localPoster);
      return;
    }

    if (
      !canCache ||
      !conversationId ||
      !message.attachment?.thumbnailUrl
    ) {
      return;
    }

    let cancelled = false;
    let blobUrl: string | null = null;

    void (async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      blobUrl = await fetchVideoThumbnailBlobUrl(
        token,
        conversationId,
        message.id,
      );
      if (!cancelled && blobUrl) {
        retainedPosterRef.current = blobUrl;
        setThumbnailUrl(blobUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canCache,
    conversationId,
    getToken,
    localPoster,
    message.attachment?.thumbnailUrl,
    message.id,
  ]);

  if (!targetUrl) return null;

  const showUploadProgress =
    message.isYou &&
    message.sendState === "pending" &&
    message.uploadProgress !== undefined;
  const showCancelled = message.isYou && message.sendState === "cancelled";
  const showFailed = message.isYou && message.sendState === "failed";

  const showCacheProgress =
    !showUploadProgress &&
    status === "downloading" &&
    progress > 0 &&
    progress < 100;

  const durationLabel = formatVideoDuration(
    message.attachment?.durationSeconds ?? undefined,
  );

  const poster = thumbnailUrl ?? retainedPosterRef.current;

  const containerClass = flush
    ? "relative rounded-2xl overflow-hidden shadow-sm group/media"
    : "relative mb-2.5 -mx-3 -mt-3 md:-mx-4 md:-mt-4 rounded-t-xl overflow-hidden shadow-sm group/media";

  return (
    <div className={`${containerClass} ${className}`}>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full relative cursor-pointer leading-none"
      >
        {poster ? (
          <img
            src={poster}
            alt=""
            className="block w-full min-w-[220px] max-h-64 object-cover bg-black pointer-events-none"
          />
        ) : (
          <div className="block w-full min-w-[220px] h-40 bg-neutral-800 animate-pulse" />
        )}
        {!showUploadProgress && !showCacheProgress && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        {showCacheProgress && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center pointer-events-none">
            <CircularUploadProgress percent={progress} size={52} />
          </div>
        )}
        {status === "cached" && !showUploadProgress && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm pointer-events-none" />
        )}
        {durationLabel && (
          <div className="absolute bottom-2 right-2 text-[9px] font-semibold bg-black/55 text-white px-1.5 py-0.5 rounded pointer-events-none">
            {durationLabel}
          </div>
        )}
      </button>
      {showUploadProgress && (
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
