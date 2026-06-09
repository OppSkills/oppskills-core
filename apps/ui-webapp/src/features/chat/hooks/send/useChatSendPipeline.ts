"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useReducer, useRef } from "react";
import { mapMessageToUi } from "@/features/chat/domain/mappers";
import {
  type PendingAttachment,
  type PendingAttachmentKind,
} from "@/features/chat/lib/attachmentTypes";
import { applyChatEvent } from "../../cache/reducer";
import { chatQueryKeys } from "../../cache/chatQueryKeys";
import type { ChatMessagesPage } from "../../cache/chatQueryUtils";
import {
  attachmentSendBody,
  createOptimisticMessage,
  createOptimisticPreviewUrl,
  optimisticMessageId,
} from "@/features/chat/lib/optimisticMessage";
import type { useChatMutations } from "../mutations/useChatMutations";
import type { ChatSocketModule } from "../queries/useChatSocketModule";

type SendBatchState = "idle" | "uploading" | "sending";

type SendPipelineState = {
  batchState: SendBatchState;
  activeConversationId: string | null;
};

type SendPipelineAction =
  | { type: "START_BATCH"; conversationId: string }
  | { type: "UPLOADING" }
  | { type: "SENDING" }
  | { type: "DONE" }
  | { type: "FAILED" };

function sendPipelineReducer(
  state: SendPipelineState,
  action: SendPipelineAction,
): SendPipelineState {
  switch (action.type) {
    case "START_BATCH":
      return { batchState: "uploading", activeConversationId: action.conversationId };
    case "UPLOADING":
      return { ...state, batchState: "uploading" };
    case "SENDING":
      return { ...state, batchState: "sending" };
    case "DONE":
    case "FAILED":
      return { batchState: "idle", activeConversationId: null };
    default:
      return state;
  }
}

type UseChatSendPipelineOptions = {
  currentUserId: string | null;
  selectedChatId: string | null;
  socketModule: ChatSocketModule | null;
  mutations: ReturnType<typeof useChatMutations>;
};

