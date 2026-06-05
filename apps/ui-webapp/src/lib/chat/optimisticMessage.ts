import type { PendingAttachment } from "./attachmentTypes";
import type { Message } from "./types";

export function optimisticMessageId(pendingId: string): string {
  return `optimistic-${pendingId}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Blob URLs used only for in-flight optimistic messages */
export function createOptimisticPreviewUrl(
  item: PendingAttachment,
): string | undefined {
  if (item.kind === "image" || item.kind === "video") {
    return URL.createObjectURL(item.file);
  }
  return undefined;
}

export function revokeOptimisticPreview(message: Message): void {
  if (message.imageUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(message.imageUrl);
  }
  if (message.attachment?.url?.startsWith("blob:")) {
    URL.revokeObjectURL(message.attachment.url);
  }
}

export function createOptimisticMessage(
  item: PendingAttachment,
  caption: string,
  currentUserId: string,
  previewUrl?: string,
): Message {
  const text = caption.trim();

  const base: Message = {
    id: optimisticMessageId(item.id),
    stableKey: item.id,
    senderId: currentUserId,
    senderName: "You",
    text,
    timestamp: new Date().toISOString(),
    isYou: true,
    sendState: "pending",
    uploadProgress: 0,
  };

  if (item.kind === "image" && previewUrl) {
    return { ...base, imageUrl: previewUrl };
  }

  if (item.kind === "video" && previewUrl) {
    return {
      ...base,
      imageUrl: previewUrl,
      attachment: {
        name: item.file.name,
        type: "video",
        url: previewUrl,
        size: formatSize(item.file.size),
      },
    };
  }

  return {
    ...base,
    text: text || item.file.name,
    attachment: {
      name: item.file.name,
      type: "document",
      url: previewUrl ?? "",
      size: formatSize(item.file.size),
    },
  };
}

/** Server/API body: caption only, never default to filename for images */
export function attachmentSendBody(
  item: PendingAttachment,
  caption: string,
  index: number,
  messageType: "IMAGE" | "VIDEO" | "DOCUMENT",
): string {
  if (index === 0 && caption.trim()) return caption.trim();
  if (messageType === "IMAGE") return "";
  return item.file.name;
}
