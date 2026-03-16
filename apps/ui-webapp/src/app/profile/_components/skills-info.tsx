"use client";

import React, { useState } from "react";
import { Pencil, X } from "lucide-react";
import { ProfileInput } from "./profile-input";

interface SkillsInfoProps {
  data: {
    skills: string[];
    interests: string[];
  };
}

export function SkillsInfo({ data }: SkillsInfoProps) {
  const selectedSkills = data?.skills || [];
  const selectedInterests = data?.interests || [];
  const allSelected = [...selectedSkills, ...selectedInterests];

  const suggestedSkills = [
    "Python", "Web Development", "Web Design",
    "Frontend Development", "Figma", "Backend Development",
    "Photoshop", "Angular", "React", "Javascript",
    "Business Ethics", "Illustrator", "InDesign", "Adobe XD"
  ];

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full mt-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">Skills</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-purple-200 text-[#6B4EAB] hover:bg-purple-50 transition-colors"
        >
          {isEditing ? <Pencil className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          <span className="font-medium text-sm">{isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Selected Skills */}
        <div className="space-y-3">
          <p className="text-sm text-[#8B6ED8] font-medium">Selected</p>
          <div className="flex flex-wrap gap-3">
            {allSelected.length > 0 ? allSelected.map((item, index) => (
              <div
                key={`selected-${index}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#6B4EAB] text-white rounded-[20px] text-[15px] font-medium"
              >
                {item}
                <button className="flex items-center justify-center border border-white rounded-full w-4 h-4 hover:bg-white/20 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )) : <span className="text-neutral-400 text-sm">No skills or interests added yet.</span>}
          </div>
        </div>

        {isEditing && (
          <>
            {/* Start Typing Input */}
            <ProfileInput 
              placeholder="Start Typing" 
              containerClassName="bg-white shadow-sm border-neutral-300"
            />

            {/* Suggested Skills */}
            <div className="space-y-3">
              <p className="text-sm text-[#8B6ED8] font-medium mt-6">Suggestions</p>
              <div className="flex flex-wrap gap-3">
                {suggestedSkills.map((skill, index) => (
                  <div
                    key={`suggested-${index}`}
                    className="flex items-center px-5 py-2.5 bg-[#F9F8FD] text-black rounded-[20px] text-[15px] border border-dashed border-[#BCA5FF] hover:bg-[#F0ECF9] cursor-pointer transition-colors"
                    style={{ fontWeight: 400 }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
