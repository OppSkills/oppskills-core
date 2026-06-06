"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkCommunityHandleAvailability,
  suggestCommunityHandles,
} from "@/lib/api/communityApi";
import {
  isValidCommunityHandle,
  normalizeCommunityHandle,
} from "@/lib/community/handleUtils";

export type HandleAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

interface UseCommunityHandleFieldOptions {
  name: string;
  handle: string;
  handleManuallyEdited: boolean;
  onHandleChange: (handle: string) => void;
  debounceMs?: number;
}

export function useCommunityHandleField({
  name,
  handle,
  handleManuallyEdited,
  onHandleChange,
  debounceMs = 350,
}: UseCommunityHandleFieldOptions) {
  const [status, setStatus] = useState<HandleAvailabilityStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const requestIdRef = useRef(0);
  const onHandleChangeRef = useRef(onHandleChange);
  onHandleChangeRef.current = onHandleChange;

  const normalizedHandle = normalizeCommunityHandle(handle);

  const refreshSuggestions = useCallback(async (sourceName: string) => {
    if (!sourceName.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const { suggestions: next } = await suggestCommunityHandles(sourceName);
      setSuggestions(next);
      return next;
    } catch {
      setSuggestions([]);
      return [];
    }
  }, []);

  // Debounced availability check + suggestions.
  useEffect(() => {
    const currentRequest = ++requestIdRef.current;

    if (!normalizedHandle) {
      setStatus("idle");
      setSuggestions([]);
      return;
    }

    if (!isValidCommunityHandle(normalizedHandle)) {
      setStatus("invalid");
      void refreshSuggestions(name);
      return;
    }

    setStatus("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const [{ available }, suggested] = await Promise.all([
            checkCommunityHandleAvailability(normalizedHandle),
            refreshSuggestions(name),
          ]);
          if (requestIdRef.current !== currentRequest) return;

          if (available) {
            setStatus("available");
            return;
          }

          setStatus("taken");

          if (!handleManuallyEdited && suggested && suggested.length > 0) {
            const next = suggested[0];
            if (next && next !== normalizedHandle) {
              onHandleChangeRef.current(next);
            }
          }
        } catch {
          if (requestIdRef.current !== currentRequest) return;
          setStatus("idle");
        }
      })();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    normalizedHandle,
    name,
    handleManuallyEdited,
    debounceMs,
    refreshSuggestions,
  ]);

  const applySuggestion = useCallback(
    (suggestion: string) => {
      onHandleChangeRef.current(suggestion);
    },
    [],
  );

  const canSubmitHandle =
    isValidCommunityHandle(normalizedHandle) && status === "available";

  return {
    normalizedHandle,
    status,
    suggestions,
    applySuggestion,
    canSubmitHandle,
    isChecking: status === "checking",
  };
}
