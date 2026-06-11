"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import {
  checkCommunityHandleAvailability,
  suggestCommunityHandles,
} from "@/lib/api/communityApi";
import { useDebounce } from "@/hooks/ui/use-debounce";
import {
  isValidCommunityHandle,
  normalizeCommunityHandle,
} from "@/lib/community/handleUtils";

export const communityHandleQueryKeys = {
  all: ["community", "handle"] as const,
  availability: (handle: string) =>
    [...communityHandleQueryKeys.all, "availability", handle] as const,
  suggestions: (name: string) =>
    [...communityHandleQueryKeys.all, "suggestions", name] as const,
};

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
  const onHandleChangeRef = useRef(onHandleChange);
  onHandleChangeRef.current = onHandleChange;

  const normalizedHandle = normalizeCommunityHandle(handle);
  const debouncedHandle = useDebounce(normalizedHandle, debounceMs);
  const trimmedName = name.trim();
  const debouncedName = useDebounce(trimmedName, debounceMs);

  const suggestionsQuery = useQuery({
    queryKey: communityHandleQueryKeys.suggestions(debouncedName),
    enabled: debouncedName.length > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: () => suggestCommunityHandles(debouncedName),
  });

  const availabilityQuery = useQuery({
    queryKey: communityHandleQueryKeys.availability(debouncedHandle),
    enabled:
      debouncedHandle.length > 0 && isValidCommunityHandle(debouncedHandle),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: () => checkCommunityHandleAvailability(debouncedHandle),
  });

  const suggestions = suggestionsQuery.data?.suggestions ?? [];

  const status: HandleAvailabilityStatus = (() => {
    if (!normalizedHandle) return "idle";
    if (!isValidCommunityHandle(normalizedHandle)) return "invalid";
    if (normalizedHandle !== debouncedHandle || availabilityQuery.isFetching) {
      return "checking";
    }
    if (availabilityQuery.isError) return "idle";
    if (availabilityQuery.data?.available) return "available";
    if (availabilityQuery.data && !availabilityQuery.data.available) {
      return "taken";
    }
    return "idle";
  })();

  useEffect(() => {
    if (status !== "taken" || handleManuallyEdited) return;
    const next = suggestions[0];
    if (next && next !== normalizedHandle) {
      onHandleChangeRef.current(next);
    }
  }, [status, handleManuallyEdited, suggestions, normalizedHandle]);

  const applySuggestion = useCallback((suggestion: string) => {
    onHandleChangeRef.current(suggestion);
  }, []);

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
