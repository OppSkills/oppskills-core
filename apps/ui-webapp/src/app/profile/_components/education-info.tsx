"use client";

import React, { useState } from "react";
import { Pencil, ChevronDown, Save } from "lucide-react";
import { ProfileInput } from "./profile-input";

export function EducationInfo({ data }: {
  data: any
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full mt-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">Education Info</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-purple-200 text-[#6B4EAB] hover:bg-purple-50 transition-colors"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          <span className="font-medium text-sm">{isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* College / University Name */}
        <ProfileInput
          label="College/ University Name"
          defaultValue="College of so called Engg."
          disabled={!isEditing}
        />

        {/* Course */}
        <ProfileInput
          label="Course"
          defaultValue="BTech"
          isSelect
          icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
          disabled={!isEditing}
        />

        {/* Course Specialization */}
        <ProfileInput
          label="Course Specialization"
          defaultValue="Computer Science Engg."
          isSelect
          icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
          disabled={!isEditing}
        />

        {/* Start Year & End Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInput
            label="Start Year"
            defaultValue="2022"
            isSelect
            icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
            disabled={!isEditing}
          />
          <ProfileInput
            label="End Year"
            defaultValue="2026"
            isSelect
            icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
            disabled={!isEditing}
          />
        </div>

        {/* Roll Number & Roll No./ Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInput
            label="Roll Number"
            defaultValue="Male"
            disabled={!isEditing}
          />
          <ProfileInput
            label="Roll No./ Percentage"
            defaultValue="College Student"
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );
}
