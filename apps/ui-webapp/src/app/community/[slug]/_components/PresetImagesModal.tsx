"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, Image as ImageIcon } from "lucide-react";
import CustomModal from "./CustomModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { COMMUNITY_POST_IMAGES_MAX_COUNT } from "@oppskills/types/constants";

interface PresetImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImages: string[];
  onTogglePreset: (presetUrl: string) => void;
}

const FALLBACK_PRESETS = [
  "educational.png",
  "futuristic.png",
  "growth_illustration.png",
  "opportunity_portal.png",
];

export default function PresetImagesModal({
  isOpen,
  onClose,
  selectedImages,
  onTogglePreset,
}: PresetImagesModalProps) {
  const [presets, setPresets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPresets = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/presets");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPresets(data);
          } else {
            setPresets(FALLBACK_PRESETS);
          }
        } else {
          setPresets(FALLBACK_PRESETS);
        }
      } catch (error) {
        console.error("Failed to load preset images:", error);
        setPresets(FALLBACK_PRESETS);
      } finally {
        setLoading(false);
      }
    };

    void fetchPresets();
  }, [isOpen]);

  const handleSelect = (filename: string) => {
    const presetUrl = `https://oppskills.co/illustrations/community/preset/${filename}`;
    const isAlreadySelected = selectedImages.includes(presetUrl);

    if (
      !isAlreadySelected &&
      selectedImages.length >= COMMUNITY_POST_IMAGES_MAX_COUNT
    ) {
      toast.error(
        `You can attach up to ${COMMUNITY_POST_IMAGES_MAX_COUNT} images in total.`,
      );
      return;
    }

    onTogglePreset(presetUrl);
  };

  const footer = (
    <Button
      onClick={onClose}
      className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-8 py-2.5 rounded-full text-sm shadow-md active:scale-95 transition-all duration-200"
    >
      Done
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Preset Image"
      footer={footer}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500 font-medium font-sans">
          Select one or more illustration presets to attach to your post.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#5D3EBB]" />
            <span className="text-xs text-neutral-400 font-semibold font-sans animate-pulse">
              Loading illustrations...
            </span>
          </div>
        ) : presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-12 h-12 text-neutral-300 mb-2" />
            <span className="text-sm text-neutral-400 font-semibold font-sans">
              No preset illustrations found.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-[380px] overflow-y-auto p-1 scrollbar select-none">
            {presets.map((filename) => {
              const presetUrl = `https://oppskills.co/illustrations/community/preset/${filename}`;
              const isSelected = selectedImages.includes(presetUrl);
              const displayPath = `/illustrations/community/preset/${filename}`;
              const titleName = filename
                .replace(/\.[^/.]+$/, "")
                .replace(/[_-]/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <div
                  key={filename}
                  onClick={() => handleSelect(filename)}
                  className={`group relative aspect-[3/2] rounded-2xl overflow-hidden cursor-pointer border-3 transition-all ${
                    isSelected
                      ? "border-[#5D3EBB] shadow-md scale-[1.01]"
                      : "border-neutral-200 hover:border-neutral-400 hover:scale-[1.01]"
                  }`}
                >
                  <img
                    src={displayPath}
                    alt={titleName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Title overlay at the bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-xs py-1.5 px-3 flex items-center justify-between text-white text-[11px] font-bold font-sans">
                    <span className="truncate">{titleName}</span>
                  </div>

                  {/* Selection Indicator Overlay */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#5D3EBB] text-white flex items-center justify-center shadow-md animate-in zoom-in duration-150">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomModal>
  );
}
