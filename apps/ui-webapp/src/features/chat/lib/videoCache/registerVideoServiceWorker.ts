"use client";

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

export function registerVideoServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register("/chat-video-sw.js", { scope: "/" })
      .catch((error) => {
        console.warn("Video service worker registration failed", error);
        return null;
      });
  }

  return registrationPromise;
}

export type VideoSwMessage =
  | { type: "VIDEO_CACHED"; messageId: string; size: number }
  | { type: "VIDEO_CACHE_PROGRESS"; messageId: string; percent: number }
  | { type: "VIDEO_CACHE_FAILED"; messageId: string; error: string };

export function subscribeVideoSwMessages(
  handler: (message: VideoSwMessage) => void,
): () => void {
  if (typeof window === "undefined" || !navigator.serviceWorker) {
    return () => undefined;
  }

  const listener = (event: MessageEvent) => {
    const data = event.data as VideoSwMessage | undefined;
    if (!data?.type) return;
    if (
      data.type === "VIDEO_CACHED" ||
      data.type === "VIDEO_CACHE_PROGRESS" ||
      data.type === "VIDEO_CACHE_FAILED"
    ) {
      handler(data);
    }
  };

  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
