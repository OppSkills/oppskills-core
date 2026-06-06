import {
  COMMUNITY_HANDLE_MAX_LENGTH,
  COMMUNITY_HANDLE_MIN_LENGTH,
} from "@oppskills/types/constants";

const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

export function normalizeCommunityHandle(raw: string): string {
  return raw.trim().toLowerCase().slice(0, COMMUNITY_HANDLE_MAX_LENGTH);
}

export function isValidCommunityHandle(handle: string): boolean {
  return (
    handle.length >= COMMUNITY_HANDLE_MIN_LENGTH &&
    handle.length <= COMMUNITY_HANDLE_MAX_LENGTH &&
    HANDLE_PATTERN.test(handle)
  );
}

export function deriveCommunityHandleFromName(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, COMMUNITY_HANDLE_MAX_LENGTH);
}

export function formatHandleForDisplay(handle: string): string {
  return (
    normalizeCommunityHandle(handle).replace(/[^a-z0-9_-]/g, "") ||
    "your-handle"
  );
}
