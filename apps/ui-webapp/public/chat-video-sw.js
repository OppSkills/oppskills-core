const DB_NAME = "chat-video-cache";
const DB_VERSION = 1;
const MAX_BYTES = 500 * 1024 * 1024;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos", { keyPath: "messageId" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function putVideo(messageId, blob, conversationId, mimeType) {
  const db = await openDb();
  const tx = db.transaction(["videos", "meta"], "readwrite");
  const videos = tx.objectStore("videos");
  const metaStore = tx.objectStore("meta");

  const lru = (await idbGet(metaStore, "lru")) || {
    id: "lru",
    totalBytes: 0,
    order: [],
  };

  const existing = await idbGet(videos, messageId);
  if (existing) {
    lru.totalBytes -= existing.size;
    lru.order = lru.order.filter((id) => id !== messageId);
  }

  let totalBytes = lru.totalBytes + blob.size;
  const order = lru.order.filter((id) => id !== messageId);
  order.push(messageId);

  while (totalBytes > MAX_BYTES && order.length > 0) {
    const evictId = order.shift();
    const evicted = await idbGet(videos, evictId);
    if (evicted) {
      totalBytes -= evicted.size;
      videos.delete(evictId);
    }
  }

  videos.put({
    messageId,
    blob,
    mimeType,
    size: blob.size,
    cachedAt: Date.now(),
    conversationId,
  });
  metaStore.put({ id: "lru", totalBytes, order });
  await txDone(tx);
}

function idbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function prefetchVideo({ messageId, conversationId, token, apiRoot }) {
  const url = `${apiRoot}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachment?disposition=inline`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Prefetch failed (${res.status})`);
  }

  const contentLength = Number(res.headers.get("content-length") || 0);
  const reader = res.body?.getReader();
  if (!reader) {
    const blob = await res.blob();
    await putVideo(
      messageId,
      blob,
      conversationId,
      blob.type || "video/mp4",
    );
    return blob.size;
  }

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (contentLength > 0) {
      const percent = Math.min(99, Math.round((received / contentLength) * 100));
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "VIDEO_CACHE_PROGRESS",
            messageId,
            percent,
          });
        });
      });
    }
  }

  const blob = new Blob(chunks, {
    type: res.headers.get("content-type")?.split(";")[0] || "video/mp4",
  });
  await putVideo(messageId, blob, conversationId, blob.type);
  return blob.size;
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "PREFETCH_VIDEO") return;

  prefetchVideo(data)
    .then((size) => {
      event.source?.postMessage({
        type: "VIDEO_CACHED",
        messageId: data.messageId,
        size,
      });
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "VIDEO_CACHED",
            messageId: data.messageId,
            size,
          });
        });
      });
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Prefetch failed";
      event.source?.postMessage({
        type: "VIDEO_CACHE_FAILED",
        messageId: data.messageId,
        error: message,
      });
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "VIDEO_CACHE_FAILED",
            messageId: data.messageId,
            error: message,
          });
        });
      });
    });
});
