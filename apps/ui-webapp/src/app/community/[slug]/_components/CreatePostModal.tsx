"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, Send, LayoutGrid, X } from "lucide-react";
import CustomModal from "./CustomModal";
import AdjustImagesModal from "./AdjustImagesModal";
import PresetImagesModal from "./PresetImagesModal";
import { Button } from "@/components/ui/button";
import { Post } from "./types";
import { isPostContentEmpty } from "./PostContent";
import { toast } from "sonner";
import {
  COMMUNITY_POST_CONTENT_MAX_LENGTH,
  COMMUNITY_POST_IMAGES_MAX_COUNT,
} from "@oppskills/types/constants";
import { getPlainTextLengthFromHtml } from "@/lib/community/textUtils";
import { getDisplayUrl } from "./communityUtils";
import { useDebounce } from "@/hooks/ui/use-debounce";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
  onPublish: (content: string, images: string[]) => void | Promise<void>;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  postToEdit,
  onPublish,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustStartIndex, setAdjustStartIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
      return [];
    });
    setContent("");
  }, []);

  const debouncedContent = useDebounce(content, 1000);
  const debouncedImages = useDebounce(images, 1000);

  // Restore draft automatically when opening modal (for new posts only)
  useEffect(() => {
    if (isOpen && !postToEdit) {
      const savedDraft = localStorage.getItem("community_post_draft");
      if (savedDraft) {
        try {
          const { content: draftContent, images: draftImages } =
            JSON.parse(savedDraft);
          if (typeof draftContent === "string") setContent(draftContent);
          if (Array.isArray(draftImages)) setImages(draftImages);
        } catch (e) {
          console.error("Failed to restore post draft:", e);
        }
      }
    }
  }, [isOpen, postToEdit]);

  // Save draft automatically when content/images change, only if modal is open and not editing
  useEffect(() => {
    if (!isOpen || postToEdit) return;

    if (debouncedContent || debouncedImages.length > 0) {
      const draft = {
        content: debouncedContent,
        images: debouncedImages,
      };
      localStorage.setItem("community_post_draft", JSON.stringify(draft));
    } else {
      localStorage.removeItem("community_post_draft");
    }
  }, [debouncedContent, debouncedImages, isOpen, postToEdit]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    if (postToEdit) {
      setContent(postToEdit.content || "");
      setImages(postToEdit.images || []);
    } else {
      resetForm();
    }
  }, [isOpen, postToEdit, resetForm]);

  const handleClose = () => {
    if (isPublishing) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = COMMUNITY_POST_IMAGES_MAX_COUNT - images.length;
    if (remaining <= 0) {
      toast.error(
        `You can attach up to ${COMMUNITY_POST_IMAGES_MAX_COUNT} images.`,
      );
      e.target.value = "";
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (selected.length < files.length) {
      toast.error(
        `Only ${remaining} more image(s) can be added (max ${COMMUNITY_POST_IMAGES_MAX_COUNT}).`,
      );
    }

    const newImages = selected.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImages]);
    toast.success(`${selected.length} image(s) attached successfully.`);
    e.target.value = "";
  };

  const handleTogglePreset = (presetUrl: string) => {
    setImages((prev) => {
      if (prev.includes(presetUrl)) {
        return prev.filter((url) => url !== presetUrl);
      }
      if (prev.length >= COMMUNITY_POST_IMAGES_MAX_COUNT) return prev;
      return [...prev, presetUrl];
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const url = prev[indexToRemove];
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleImageCropped = (index: number, croppedObjectUrl: string) => {
    setImages((prev) => {
      const next = [...prev];
      const oldUrl = next[index];
      if (oldUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(oldUrl);
      }
      next[index] = croppedObjectUrl;
      return next;
    });
    toast.success("Image cropped.");
  };

  const handlePublishSubmit = async () => {
    if (isPostContentEmpty(content)) {
      toast.error("Please enter some content for your post.");
      return;
    }
    if (
      getPlainTextLengthFromHtml(content) > COMMUNITY_POST_CONTENT_MAX_LENGTH
    ) {
      toast.error(
        `Post content cannot exceed ${COMMUNITY_POST_CONTENT_MAX_LENGTH} characters.`,
      );
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish(content, images);
      // Clear draft on successful post
      localStorage.removeItem("community_post_draft");
      resetForm();
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  const footer = (
    <Button
      onClick={() => void handlePublishSubmit()}
      disabled={isPublishing}
      className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-sm shadow-md active:scale-95 transition-all duration-200"
    >
      {postToEdit ? "Save Changes" : "Publish"}{" "}
      <Send className="w-4 h-4 rotate-45" />
    </Button>
  );

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={handleClose}
        title={postToEdit ? "Edit Post" : "Create Post"}
        footer={footer}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-5 select-none">
          <RichTextEditor
            key={isOpen ? "post-editor-open" : "post-editor-closed"}
            value={content}
            onChange={setContent}
            placeholder="Share an update with your community..."
            maxLength={COMMUNITY_POST_CONTENT_MAX_LENGTH}
            scrollable
            className="rounded-[28px] border-neutral-200 focus-within:border-[#5D3EBB]/60"
          />

          {images.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Attached Images ({images.length}/
                {COMMUNITY_POST_IMAGES_MAX_COUNT})
              </span>
              <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <div
                    key={`${idx}-${img.slice(-16)}`}
                    className="relative w-24 h-16 rounded-xl overflow-hidden border border-neutral-100 hover:scale-[1.03] active:scale-95 transition-all shrink-0 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getDisplayUrl(img)}
                      alt={`Attached graphic preview ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => {
                        setAdjustStartIndex(idx);
                        setIsAdjusting(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-all z-10"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= COMMUNITY_POST_IMAGES_MAX_COUNT}
              className="flex-1 border border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/10 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-extrabold text-[#5D3EBB] transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add Images</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPresetOpen(true)}
              disabled={images.length >= COMMUNITY_POST_IMAGES_MAX_COUNT}
              className="flex-1 border border-dashed border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-extrabold text-neutral-500 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Choose Preset Image</span>
            </button>
          </div>
        </div>
      </CustomModal>

      {isAdjusting && (
        <AdjustImagesModal
          isOpen={isAdjusting}
          onClose={() => setIsAdjusting(false)}
          images={images}
          initialIndex={adjustStartIndex}
          onRemoveImage={handleRemoveImage}
          onImageCropped={handleImageCropped}
          onContinue={() => setIsAdjusting(false)}
        />
      )}

      {isPresetOpen && (
        <PresetImagesModal
          isOpen={isPresetOpen}
          onClose={() => setIsPresetOpen(false)}
          selectedImages={images}
          onTogglePreset={handleTogglePreset}
        />
      )}
    </>
  );
}
