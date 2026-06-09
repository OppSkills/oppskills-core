import type { ChatUserPresenceDto } from "@oppskills/types";
import type { Chat, ChatMemberUi } from "../domain/types";

export function getDmPeer(
  chat: Pick<Chat, "isGroup" | "members">,
  currentUserId: string | null,
): ChatMemberUi | undefined {
  if (chat.isGroup || !currentUserId) return undefined;
  return chat.members.find((m) => m.id !== currentUserId);
}

export function isDmPeerOnline(
  chat: Pick<Chat, "isGroup" | "members">,
  currentUserId: string | null,
): boolean {
  return getDmPeer(chat, currentUserId)?.presence?.isOnline === true;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatLastSeen(lastSeenAt: string): string {
  const seen = new Date(lastSeenAt);
  if (Number.isNaN(seen.getTime())) return "Offline";

  const now = new Date();
  const diffMs = now.getTime() - seen.getTime();
  if (diffMs < 60_000) return "Last seen just now";

  const time = formatTime(seen);
  if (isSameCalendarDay(seen, now)) {
    return `Last seen today at ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(seen, yesterday)) {
    return `Last seen yesterday at ${time}`;
  }

  const weekAgo = startOfDay(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (seen >= weekAgo) {
    const weekday = seen.toLocaleDateString(undefined, { weekday: "long" });
    return `Last seen ${weekday} at ${time}`;
  }

  return `Last seen ${seen.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: seen.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}`;
}

export function formatMemberPresence(
  presence: ChatUserPresenceDto | undefined,
): string {
  if (!presence) return "Offline";
  if (presence.isOnline) return "Online";
  if (presence.lastSeenAt) return formatLastSeen(presence.lastSeenAt);
  return "Offline";
}

/** Subtitle under the chat header (DM peer or group summary). */
export function formatChatPresenceSubtitle(
  chat: {
    isGroup: boolean;
    members: ChatMemberUi[];
  },
  currentUserId: string | null,
): string {
  if (!currentUserId) {
    return chat.isGroup
      ? chat.members.map((m) => m.name).join(", ")
      : "Offline";
  }

  if (!chat.isGroup) {
    return formatMemberPresence(getDmPeer(chat, currentUserId)?.presence);
  }

  const onlineCount = chat.members.filter(
    (m) => m.id !== currentUserId && m.presence?.isOnline,
  ).length;

  if (onlineCount > 0) {
    return onlineCount === 1 ? "1 online" : `${onlineCount} online`;
  }

  return chat.members.map((m) => m.name).join(", ");
}
