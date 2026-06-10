import { buildAuthHeaders, getApiRootUrl } from "@/lib/api/apiClient";
import { VideoCacheManager } from "./VideoCacheManager";

const objectUrlCache = new Map<string, string>();

export function peekVideoObjectUrl(messageId: string): string | undefined {
  return objectUrlCache.get(messageId);
}

export async function getVideoObjectUrl(messageId: string): Promise<string | null> {
  const existing = objectUrlCache.get(messageId);
  if (existing) return existing;

  const blob = await VideoCacheManager.get(messageId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(messageId, url);
  return url;
}

export function revokeVideoObjectUrl(messageId: string): void {
  const url = objectUrlCache.get(messageId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(messageId);
  }
}

export async function downloadVideoToCache(
  token: string,
  conversationId: string,
  messageId: string,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const root = getApiRootUrl();
  const url = `${root}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachment?disposition=inline`;

  const res = await fetch(url, { headers: buildAuthHeaders(token) });
  if (!res.ok) {
    throw new Error(`Video download failed (${res.status})`);
  }

  const contentLength = Number(res.headers.get("content-length") || 0);
  const reader = res.body?.getReader();

  if (!reader) {
    const blob = await res.blob();
    await VideoCacheManager.put(messageId, blob, { conversationId });
    onProgress?.(100);
    return blob;
  }

  const chunks: BlobPart[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (contentLength > 0) {
      onProgress?.(Math.min(99, Math.round((received / contentLength) * 100)));
    }
  }

  const mimeType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "video/mp4";
  const blob = new Blob(chunks, { type: mimeType });
  await VideoCacheManager.put(messageId, blob, { conversationId, mimeType });
  onProgress?.(100);
  return blob;
}
