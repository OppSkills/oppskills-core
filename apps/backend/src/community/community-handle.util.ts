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

export function buildHandleCandidates(baseHandle: string): string[] {
  if (!isValidCommunityHandle(baseHandle)) return [];

  const candidates = [
    baseHandle,
    `${baseHandle}-community`,
    `${baseHandle}-official`,
    `${baseHandle}-hub`,
    ...Array.from({ length: 8 }, (_, i) => `${baseHandle}-${i + 2}`),
    ...Array.from({ length: 5 }, (_, i) => `${baseHandle}${i + 1}`),
  ];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of candidates) {
    const trimmed = candidate.slice(0, COMMUNITY_HANDLE_MAX_LENGTH);
    if (!isValidCommunityHandle(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
