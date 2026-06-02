"use client";

import React from "react";
import { Edit2 } from "lucide-react";
import { CommunityDetails } from "./types";

interface AboutCardProps {
  details: CommunityDetails;
  onEditAbout?: () => void;
}

export default function AboutCard({ details, onEditAbout }: AboutCardProps) {
  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 flex flex-col gap-6 relative shadow-xs group">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h3 className="text-xl font-extrabold text-neutral-800 tracking-tight">
          About
        </h3>
        <button
          onClick={onEditAbout}
          className="text-neutral-400 hover:text-[#5D3EBB] hover:bg-neutral-50 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          title="Edit About Section"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Narrative Paragraph */}
      <p className="text-neutral-600 text-sm md:text-base leading-relaxed font-medium">
        {details.aboutText}
      </p>

      {/* Bulleted Insights List */}
      {details.aboutBullets && details.aboutBullets.length > 0 && (
        <ul className="flex flex-col gap-3.5 pl-1.5">
          {details.aboutBullets.map((bullet, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-neutral-600 text-sm md:text-base leading-relaxed font-medium"
            >
              <span className="text-[#E67E22] text-xs mt-1 select-none">★</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Secondary Narrative Paragraph */}
      <p className="text-neutral-600 text-sm md:text-base leading-relaxed font-medium">
        {details.aboutSecondaryText}
      </p>
    </div>
  );
}
