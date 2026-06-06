"use client";

import React from "react";
import { Edit2, ExternalLink } from "lucide-react";
import { CommunityDetails } from "./types";

interface AboutCardProps {
  details: CommunityDetails;
  onEditAbout?: () => void;
}

export default function AboutCard({ details, onEditAbout }: AboutCardProps) {
  const hasAboutContent =
    details.aboutText && details.aboutText.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 flex flex-col gap-6 relative shadow-xs group">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h3 className="text-xl font-extrabold text-neutral-800 tracking-tight">
          About
        </h3>
        {onEditAbout && (
          <button
            onClick={onEditAbout}
            className="text-neutral-400 hover:text-[#5D3EBB] hover:bg-neutral-50 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
            title="Edit About Section"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasAboutContent ? (
        <div
          className="prose prose-sm md:prose-base max-w-none text-neutral-600 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: details.aboutText }}
        />
      ) : (
        <p className="text-neutral-400 text-sm italic">
          No description yet.
          {onEditAbout ? " Add one to tell people about this community." : ""}
        </p>
      )}

      {details.website && (
        <a
          href={details.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5D3EBB] hover:underline w-fit"
        >
          <ExternalLink className="w-4 h-4" />
          {details.website.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );
}
