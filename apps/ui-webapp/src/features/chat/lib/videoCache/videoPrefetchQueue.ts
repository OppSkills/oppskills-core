import { getApiRootUrl } from "@/lib/api/apiClient";

type PrefetchJob = {
  conversationId: string;
  messageId: string;
  token: string;
};

const queue: PrefetchJob[] = [];
const seen = new Set<string>();
let flushing = false;

function jobKey(conversationId: string, messageId: string) {
  return `${conversationId}:${messageId}`;
}

async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const registration = await navigator.serviceWorker?.ready;
    const sw = registration?.active;
    if (!sw) return;

    while (queue.length > 0) {
      const job = queue.shift()!;
      sw.postMessage({
        type: "PREFETCH_VIDEO",
        messageId: job.messageId,
        conversationId: job.conversationId,
        token: job.token,
        apiRoot: getApiRootUrl(),
      });
    }
  } finally {
    flushing = false;
  }
}

export const videoPrefetchQueue = {
  enqueue(conversationId: string, messageId: string, token: string) {
    const key = jobKey(conversationId, messageId);
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ conversationId, messageId, token });
    void flushQueue();
  },
};
