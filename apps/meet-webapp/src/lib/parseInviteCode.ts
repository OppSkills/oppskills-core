import { getMeetBaseUrl } from "@/lib/api/communityMeetApi";

export function parseInviteCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const base = getMeetBaseUrl();
    if (url.origin === new URL(base).origin) {
      const segment = url.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
      return segment || null;
    }
    const segment = url.pathname.replace(/^\/+|\/+$/g, "").split("/").pop();
    return segment || null;
  } catch {
    return trimmed.replace(/^\/+|\/+$/g, "") || null;
  }
}
