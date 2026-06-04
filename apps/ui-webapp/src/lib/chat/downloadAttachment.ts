import { buildAuthHeaders } from "@/lib/api/apiClient";
import { getApiRootUrl } from "@/lib/api/apiClient";

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const safeName = fileName.trim() || "download";
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", safeName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

/**
 * Downloads a chat attachment via the authenticated API (streams from S3 server-side).
 * Does not open the public CDN URL in the browser.
 */
export async function downloadChatMessageAttachment(
  token: string,
  conversationId: string,
  messageId: string,
  fileName: string,
): Promise<void> {
  const root = getApiRootUrl();
  const url = `${root}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachment?disposition=attachment`;

  const res = await fetch(url, {
    headers: buildAuthHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text.trim() || `Download failed (${res.status})`,
    );
  }

  const blob = await res.blob();
  triggerBlobDownload(blob, fileName);
}

/**
 * Fetches attachment bytes for inline display (e.g. img src via blob URL).
 */
export async function fetchChatMessageAttachmentBlob(
  token: string,
  conversationId: string,
  messageId: string,
): Promise<Blob> {
  const root = getApiRootUrl();
  const url = `${root}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachment?disposition=inline`;

  const res = await fetch(url, {
    headers: buildAuthHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Failed to load attachment (${res.status})`);
  }

  return res.blob();
}

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
