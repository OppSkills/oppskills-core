"use client";

import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import CustomModal from "./CustomModal";
import { CommunityDetails } from "./types";
import { Button } from "@/components/ui/button";

interface EditDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CommunityDetails;
  onUpdate: (updatedDetails: Partial<CommunityDetails>) => void;
}

export default function EditDescriptionModal({
  isOpen,
  onClose,
  details,
  onUpdate,
}: EditDescriptionModalProps) {
  const [description, setDescription] = useState(details.description || "");
  const [aboutText, setAboutText] = useState(details.aboutText || "");
  const [aboutSecondaryText, setAboutSecondaryText] = useState(
    details.aboutSecondaryText || "",
  );
  const [bulletsText, setBulletsText] = useState("");

  // Populate state on open
  useEffect(() => {
    if (isOpen) {
      setDescription(details.description || "");
      setAboutText(details.aboutText || "");
      setAboutSecondaryText(details.aboutSecondaryText || "");
      setBulletsText((details.aboutBullets || []).join("\n"));
    }
  }, [isOpen, details]);

  const handleUpdate = () => {
    const aboutBullets = bulletsText
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    onUpdate({
      description,
      aboutText,
      aboutSecondaryText,
      aboutBullets,
    });
    onClose();
  };

  const footer = (
    <Button
      onClick={handleUpdate}
      className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-sm shadow-md active:scale-95 transition-all duration-200"
    >
      Update <Send className="w-4 h-4 rotate-45" />
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Description"
      footer={footer}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-6 select-none">
        {/* Short Tagline / Description Field */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Short Tagline (Header Description)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description displayed under the community header..."
            rows={2}
            className="w-full border border-neutral-200 rounded-2xl p-4 text-sm font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#5D3EBB]/60 transition-all resize-none"
          />
        </div>

        {/* About Main Narrative Paragraph */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            About - Main Paragraph
          </label>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="The main introduction paragraph of your community..."
            rows={4}
            className="w-full border border-neutral-200 rounded-2xl p-4 text-sm font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#5D3EBB]/60 transition-all resize-none"
          />
        </div>

        {/* About Bullet Insights (one per line) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Key Highlights (One per line)
          </label>
          <textarea
            value={bulletsText}
            onChange={(e) => setBulletsText(e.target.value)}
            placeholder="Point 1&#10;Point 2&#10;Point 3..."
            rows={4}
            className="w-full border border-neutral-200 rounded-2xl p-4 text-sm font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#5D3EBB]/60 transition-all resize-none"
          />
        </div>

        {/* About Secondary Paragraph */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            About - Secondary Paragraph
          </label>
          <textarea
            value={aboutSecondaryText}
            onChange={(e) => setAboutSecondaryText(e.target.value)}
            placeholder="A secondary, concluding paragraph for the about section..."
            rows={3}
            className="w-full border border-neutral-200 rounded-2xl p-4 text-sm font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#5D3EBB]/60 transition-all resize-none"
          />
        </div>
      </div>
    </CustomModal>
  );
}
