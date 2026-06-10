"use client";

import { useCallback, useRef, useState } from "react";
import {
  createPendingAttachment,
  revokePendingPreview,
  type PendingAttachment,
} from "@/features/chat/lib/attachmentTypes";
import { captureVideoPosterUrl } from "@/features/chat/lib/videoPoster";

export function useChatComposer() {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerCaption, setComposerCaption] = useState("");
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cropMode, setCropMode] = useState(false);

  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const appendAttachments = useCallback((items: PendingAttachment[]) => {
    if (items.length === 0) return;

    let startIndex = 0;
    setPendingAttachments((prev) => {
      startIndex = prev.length;
      return [...prev, ...items];
    });
    setActiveAttachmentIndex(startIndex);
    setCropMode(false);
    setComposerOpen(true);

    for (const item of items) {
      if (item.kind !== "video") continue;
      void captureVideoPosterUrl(item.file)
        .then((posterUrl) => {
          setPendingAttachments((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, posterUrl } : p)),
          );
        })
        .catch(() => undefined);
    }
  }, []);

  const addPendingFile = useCallback(
    (file: File) => {
      appendAttachments([createPendingAttachment(file)]);
    },
    [appendAttachments],
  );

  const addPendingFiles = useCallback(
    (files: File[]) => {
      appendAttachments(files.map((f) => createPendingAttachment(f)));
    },
    [appendAttachments],
  );

  const replaceActiveFile = useCallback(
    (file: File) => {
      const newItem = createPendingAttachment(file);
      setPendingAttachments((prev) => {
        const idx = activeAttachmentIndex;
        if (idx < 0 || idx >= prev.length) return prev;
        const next = [...prev];
        revokePendingPreview(next[idx]!);
        next[idx] = newItem;
        return next;
      });
    },
    [activeAttachmentIndex],
  );

  const removePending = useCallback((id: string) => {
    setPendingAttachments((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) revokePendingPreview(item);
      const next = prev.filter((p) => p.id !== id);
      setActiveAttachmentIndex((i) =>
        Math.min(i, Math.max(0, next.length - 1)),
      );
      if (next.length === 0) {
        setComposerOpen(false);
        setCropMode(false);
      }
      return next;
    });
  }, []);

  const closeComposer = useCallback(
    (options?: { revokePreviews?: boolean }) => {
      if (options?.revokePreviews !== false) {
        pendingAttachments.forEach(revokePendingPreview);
      }
      setPendingAttachments([]);
      setComposerCaption("");
      setComposerOpen(false);
      setActiveAttachmentIndex(0);
      setCropMode(false);
    },
    [pendingAttachments],
  );

  const triggerDocPick = useCallback(() => {
    setAttachmentMenuOpen(false);
    requestAnimationFrame(() => docInputRef.current?.click());
  }, []);

  const triggerMediaPick = useCallback(() => {
    setAttachmentMenuOpen(false);
    requestAnimationFrame(() => mediaInputRef.current?.click());
  }, []);

  const triggerAudioPick = useCallback(() => {
    setAttachmentMenuOpen(false);
    requestAnimationFrame(() => audioInputRef.current?.click());
  }, []);

  const triggerCamera = useCallback(() => {
    setAttachmentMenuOpen(false);
    setCameraOpen(true);
  }, []);

  const composerHasDraft =
    pendingAttachments.length > 0 ||
    composerCaption.trim().length > 0 ||
    cropMode;

  return {
    pendingAttachments,
    composerHasDraft,
    composerOpen,
    composerCaption,
    setComposerCaption,
    activeAttachmentIndex,
    setActiveAttachmentIndex,
    attachmentMenuOpen,
    setAttachmentMenuOpen,
    cameraOpen,
    setCameraOpen,
    cropMode,
    setCropMode,
    docInputRef,
    mediaInputRef,
    audioInputRef,
    addPendingFile,
    addPendingFiles,
    replaceActiveFile,
    removePending,
    closeComposer,
    triggerDocPick,
    triggerMediaPick,
    triggerAudioPick,
    triggerCamera,
  };
}
