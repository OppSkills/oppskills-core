/**
 * Persist registration answers before Razorpay opens so we can recover if the
 * tab is killed on mobile (handler never runs) but payment succeeds.
 */
export const pendingHackathonRegistrationKey = (slug: string) =>
  `oppskills:pendingHackathonRegistration:${slug}`;

export type PendingHackathonRegistrationPayload = {
  v: 1;
  answers: Array<{ fieldId: string; value: string }>;
  teamName?: string;
  maxSize?: number;
  invitationCode?: string;
  userId: string | undefined;
  ts: number;
};

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function readPendingHackathonRegistration(
  slug: string,
): PendingHackathonRegistrationPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pendingHackathonRegistrationKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingHackathonRegistrationPayload;
    if (parsed.v !== 1 || !Array.isArray(parsed.answers)) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      localStorage.removeItem(pendingHackathonRegistrationKey(slug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingHackathonRegistration(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(pendingHackathonRegistrationKey(slug));
  } catch {
    /* ignore */
  }
}

/** Same pattern for event registration: paid (before Razorpay) and free (before join API). */
export const pendingEventRegistrationKey = (slug: string) =>
  `oppskills:pendingEventRegistration:${slug}`;

export function readPendingEventRegistration(
  slug: string,
): Pick<PendingHackathonRegistrationPayload, "v" | "answers" | "userId" | "ts"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pendingEventRegistrationKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingHackathonRegistrationPayload;
    if (parsed.v !== 1 || !Array.isArray(parsed.answers)) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      localStorage.removeItem(pendingEventRegistrationKey(slug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingEventRegistration(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(pendingEventRegistrationKey(slug));
  } catch {
    /* ignore */
  }
}

export function writePendingEventRegistration(
  slug: string,
  payload: {
    answers: Array<{ fieldId: string; value: string }>;
    userId: string | undefined;
  },
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      pendingEventRegistrationKey(slug),
      JSON.stringify({
        v: 1,
        answers: payload.answers,
        userId: payload.userId,
        ts: Date.now(),
      } satisfies PendingHackathonRegistrationPayload),
    );
  } catch {
    /* ignore */
  }
}

export function writePendingHackathonRegistration(
  slug: string,
  payload: Omit<PendingHackathonRegistrationPayload, "v" | "ts"> & {
    ts?: number;
  },
): void {
  if (typeof window === "undefined") return;
  try {
    const full: PendingHackathonRegistrationPayload = {
      v: 1,
      answers: payload.answers,
      teamName: payload.teamName,
      maxSize: payload.maxSize,
      invitationCode: payload.invitationCode,
      userId: payload.userId,
      ts: payload.ts ?? Date.now(),
    };
    localStorage.setItem(
      pendingHackathonRegistrationKey(slug),
      JSON.stringify(full),
    );
  } catch {
    /* quota / private mode */
  }
}