export function useChatSendPipeline({
  currentUserId,
  selectedChatId,
  socketModule,
  mutations,
}: UseChatSendPipelineOptions) {
  const queryClient = useQueryClient();
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  const { getTokenSafe, sendMessageMutation } = mutations;

  const [pipelineState, dispatch] = useReducer(sendPipelineReducer, {
    batchState: "idle",
    activeConversationId: null,
  });

  const uploadChatFile = useCallback(
    async (
      token: string,
      file: File,
      kind: PendingAttachmentKind,
      onProgress?: (percent: number) => void,
    ) => {
      const [
        { presignDocumentUpload, presignImageUpload },
        { fileForChatUpload, resolveChatUploadMime },
        { uploadDocumentToS3WithProgress, uploadImageToS3WithProgress },
      ] = await Promise.all([
        import("@/lib/api/mediaApi"),
        import("@/features/chat/lib/uploadMime"),
        import("@/features/chat/lib/uploadWithProgress"),
      ]);

      const mime = resolveChatUploadMime(file, kind);
      const uploadFile = fileForChatUpload(file, mime);
      onProgress?.(5);

      if (kind === "image") {
        const presign = await presignImageUpload(token, {
          purpose: "CHAT_ATTACHMENT",
          mimeType: mime,
        });
        onProgress?.(15);
        await uploadImageToS3WithProgress({
          presign,
          file: uploadFile,
          onProgress: (p) => onProgress?.(15 + Math.round(p * 0.75)),
        });
        onProgress?.(95);
        return {
          url: presign.publicUrl,
          type: "IMAGE" as const,
          kind: "IMAGE" as const,
          mime,
        };
      }

      const isVideo = kind === "video";
      const attachmentKind = isVideo
        ? ("VIDEO" as const)
        : ("DOCUMENT" as const);
      const presign = await presignDocumentUpload(token, {
        purpose: "CHAT_ATTACHMENT",
        mimeType: mime,
        fileName: file.name,
      });
      onProgress?.(15);
      await uploadDocumentToS3WithProgress({
        presign,
        file: uploadFile,
        onProgress: (p) => onProgress?.(15 + Math.round(p * 0.75)),
      });
      onProgress?.(95);
      return {
        url: presign.publicUrl,
        type: attachmentKind,
        kind: attachmentKind,
        mime,
      };
    },
    [],
  );

  const sendTextMessage = useCallback(
    async (conversationId: string, text: string, replyToMessageId?: string) => {
      if (!currentUserId || !socketModule) return;

      const payload = {
        type: "TEXT" as const,
        body: text,
        replyToMessageId,
      };

      await socketModule.joinConversation(conversationId);

      let saved = await socketModule.emitSendMessage(conversationId, payload);
      if (!saved) {
        saved = await sendMessageMutation.mutateAsync({
          conversationId,
          payload,
        });
      }
      if (saved) {
        applyChatEvent(
          queryClient,
          {
            type: "SERVER_MESSAGE",
            conversationId,
            dto: saved,
            isActiveChat: selectedChatIdRef.current === conversationId,
          },
          { currentUserId },
        );
      }
    },
    [currentUserId, queryClient, sendMessageMutation, socketModule],
  );

  const sendAttachmentBatch = useCallback(
    async (
      conversationId: string,
      items: PendingAttachment[],
      caption: string,
    ) => {
      if (!currentUserId || !socketModule) return;

      dispatch({ type: "START_BATCH", conversationId });

      const optimisticMsgs = items.map((item, i) => {
        const previewUrl =
          item.previewUrl ?? createOptimisticPreviewUrl(item);
        const displayCaption = i === 0 ? caption : "";
        return createOptimisticMessage(
          item,
          displayCaption,
          currentUserId,
          previewUrl,
          item.posterUrl,
        );
      });

      for (const optimisticMsg of optimisticMsgs) {
        applyChatEvent(
          queryClient,
          {
            type: "OPTIMISTIC_APPEND",
            conversationId,
            message: optimisticMsg,
          },
          { currentUserId },
        );
      }

      try {
        const token = await getTokenSafe();
        await socketModule.joinConversation(conversationId);

        for (let i = 0; i < items.length; i++) {
          const item = items[i]!;
          const tempId = optimisticMessageId(item.id);

          try {
            dispatch({ type: "UPLOADING" });
            const { url, type, kind, mime } = await uploadChatFile(
              token,
              item.file,
              item.kind,
              (p) => {
                applyChatEvent(
                  queryClient,
                  {
                    type: "UPLOAD_PROGRESS",
                    conversationId,
                    tempId,
                    percent: p,
                  },
                  { currentUserId },
                );
              },
            );

            applyChatEvent(
              queryClient,
              {
                type: "UPLOAD_PROGRESS",
                conversationId,
                tempId,
                percent: 98,
              },
              { currentUserId },
            );

            const body = attachmentSendBody(item, caption, i, type);
            const payload = {
              type,
              body,
              attachment: {
                fileName: item.file.name,
                mimeType: mime,
                sizeBytes: item.file.size,
                url,
                kind,
              },
            };

            dispatch({ type: "SENDING" });
            let saved = await socketModule.emitSendMessage(
              conversationId,
              payload,
            );
            if (!saved) {
              saved = await sendMessageMutation.mutateAsync({
                conversationId,
                payload,
              });
            }
            if (saved) {
              const uiMsg = mapMessageToUi(saved, currentUserId);
              if (uiMsg.imageUrl) {
                const { preloadImageUrl } = await import(
                  "@/features/chat/lib/preloadImage"
                );
                await preloadImageUrl(uiMsg.imageUrl);
              }

              const messageData = queryClient.getQueryData<{
                pages: ChatMessagesPage[];
              }>(chatQueryKeys.messages(conversationId));
              const pending = messageData?.pages
                .flatMap((page) => page.messages)
                .find((m) => m.id === tempId);

              applyChatEvent(
                queryClient,
                {
                  type: "OPTIMISTIC_REPLACE",
                  conversationId,
                  tempId,
                  message: uiMsg,
                  stableKey: pending?.stableKey,
                },
                { currentUserId },
              );
            }
          } catch (e) {
            console.error(e);
            applyChatEvent(
              queryClient,
              {
                type: "OPTIMISTIC_FAILED",
                conversationId,
                tempId,
              },
              { currentUserId },
            );
          }
        }
        dispatch({ type: "DONE" });
      } catch (e) {
        console.error(e);
        dispatch({ type: "FAILED" });
      }
    },
    [
      currentUserId,
      getTokenSafe,
      queryClient,
      uploadChatFile,
      sendMessageMutation,
      socketModule,
    ],
  );

  const downloadMessageAttachment = useCallback(
    async (
      conversationId: string,
      messageId: string,
      fileName: string,
      fallbackBlobUrl?: string,
    ) => {
      if (messageId.startsWith("optimistic-") && fallbackBlobUrl) {
        const res = await fetch(fallbackBlobUrl);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const token = await getTokenSafe();
      const { downloadChatMessageAttachment } = await import(
        "@/features/chat/lib/downloadAttachment"
      );
      await downloadChatMessageAttachment(
        token,
        conversationId,
        messageId,
        fileName,
      );
    },
    [getTokenSafe],
  );

  return {
    sendTextMessage,
    sendAttachmentBatch,
    downloadMessageAttachment,
    sendPipelineState: pipelineState,
  };
}
