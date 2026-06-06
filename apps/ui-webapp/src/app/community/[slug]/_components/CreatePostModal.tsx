"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, Send, Sparkles } from "lucide-react";
import CustomModal from "./CustomModal";
import AdjustImagesModal from "./AdjustImagesModal";
import { Button } from "@/components/ui/button";
import { Post } from "./types";
import { isPostContentEmpty } from "./PostContent";
import { toast } from "sonner";
import {
  COMMUNITY_POST_CONTENT_MAX_LENGTH,
  COMMUNITY_POST_IMAGES_MAX_COUNT,
} from "@oppskills/types/constants";
import { getPlainTextLengthFromHtml } from "@/lib/community/textUtils";

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

const PRESET_MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop&q=80",
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mockImageIndexRef = useRef(0);

  const resetForm = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
      return [];
    });
    setContent("");
    mockImageIndexRef.current = 0;
  }, []);

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

  const handleAddMockImage = () => {
    if (images.length >= COMMUNITY_POST_IMAGES_MAX_COUNT) {
      toast.error(
        `You can attach up to ${COMMUNITY_POST_IMAGES_MAX_COUNT} images.`,
      );
      return;
    }
    const notYetUsed = PRESET_MOCK_IMAGES.filter(
      (url) => !images.includes(url),
    );
    const pool = notYetUsed.length > 0 ? notYetUsed : PRESET_MOCK_IMAGES;
    const idx = mockImageIndexRef.current % pool.length;
    mockImageIndexRef.current += 1;
    const img = pool[idx];
    setImages((prev) => [...prev, img]);
    toast.success("Preset image attached.");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
                    onClick={() => {
                      setAdjustStartIndex(idx);
                      setIsAdjusting(true);
                    }}
                    className="relative w-24 h-16 rounded-xl overflow-hidden cursor-pointer border border-neutral-100 hover:scale-[1.03] active:scale-95 transition-all shrink-0"
                    title="Click to crop image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Attached graphic preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
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
              onClick={handleAddMockImage}
              disabled={images.length >= COMMUNITY_POST_IMAGES_MAX_COUNT}
              className="flex-1 border border-dashed border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-extrabold text-neutral-500 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Add Preset Mock Image</span>
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
    </>
  );
}
