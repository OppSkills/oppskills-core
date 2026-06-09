export type PendingAttachmentKind = "image" | "video" | "audio" | "document";

export type PendingAttachment = {
  id: string;
  file: File;
  kind: PendingAttachmentKind;
  previewUrl?: string;
  /** JPEG blob URL thumbnail for video attachments */
  posterUrl?: string;
};

export function fileKindFromMime(
  mime: string,
  fileName: string,
): PendingAttachmentKind {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif"].includes(ext)
  ) {
    return "image";
  }
  if (["mp4", "webm", "mov", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  return "document";
}

export function createPendingAttachment(file: File): PendingAttachment {
  const kind = fileKindFromMime(file.type, file.name);
  const previewUrl =
    kind === "image" || kind === "video"
      ? URL.createObjectURL(file)
      : undefined;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    kind,
    previewUrl,
  };
}

export function revokePendingPreview(item: PendingAttachment): void {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  if (item.posterUrl) {
    URL.revokeObjectURL(item.posterUrl);
  }
}
