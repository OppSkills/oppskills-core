"use client";

import { useEffect, useState } from "react";

function hasDisplayMediaApi(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function"
  );
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Screen share availability is hard to detect on mobile before a user gesture.
 * We enable the control when the API exists, or on mobile where Safari/Chrome
 * may expose it only after tap (iOS 17.4+, Android Chrome).
 */
export function useCanScreenShare() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(hasDisplayMediaApi() || isMobileUserAgent());
  }, []);

  return canShare;
}
