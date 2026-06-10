import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "chat-video-cache";
const DB_VERSION = 1;
const MAX_BYTES = 500 * 1024 * 1024;

export type VideoCacheEntry = {
  messageId: string;
  blob: Blob;
  mimeType: string;
  size: number;
  cachedAt: number;
  conversationId: string;
};

type LruMeta = {
  id: "lru";
  totalBytes: number;
  order: string[];
};

type VideoCacheDb = {
  videos: {
    key: string;
    value: VideoCacheEntry;
  };
  meta: {
    key: string;
    value: LruMeta;
  };
};

let dbPromise: Promise<IDBPDatabase<VideoCacheDb>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VideoCacheDb>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<VideoCacheDb>) {
        if (!db.objectStoreNames.contains("videos")) {
          db.createObjectStore("videos", { keyPath: "messageId" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export class VideoCacheManager {
  static async get(messageId: string): Promise<Blob | null> {
    const db = await getDb();
    const entry = await db.get("videos", messageId);
    if (!entry?.blob || entry.blob.size === 0) return null;
    if (!entry.mimeType.startsWith("video/")) {
      await VideoCacheManager.remove(messageId);
      return null;
    }
    return entry.blob;
  }

  static async has(messageId: string): Promise<boolean> {
    const blob = await VideoCacheManager.get(messageId);
    return blob != null;
  }

  static async getStatus(
    messageId: string,
  ): Promise<"missing" | "cached" | "corrupt"> {
    const db = await getDb();
    const entry = await db.get("videos", messageId);
    if (!entry) return "missing";
    if (!entry.blob?.size || !entry.mimeType.startsWith("video/")) {
      return "corrupt";
    }
    return "cached";
  }

  static async put(
    messageId: string,
    blob: Blob,
    meta: { conversationId: string; mimeType?: string },
  ): Promise<void> {
    if (!blob.size) return;
    const mimeType =
      meta.mimeType && meta.mimeType.startsWith("video/")
        ? meta.mimeType
        : blob.type.startsWith("video/")
          ? blob.type
          : "video/mp4";

    const db = await getDb();
    const tx = db.transaction(["videos", "meta"], "readwrite");
    const lru = (await tx.objectStore("meta").get("lru")) ?? {
      id: "lru" as const,
      totalBytes: 0,
      order: [] as string[],
    };

    const existing = await tx.objectStore("videos").get(messageId);
    if (existing) {
      lru.totalBytes -= existing.size;
      lru.order = lru.order.filter((id: string) => id !== messageId);
    }

    let totalBytes = lru.totalBytes + blob.size;
    const order = lru.order.filter((id: string) => id !== messageId);
    order.push(messageId);

    while (totalBytes > MAX_BYTES && order.length > 0) {
      const evictId = order.shift()!;
      const evicted = await tx.objectStore("videos").get(evictId);
      if (evicted) {
        totalBytes -= evicted.size;
        await tx.objectStore("videos").delete(evictId);
      }
    }

    await tx.objectStore("videos").put({
      messageId,
      blob,
      mimeType,
      size: blob.size,
      cachedAt: Date.now(),
      conversationId: meta.conversationId,
    });

    await tx.objectStore("meta").put({
      id: "lru",
      totalBytes,
      order,
    });
    await tx.done;
  }

  static async remove(messageId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(["videos", "meta"], "readwrite");
    const entry = await tx.objectStore("videos").get(messageId);
    if (entry) {
      await tx.objectStore("videos").delete(messageId);
      const lru = (await tx.objectStore("meta").get("lru")) ?? {
        id: "lru" as const,
        totalBytes: 0,
        order: [] as string[],
      };
      lru.totalBytes = Math.max(0, lru.totalBytes - entry.size);
      lru.order = lru.order.filter((id: string) => id !== messageId);
      await tx.objectStore("meta").put(lru);
    }
    await tx.done;
  }
}
