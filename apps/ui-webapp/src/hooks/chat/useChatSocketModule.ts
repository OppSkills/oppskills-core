"use client";

import { useEffect, useState } from "react";

export type ChatSocketModule = typeof import("@/lib/chat/chatSocket");

/** Loads the chat socket module once per mount for synchronous room join/leave. */
export function useChatSocketModule(): ChatSocketModule | null {
  const [socketModule, setSocketModule] = useState<ChatSocketModule | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void import("@/lib/chat/chatSocket").then((mod) => {
      if (!cancelled) setSocketModule(mod);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return socketModule;
}
