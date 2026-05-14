export const hackathonCheckoutIntentKey = (slug: string) =>
  `oppskills:hackathonCheckoutIntent:${slug}`;

export type HackathonCheckoutIntentV1 = {
  v: 1;
  ts: number;
  discountCode?: string;
  ticketTierId?: string;
  teamId?: string;
  teamName?: string;
  maxSize?: number;
  invitationCode?: string;
  joinTeamId?: string;
  /** Optional: answers are persisted server-side via checkout-draft; intent carries routing only. */
  answers?: Array<{ fieldId: string; value: string }>;
};

const MAX_AGE_MS = 60 * 60 * 1000;

export function readHackathonCheckoutIntent(
  slug: string,
): HackathonCheckoutIntentV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(hackathonCheckoutIntentKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HackathonCheckoutIntentV1;
    if (parsed.v !== 1) return null;
    if (
      parsed.answers != null &&
      !Array.isArray(parsed.answers)
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      localStorage.removeItem(hackathonCheckoutIntentKey(slug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeHackathonCheckoutIntent(
  slug: string,
  payload: Omit<HackathonCheckoutIntentV1, "v" | "ts"> & { ts?: number },
): void {
  if (typeof window === "undefined") return;
  try {
    const full: HackathonCheckoutIntentV1 = {
      v: 1,
      ts: payload.ts ?? Date.now(),
      discountCode: payload.discountCode,
      ticketTierId: payload.ticketTierId,
      teamId: payload.teamId,
      teamName: payload.teamName,
      maxSize: payload.maxSize,
      invitationCode: payload.invitationCode,
      joinTeamId: payload.joinTeamId,
      ...(payload.answers !== undefined ? { answers: payload.answers } : {}),
    };
    localStorage.setItem(
      hackathonCheckoutIntentKey(slug),
      JSON.stringify(full),
    );
  } catch {
    /* ignore */
  }
}

export function clearHackathonCheckoutIntent(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(hackathonCheckoutIntentKey(slug));
  } catch {
    /* ignore */
  }
}
