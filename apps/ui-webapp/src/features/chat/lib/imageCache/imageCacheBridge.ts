const imageObjectUrls = new Map<string, string>();

export function peekImageObjectUrl(messageId: string): string | undefined {
  return imageObjectUrls.get(messageId);
}

/** Register an existing blob URL (e.g. already shown in the thread). */
export function storeImageObjectUrl(
  messageId: string,
  objectUrl: string,
): void {
  if (!objectUrl.startsWith("blob:")) return;
  const existing = imageObjectUrls.get(messageId);
  if (existing === objectUrl) return;
  if (existing) URL.revokeObjectURL(existing);
  imageObjectUrls.set(messageId, objectUrl);
}

export async function seedImageCache(
  messageId: string,
  blobUrl: string,
): Promise<string> {
  const existing = imageObjectUrls.get(messageId);
  if (existing) return existing;

  const res = await fetch(blobUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  imageObjectUrls.set(messageId, url);
  return url;
}

export function revokeImageObjectUrl(messageId: string): void {
  const url = imageObjectUrls.get(messageId);
  if (url) {
    URL.revokeObjectURL(url);
    imageObjectUrls.delete(messageId);
  }
}
