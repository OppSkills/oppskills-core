export const chatQueryKeys = {
  all: ["chats"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...chatQueryKeys.all, "conversation", id] as const,
  messages: (conversationId: string) =>
    [...chatQueryKeys.all, conversationId, "messages"] as const,
  search: (query: string) => [...chatQueryKeys.all, "search", query] as const,
  groupMemberSearch: (query: string) =>
    [...chatQueryKeys.all, "group-member-search", query] as const,
  attachments: (conversationId: string, tab: "media" | "documents") =>
    [...chatQueryKeys.all, conversationId, "attachments", tab] as const,
  memberProfile: (conversationId: string, userId: string) =>
    [...chatQueryKeys.all, conversationId, "member", userId] as const,
};
