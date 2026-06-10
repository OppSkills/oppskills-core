import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Message, Chat } from "@/features/chat/domain/types";
import { chatQueryKeys } from "./chatQueryKeys";

export const MESSAGE_PAGE_SIZE = 30;

export function requireChatToken(token: string | null): string {
  if (!token) throw new Error("Not authenticated");
  return token;
}

export type ChatMessagesPage = {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
};

export function flattenChatMessages(
  data: InfiniteData<ChatMessagesPage> | undefined,
): Message[] {
  if (!data) return [];
  return data.pages.toReversed().flatMap((page) => page.messages);
}

export function mergeConversationsWithMessageCaches(
  conversations: Chat[],
  queryClient: QueryClient,
): Chat[] {
  return conversations.map((chat) => {
    const messageData = queryClient.getQueryData<
      InfiniteData<ChatMessagesPage>
    >(chatQueryKeys.messages(chat.id));
    const messages = flattenChatMessages(messageData);
    if (messages.length === 0) return chat;
    return { ...chat, messages };
  });
}

type SearchableChatUser = {
  id: string;
  email: string;
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function searchUserDisplayName(user: SearchableChatUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  const local = user.email.split("@")[0] ?? "user";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function mapSearchUserHits(users: SearchableChatUser[]) {
  return users.map((u) => ({
    id: u.id,
    name: searchUserDisplayName(u),
    email: u.email,
    avatar:
      u.imageUrl ??
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&h=150&q=80",
  }));
}
