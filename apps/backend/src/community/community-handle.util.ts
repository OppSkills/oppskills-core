import {
  COMMUNITY_HANDLE_MAX_LENGTH,
  COMMUNITY_HANDLE_MIN_LENGTH,
} from '@oppskills/types';

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
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.slice(0, COMMUNITY_HANDLE_MAX_LENGTH);
}

/** Build a handle by appending a suffix, truncating the base so the result fits. */
function appendHandleSuffix(
  baseHandle: string,
  suffix: string,
): string | null {
  const maxBaseLen = COMMUNITY_HANDLE_MAX_LENGTH - suffix.length;
  if (maxBaseLen < COMMUNITY_HANDLE_MIN_LENGTH) return null;

  let root = baseHandle.slice(0, maxBaseLen).replace(/-+$/, '');
  if (root.length < COMMUNITY_HANDLE_MIN_LENGTH) {
    root = baseHandle.slice(0, maxBaseLen);
  }
  if (root.length < COMMUNITY_HANDLE_MIN_LENGTH) return null;

  const candidate = `${root}${suffix}`;
  return isValidCommunityHandle(candidate) ? candidate : null;
}

export function buildHandleCandidates(baseHandle: string): string[] {
  if (!isValidCommunityHandle(baseHandle)) return [];

  const suffixes = [
    '-community',
    '-official',
    '-hub',
    ...Array.from({ length: 8 }, (_, i) => `-${i + 2}`),
    ...Array.from({ length: 5 }, (_, i) => `${i + 1}`),
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  const add = (candidate: string | null) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    result.push(candidate);
  };

  add(baseHandle);
  for (const suffix of suffixes) {
    add(appendHandleSuffix(baseHandle, suffix));
  }

  return result;
}
