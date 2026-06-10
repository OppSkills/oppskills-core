import { buildAuthHeaders, getApiRootUrl } from "@/lib/api/apiClient";
import { createApiClient } from "@/lib/api/apiClient";

const API = createApiClient("/chats");

export async function fetchVideoStreamToken(
  token: string,
  conversationId: string,
  messageId: string,
): Promise<string> {
  const res = await API.get(
    `/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/stream-token`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data.streamToken as string;
}

export function buildVideoStreamUrl(
  conversationId: string,
  messageId: string,
  streamToken: string,
): string {
  const root = getApiRootUrl();
  const params = new URLSearchParams({
    disposition: "inline",
    streamToken,
  });
  return `${root}/chats/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachment?${params.toString()}`;
}
