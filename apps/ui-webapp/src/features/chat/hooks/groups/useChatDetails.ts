"use client";

import { useCallback, useState } from "react";
import {
  useChatMemberProfile,
  useChatSidebarAttachments,
} from "../queries/useChatSidebarData";

export function useChatDetails() {
  const [sidebarRequest, setSidebarRequest] = useState<{
    conversationId: string;
    otherMemberId?: string;
  } | null>(null);

  const sidebarAttachmentsQuery = useChatSidebarAttachments(
    sidebarRequest?.conversationId ?? null,
    { enabled: !!sidebarRequest },
  );
  const memberProfileQuery = useChatMemberProfile(
    sidebarRequest?.conversationId ?? null,
    sidebarRequest?.otherMemberId,
    { enabled: !!sidebarRequest?.otherMemberId },
  );

  const loadSidebarData = useCallback(
    (conversationId: string, otherMemberId?: string) => {
      setSidebarRequest((prev) => {
        if (
          prev?.conversationId === conversationId &&
          prev?.otherMemberId === otherMemberId
        ) {
          return prev;
        }
        return { conversationId, otherMemberId };
      });
    },
    [],
  );

  return {
    loadSidebarData,
    memberProfile: memberProfileQuery.data ?? null,
    sidebarMedia: sidebarAttachmentsQuery.data?.media ?? [],
    sidebarDocs: sidebarAttachmentsQuery.data?.docs ?? [],
  };
}
