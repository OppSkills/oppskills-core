"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { useChatMutations } from "../mutations/useChatMutations";

type UseChatGroupAdminOptions = {
  selectedChatId: string | null;
  mutations: ReturnType<typeof useChatMutations>;
};

export function useChatGroupAdmin({
  selectedChatId,
  mutations,
}: UseChatGroupAdminOptions) {
  const router = useRouter();
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const {
    getTokenSafe,
    createGroupMutation,
    updateGroupMutation,
    removeMemberMutation,
    deleteChatMutation,
    leaveGroupMutation,
    deleteGroupMutation,
    invalidateMessages,
  } = mutations;

  const createGroup = useCallback(
    async (name: string, memberIds: string[]) => {
      const conv = await createGroupMutation.mutateAsync({ name, memberIds });
      router.push(`/dashboard/chats/${conv.id}`);
    },
    [createGroupMutation, router],
  );

  const updateGroupPhoto = useCallback(
    async (conversationId: string, file: File) => {
      const token = await getTokenSafe();
      const mime = file.type.toLowerCase();
      if (!mime.startsWith("image/")) {
        throw new Error("Only image files are supported");
      }
      const [{ presignImageUpload }, { uploadImageToS3WithProgress }] =
        await Promise.all([
          import("@/lib/api/mediaApi"),
          import("@/features/chat/lib/uploadWithProgress"),
        ]);
      const presign = await presignImageUpload(token, {
        purpose: "CHAT_ATTACHMENT",
        mimeType: mime,
      });
      await uploadImageToS3WithProgress({ presign, file });
      await updateGroupMutation.mutateAsync({
        conversationId,
        data: { imageUrl: presign.publicUrl },
      });
    },
    [getTokenSafe, updateGroupMutation],
  );

  const removeGroupMember = useCallback(
    async (conversationId: string, memberUserId: string) => {
      await removeMemberMutation.mutateAsync({ conversationId, memberUserId });
      if (selectedChatIdRef.current === conversationId) {
        await invalidateMessages(conversationId);
      }
    },
    [invalidateMessages, removeMemberMutation],
  );

  const deleteChat = useCallback(
    async (conversationId: string) => {
      await deleteChatMutation.mutateAsync(conversationId);
      if (selectedChatIdRef.current === conversationId) {
        router.replace("/dashboard/chats");
      }
    },
    [deleteChatMutation, router],
  );

  const leaveGroup = useCallback(
    async (conversationId: string) => {
      await leaveGroupMutation.mutateAsync(conversationId);
      if (selectedChatIdRef.current === conversationId) {
        router.replace("/dashboard/chats");
      }
    },
    [leaveGroupMutation, router],
  );

  const deleteGroup = useCallback(
    async (conversationId: string) => {
      await deleteGroupMutation.mutateAsync(conversationId);
      if (selectedChatIdRef.current === conversationId) {
        router.replace("/dashboard/chats");
      }
    },
    [deleteGroupMutation, router],
  );

  return {
    createGroup,
    updateGroupPhoto,
    removeGroupMember,
    deleteChat,
    leaveGroup,
    deleteGroup,
  };
}
