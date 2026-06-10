"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, Send, LayoutGrid, X, Loader2 } from "lucide-react";
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
import { useAuth } from "@clerk/nextjs";
import { searchSkills, type Skill } from "@/lib/api/skillsApi";

const SKILLS_MAX_PER_POST = 5;
const SKILLS_CACHE_KEY = "oppskills_top_skills_cache";
const SELECTED_SKILLS_HISTORY_KEY = "oppskills_selected_skills_history";

// Module-level session cache — survives re-renders and re-opens within the same
// browser session, eliminating redundant network round-trips.
let _sessionSkillsCache: Skill[] | null = null;

function readSkillsHistory(): Skill[] {
  try {
    const raw = localStorage.getItem(SELECTED_SKILLS_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Skill[]) : [];
  } catch {
    return [];
  }
}

function saveSkillsHistory(skills: Skill[]) {
  try {
    // Deduplicate; keep the 20 most recently used
    const existing = readSkillsHistory();
    const merged = [
      ...skills,
      ...existing.filter((e) => !skills.some((s) => s.id === e.id)),
    ].slice(0, 20);
    localStorage.setItem(SELECTED_SKILLS_HISTORY_KEY, JSON.stringify(merged));
  } catch {
    /* localStorage may be unavailable in SSR/sandboxed environments */
  }
}

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

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [topSkills, setTopSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  const atSkillLimit = selectedSkills.length >= SKILLS_MAX_PER_POST;

  // --- Client-side search: pure filter over the in-memory topSkills list ---
  const debouncedSearchQuery = useDebounce(skillSearchQuery, 200);
  const filteredSkills = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return topSkills
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [debouncedSearchQuery, topSkills]);

  // Suggestions when not searching: history-first, then top skills
  const suggestions = useMemo(() => {
    if (debouncedSearchQuery.trim()) return [];
    const history = readSkillsHistory();
    const historyIds = new Set(history.map((s) => s.id));
    const rest = topSkills.filter((s) => !historyIds.has(s.id));
    return [...history, ...rest].slice(0, 10);
  }, [debouncedSearchQuery, topSkills]);

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
  }, []);

  const debouncedContent = useDebounce(content, 1000);
  const debouncedImages = useDebounce(images, 1000);

  // --------------------------------------------------------------------------
  // Fetch top skills ONCE per modal open.
  // Uses module-level cache first, then localStorage, then network.
  // `active` flag prevents stale async responses from overwriting fresh state.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function loadTopSkills() {
      // 1. Serve from session memory immediately (zero latency)
      if (_sessionSkillsCache) {
        if (active) setTopSkills(_sessionSkillsCache);
        return;
      }

      // 2. Serve from localStorage while the network call is in flight
      try {
        const cached = localStorage.getItem(SKILLS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as Skill[];
          if (active) setTopSkills(parsed);
          _sessionSkillsCache = parsed;
        }
      } catch {
        /* ignore */
      }

      // 3. Fetch fresh from API
      setIsLoadingSkills(true);
      try {
        const token = await getToken();
        if (!token || !active) return;
        const fresh = await searchSkills(token, "", 10);
        if (!active) return;
        _sessionSkillsCache = fresh;
        setTopSkills(fresh);
        try {
          localStorage.setItem(SKILLS_CACHE_KEY, JSON.stringify(fresh));
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error("Failed to load top skills:", err);
      } finally {
        if (active) setIsLoadingSkills(false);
      }
    }

    loadTopSkills();
    return () => {
      active = false;
    };
  }, [isOpen, getToken]);

  // Restore draft
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

  // Persist draft
  useEffect(() => {
    if (!isOpen || postToEdit) return;

    if (debouncedContent || debouncedImages.length > 0) {
      const draft = { content: debouncedContent, images: debouncedImages };
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

  const addSkill = (skill: Skill) => {
    if (atSkillLimit) return;
    if (selectedSkills.some((s) => s.id === skill.id)) return;
    const next = [...selectedSkills, skill];
    setSelectedSkills(next);
    setSkillSearchQuery("");
    saveSkillsHistory(next);
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  const handlePublishSubmit = async () => {
    if (isPostContentEmpty(content)) {
      toast.error("Please enter some content for your post.");
      return;
    }
    if (getPlainTextLengthFromHtml(content) > COMMUNITY_POST_CONTENT_MAX_LENGTH) {
      toast.error(
        `Post content cannot exceed ${COMMUNITY_POST_CONTENT_MAX_LENGTH} characters.`,
      );
      return;
    }

    setIsPublishing(true);
    try {
      const skillIds = selectedSkills.map((s) => s.id);
      await onPublish(content, images, skillIds);
      localStorage.removeItem("community_post_draft");
      resetForm();
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  // Decide which skill chips to show in the suggestion panel
  const displaySkills =
    debouncedSearchQuery.trim() ? filteredSkills : suggestions;

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

          {/* ── Skills Section ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Skills{" "}
                <span
                  className={
                    atSkillLimit ? "text-amber-500" : "text-neutral-300"
                  }
                >
                  ({selectedSkills.length}/{SKILLS_MAX_PER_POST})
                </span>
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

            {/* Selected skill tags */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 bg-[#E6E0FA] text-[#2E1E66] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#D4C9F5] transition-all"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="text-[#2E1E66] hover:text-red-600 rounded-full p-0.5"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search + suggestions panel */}
            <div className="flex flex-col gap-2.5 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl p-3.5">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  id="skill-search-input"
                  placeholder={
                    atSkillLimit
                      ? `Max ${SKILLS_MAX_PER_POST} skills reached`
                      : "Search skills..."
                  }
                  disabled={atSkillLimit}
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-[#5D3EBB]/60 focus:ring-1 focus:ring-[#5D3EBB]/60 text-sm px-4 py-2.5 rounded-full outline-none transition-all placeholder:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isLoadingSkills && (
                  <div className="absolute right-3.5 top-3 text-[#5D3EBB]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Chip list */}
              {!atSkillLimit && (
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
                    {debouncedSearchQuery.trim()
                      ? "Search Results"
                      : "Suggested Skills"}
                  </span>

                  {isLoadingSkills && displaySkills.length === 0 ? (
                    <div className="flex flex-wrap gap-2 animate-pulse">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-7 w-20 bg-neutral-200 rounded-full"
                        />
                      ))}
                    </div>
                  ) : displaySkills.length === 0 ? (
                    <span className="text-xs text-neutral-400">
                      {debouncedSearchQuery.trim()
                        ? "No matching skills."
                        : "No suggestions available."}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {displaySkills.map((skill) => {
                        const isSelected = selectedSkills.some(
                          (s) => s.id === skill.id,
                        );
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            disabled={isSelected}
                            onClick={() => addSkill(skill)}
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
