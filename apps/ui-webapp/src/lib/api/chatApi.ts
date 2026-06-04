import { buildAuthHeaders, createApiClient } from "./apiClient";
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatCursorPageDto,
  ChatMemberProfileDto,
  ChatMessageDto,
  ChatSearchResultDto,
  SendChatMessageDto,
  UpdateGroupConversationDto,
} from "@oppskills/types";

const API = createApiClient("/chats");

export async function listConversations(
  token: string,
  params?: { limit?: number; cursor?: string },
): Promise<ChatCursorPageDto<ChatConversationListItemDto>> {
  const res = await API.get("/conversations", {
    headers: buildAuthHeaders(token),
    params,
  });
  return res.data;
}

export async function searchUsersForGroup(
  token: string,
  q: string,
): Promise<ChatSearchResultDto["users"]> {
  const res = await API.get("/users/search", {
    headers: buildAuthHeaders(token),
    params: { q: q.trim() },
  });
  return res.data;
}

export async function searchChats(
  token: string,
  q: string,
): Promise<ChatSearchResultDto> {
  const res = await API.get("/search", {
    headers: buildAuthHeaders(token),
    params: { q },
  });
  return res.data;
}

export async function createDirectConversation(
  token: string,
  otherUserId: string,
): Promise<ChatConversationDetailDto> {
  const res = await API.post(
    "/conversations/direct",
    { otherUserId },
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function createGroupConversation(
  token: string,
  data: { name: string; handle?: string; memberIds: string[] },
): Promise<ChatConversationDetailDto> {
  const res = await API.post("/conversations/group", data, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function getConversation(
  token: string,
  id: string,
): Promise<ChatConversationDetailDto> {
  const res = await API.get(`/conversations/${id}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function listMessages(
  token: string,
  conversationId: string,
  params?: { limit?: number; before?: string; after?: string },
): Promise<ChatCursorPageDto<ChatMessageDto>> {
  const res = await API.get(`/conversations/${conversationId}/messages`, {
    headers: buildAuthHeaders(token),
    params,
  });
  return res.data;
}

export async function sendMessage(
  token: string,
  conversationId: string,
  data: SendChatMessageDto,
): Promise<ChatMessageDto> {
  const res = await API.post(`/conversations/${conversationId}/messages`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function markConversationRead(
  token: string,
  conversationId: string,
): Promise<void> {
  await API.post(
    `/conversations/${conversationId}/read`,
    {},
    { headers: buildAuthHeaders(token) },
  );
}

export async function listConversationAttachments(
  token: string,
  conversationId: string,
  params: {
    tab: "media" | "documents";
    limit?: number;
    cursor?: string;
  },
) {
  const res = await API.get(`/conversations/${conversationId}/attachments`, {
    headers: buildAuthHeaders(token),
    params,
  });
  return res.data as ChatCursorPageDto<{
    id: string;
    messageId: string;
    fileName: string;
    mimeType: string;
    url: string;
    kind: string;
    createdAt: string;
  }>;
}

export async function getChatMemberProfile(
  token: string,
  conversationId: string,
  userId: string,
): Promise<ChatMemberProfileDto> {
  const res = await API.get(
    `/conversations/${conversationId}/member/${userId}`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function updateGroupConversation(
  token: string,
  conversationId: string,
  data: UpdateGroupConversationDto,
): Promise<ChatConversationDetailDto> {
  const res = await API.patch(`/conversations/${conversationId}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data;
}

export async function removeGroupMember(
  token: string,
  conversationId: string,
  memberUserId: string,
): Promise<ChatConversationDetailDto> {
  const res = await API.delete(
    `/conversations/${conversationId}/members/${memberUserId}`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data;
}

export async function deleteChat(
  token: string,
  conversationId: string,
): Promise<void> {
  await API.delete(`/conversations/${conversationId}`, {
    headers: buildAuthHeaders(token),
  });
}

export async function leaveGroup(
  token: string,
  conversationId: string,
): Promise<void> {
  await API.post(
    `/conversations/${conversationId}/leave`,
    {},
    { headers: buildAuthHeaders(token) },
  );
}

export async function deleteGroup(
  token: string,
  conversationId: string,
): Promise<void> {
  await API.delete(`/conversations/${conversationId}/group`, {
    headers: buildAuthHeaders(token),
  });
}
