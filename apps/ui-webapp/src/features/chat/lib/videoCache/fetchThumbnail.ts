import { buildAuthHeaders, getApiRootUrl } from "@/lib/api/apiClient";

const thumbnailUrlCache = new Map<string, string>();

export async function fetchVideoThumbnailBlobUrl(
  token: string,
  conversationId: string,
  messageId: string,
): Promise<string | null> {
  const key = `${conversationId}:${messageId}`;
  const cached = thumbnailUrlCache.get(key);
  if (cached) return cached;

  const root = getApiRootUrl();
  const url = `${root}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/thumbnail`;

  const res = await fetch(url, { headers: buildAuthHeaders(token) });
  if (!res.ok) return null;

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  thumbnailUrlCache.set(key, blobUrl);
  return blobUrl;
}

export function revokeVideoThumbnailBlobUrl(
  conversationId: string,
  messageId: string,
): void {
  const key = `${conversationId}:${messageId}`;
  const url = thumbnailUrlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    thumbnailUrlCache.delete(key);
  }
}
