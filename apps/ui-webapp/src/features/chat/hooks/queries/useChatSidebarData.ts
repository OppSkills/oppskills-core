"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getChatMemberProfile,
  listConversationAttachments,
} from "@/features/chat/api/chatApi";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import { requireChatToken } from "../../cache/chatQueryUtils";

export function useChatSidebarAttachments(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  const { getToken, isLoaded } = useAuth();

  return useQuery({
    queryKey: chatQueryKeys.attachments(conversationId ?? "", "media"),
    enabled: (options?.enabled ?? true) && isLoaded && !!conversationId,
    staleTime: 60_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      const [mediaPage, docsPage] = await Promise.all([
        listConversationAttachments(token, conversationId!, {
          tab: "media",
          limit: 50,
        }),
        listConversationAttachments(token, conversationId!, {
          tab: "documents",
          limit: 50,
        }),
      ]);
      return {
        media: mediaPage.data.map((a) => ({
          messageId: a.messageId,
          fileName: a.fileName,
          kind:
            a.kind === "VIDEO" ? ("video" as const) : ("image" as const),
        })),
        docs: docsPage.data.map((a) => ({
          messageId: a.messageId,
          name: a.fileName,
        })),
      };
    },
  });
}

export function useChatMemberProfile(
  conversationId: string | null,
  memberUserId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { getToken, isLoaded } = useAuth();

  return useQuery({
    queryKey: chatQueryKeys.memberProfile(
      conversationId ?? "",
      memberUserId ?? "",
    ),
    enabled:
      (options?.enabled ?? true) &&
      isLoaded &&
      !!conversationId &&
      !!memberUserId,
    staleTime: 60_000,
    queryFn: async () => {
      const token = requireChatToken(await getToken());
      const profile = await getChatMemberProfile(
        token,
        conversationId!,
        memberUserId!,
      );
      return {
        skills: profile.skills,
        collegeName: profile.collegeName,
      };
    },
  });
}
