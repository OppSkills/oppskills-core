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
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@clerk/nextjs";
import { searchSkills, recommendSkills, Skill } from "@/lib/api/skillsApi";
import { Loader2 } from "lucide-react";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
  onPublish: (
    content: string,
    images: string[],
    skillIds?: string[],
  ) => void | Promise<void>;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  postToEdit,
  onPublish,
}: CreatePostModalProps) {
  const { getToken } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustStartIndex, setAdjustStartIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<Skill[]>([]);
  const [isSearchingSkills, setIsSearchingSkills] = useState(false);
  const [isRecommendingSkills, setIsRecommendingSkills] = useState(false);

  const resetForm = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
      return [];
    });
    setContent("");
    setSelectedSkills([]);
    setSkillSearchQuery("");
    setSearchResults([]);
    setRecommendedSkills([]);
  }, []);

  const debouncedContent = useDebounce(content, 1000);
  const debouncedImages = useDebounce(images, 1000);
  const debouncedRecommendationContent = useDebounce(content, 500);
  const debouncedSearchQuery = useDebounce(skillSearchQuery, 500);

  // Fetch recommendations
  useEffect(() => {
    async function fetchRecommendations() {
      const token = await getToken();
      if (!token) return;
      setIsRecommendingSkills(true);
      try {
        const text =
          getPlainTextLengthFromHtml(debouncedRecommendationContent) > 0
            ? debouncedRecommendationContent.replace(/<[^>]*>/g, "")
            : "";
        const recs = await recommendSkills(token, text, 5);
        setRecommendedSkills(recs);
      } catch (err) {
        console.error("Failed to get skill recommendations:", err);
      } finally {
        setIsRecommendingSkills(false);
      }
    }

    if (isOpen) {
      fetchRecommendations();
    }
  }, [debouncedRecommendationContent, getToken, isOpen]);

  // Fetch search results
  useEffect(() => {
    async function fetchSearch() {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      const token = await getToken();
      if (!token) return;
      setIsSearchingSkills(true);
      try {
        const results = await searchSkills(
          token,
          debouncedSearchQuery.trim(),
          10,
        );
        setSearchResults(results);
      } catch (err) {
        console.error("Failed to search skills:", err);
      } finally {
        setIsSearchingSkills(false);
      }
    }
    fetchSearch();
  }, [debouncedSearchQuery, getToken]);

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
      const skillIds = selectedSkills.map((s) => s.id);
      await onPublish(content, images, skillIds);
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

          {/* Skills Section */}
          <div className="flex flex-col gap-3.5 border-t border-neutral-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Skills Tagged
              </span>
              {selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSkills([])}
                  className="text-xs text-neutral-400 hover:text-[#5D3EBB] transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Selected Skills Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedSkills.length === 0 ? (
                <span className="text-sm text-neutral-400 italic">
                  No skills tagged yet.
                </span>
              ) : (
                selectedSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 bg-[#E6E0FA] text-[#2E1E66] text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs hover:bg-[#D4C9F5] transition-all"
                  >
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSkills((prev) =>
                          prev.filter((s) => s.id !== skill.id),
                        )
                      }
                      className="text-[#2E1E66] hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Recommendations / Search Results */}
            <div className="flex flex-col gap-2.5 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl p-4">
              {/* Skill Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and tag skills..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-[#5D3EBB]/60 focus:ring-1 focus:ring-[#5D3EBB]/60 text-sm px-4 py-2.5 rounded-full outline-none transition-all placeholder:text-neutral-400"
                />
                {isSearchingSkills && (
                  <div className="absolute right-3.5 top-3 text-[#5D3EBB]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Suggestions / Results */}
              <div>
                {skillSearchQuery.trim() !== "" ? (
                  <div>
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
                      Search Results
                    </span>
                    {isSearchingSkills ? (
                      <div className="flex flex-wrap gap-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-7 w-20 bg-neutral-200 rounded-full"
                          />
                        ))}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <span className="text-xs text-neutral-400">
                        No matching skills found.
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {searchResults.map((skill) => {
                          const isSelected = selectedSkills.some(
                            (s) => s.id === skill.id,
                          );
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              disabled={isSelected}
                              onClick={() => {
                                setSelectedSkills((prev) => [...prev, skill]);
                                setSkillSearchQuery("");
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                isSelected
                                  ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : "border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/20 text-neutral-600 hover:text-[#2E1E66] active:scale-95"
                              }`}
                            >
                              + {skill.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                      <span>Suggested Skills</span>
                      {isRecommendingSkills && (
                        <Loader2 className="w-3 h-3 animate-spin text-[#5D3EBB]" />
                      )}
                    </span>
                    {isRecommendingSkills && recommendedSkills.length === 0 ? (
                      <div className="flex flex-wrap gap-2 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-7 w-20 bg-neutral-200 rounded-full"
                          />
                        ))}
                      </div>
                    ) : recommendedSkills.length === 0 ? (
                      <span className="text-xs text-neutral-400">
                        No suggestions available.
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {recommendedSkills.map((skill) => {
                          const isSelected = selectedSkills.some(
                            (s) => s.id === skill.id,
                          );
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              disabled={isSelected}
                              onClick={() =>
                                setSelectedSkills((prev) => [...prev, skill])
                              }
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                isSelected
                                  ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : "border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/20 text-neutral-600 hover:text-[#2E1E66] active:scale-95"
                              }`}
                            >
                              + {skill.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

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
