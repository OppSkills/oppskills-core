export function messageDownloadUrl(message: {
  imageUrl?: string;
  attachment?: { url?: string };
}): string | undefined {
  return message.attachment?.url ?? message.imageUrl;
}

export function messageDownloadName(message: {
  text: string;
  imageUrl?: string;
  attachment?: { name: string; url?: string };
  type?: string;
}): string {
  if (message.attachment?.name) return message.attachment.name;
  if (message.type === "IMAGE" || message.imageUrl) {
    const fromUrl = message.imageUrl?.split("/").pop();
    return fromUrl && fromUrl.includes(".") ? fromUrl : "image.jpg";
  }
  return message.text.trim() || "download";
}
