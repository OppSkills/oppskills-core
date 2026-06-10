import { fetchChatMessageAttachmentBlob } from "./downloadAttachment";

type CacheEntry = { url: string; refs: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();
const pendingRelease = new Set<string>();

function cacheKey(conversationId: string, messageId: string): string {
  return `${conversationId}:${messageId}`;
}

export function peekChatAttachmentBlobUrl(
  conversationId: string,
  messageId: string,
): string | undefined {
  return cache.get(cacheKey(conversationId, messageId))?.url;
}

export async function acquireChatAttachmentBlobUrl(
  token: string,
  conversationId: string,
  messageId: string,
): Promise<string> {
  const key = cacheKey(conversationId, messageId);
  const existing = cache.get(key);
  if (existing) {
    existing.refs += 1;
    return existing.url;
  }

  if (!inflight.has(key)) {
    inflight.set(
      key,
      fetchChatMessageAttachmentBlob(token, conversationId, messageId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          inflight.delete(key);

          if (pendingRelease.has(key)) {
            pendingRelease.delete(key);
            URL.revokeObjectURL(url);
            throw new Error("Attachment load aborted");
          }

          cache.set(key, { url, refs: 0 });
          return url;
        })
        .catch((error) => {
          inflight.delete(key);
          pendingRelease.delete(key);
          throw error;
        }),
    );
  }

  const url = await inflight.get(key)!;

  if (pendingRelease.has(key)) {
    pendingRelease.delete(key);
    throw new Error("Attachment load aborted");
  }

  const entry = cache.get(key);
  if (entry) {
    entry.refs += 1;
    return entry.url;
  }

  return url;
}

export function releaseChatAttachmentBlobUrl(
  conversationId: string,
  messageId: string,
): void {
  const key = cacheKey(conversationId, messageId);
  const entry = cache.get(key);
  if (!entry) {
    pendingRelease.add(key);
    return;
  }

  entry.refs -= 1;
  if (entry.refs <= 0) {
    URL.revokeObjectURL(entry.url);
    cache.delete(key);
  }
}
