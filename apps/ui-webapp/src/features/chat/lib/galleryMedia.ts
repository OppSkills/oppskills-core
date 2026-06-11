import type { Message } from "@/features/chat/domain/types";
import type {
  GalleryItem,
  GalleryMediaKind,
} from "@/features/chat/components/details/ImageGalleryModal";

const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v|mkv|avi)(\?|$)/i;

export function isVideoMessage(message: Message): boolean {
  return message.attachment?.type === "video" || message.type === "VIDEO";
}

export function resolveGalleryItemKind(
  item: GalleryItem,
  message?: Message,
): GalleryMediaKind {
  if (item.kind === "video" || item.kind === "image") return item.kind;
  if (message && isVideoMessage(message)) return "video";
  if (VIDEO_FILE_PATTERN.test(item.fileName)) return "video";
  return "image";
}

export function videoMessageCaption(message: Message): string {
  const text = message.text.trim();
  if (!text) return "";
  if (
    isVideoMessage(message) &&
    message.attachment?.name &&
    text === message.attachment.name
  ) {
    return "";
  }
  return text;
}

export function isVideoOnlyMessage(message: Message): boolean {
  return isVideoMessage(message) && !videoMessageCaption(message);
}

export function formatVideoDuration(seconds?: number | null): string {
  if (!seconds || seconds < 1) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
