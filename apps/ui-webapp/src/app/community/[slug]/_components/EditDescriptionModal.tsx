"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Send } from "lucide-react";
import CustomModal from "./CustomModal";
import { CommunityDetails } from "./types";
import { Button } from "@/components/ui/button";
import { COMMUNITY_DESCRIPTION_MAX_LENGTH } from "@oppskills/types/constants";
import { getPlainTextLengthFromHtml } from "@/lib/community/textUtils";
import { toast } from "sonner";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);

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
  const [aboutText, setAboutText] = useState(details.aboutText || "");
  const [website, setWebsite] = useState(details.website || "");

  useEffect(() => {
    if (isOpen) {
      setAboutText(details.aboutText || "");
      setWebsite(details.website || "");
    }
  }, [isOpen, details]);

  const handleUpdate = () => {
    if (
      getPlainTextLengthFromHtml(aboutText) > COMMUNITY_DESCRIPTION_MAX_LENGTH
    ) {
      toast.error(
        `Description cannot exceed ${COMMUNITY_DESCRIPTION_MAX_LENGTH} characters.`,
      );
      return;
    }
    onUpdate({
      aboutText,
      description: aboutText,
      website: website.trim() || null,
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
      title="Edit About"
      footer={footer}
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-5 select-none">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            About this community
          </label>
          <RichTextEditor
            value={aboutText}
            onChange={setAboutText}
            placeholder="Describe your community, its mission, and what members can expect..."
            maxLength={COMMUNITY_DESCRIPTION_MAX_LENGTH}
            className="min-h-[240px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Website URL
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-700 placeholder-neutral-400 outline-none focus:border-[#5D3EBB]/60 transition-all"
          />
        </div>
      </div>
    </CustomModal>
  );
}
