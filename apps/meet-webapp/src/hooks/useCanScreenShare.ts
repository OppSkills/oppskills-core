"use client";

import { useEffect, useState } from "react";

export function useCanScreenShare() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getDisplayMedia === "function",
    );
  }, []);

  return canShare;
}
