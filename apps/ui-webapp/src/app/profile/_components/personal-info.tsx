"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, ShieldCheck, ChevronDown } from "lucide-react";
import { ProfileInput } from "./profile-input";

interface PersonalInfoProps {
  data: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
    gender: string | null;
    userCategory: string | null;
  };
}

export function PersonalInfo({ data }: PersonalInfoProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (!data) return null;

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = `${data.firstName?.charAt(0) || ""}${data.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">Personal Info</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-purple-200 text-[#6B4EAB] hover:bg-purple-50 transition-colors"
        >
          {isEditing ? <Pencil className="w-4 h-4" /> : <Pencil className="w-4 h-4" />} {/* Assuming Save icon is removed, using Pencil for now */}
          <span className="font-medium text-sm">{isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Avatar Section */}
        <div className="relative self-center lg:self-start shrink-0">
          <Avatar className="h-40 w-40 shadow-sm rounded-full border-[6px] border-white">
            <AvatarImage src={data.imageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-4xl font-bold bg-primary-100 text-primary-600 uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full space-y-6">
          {/* Name */}
          <ProfileInput
            label="Name"
            defaultValue={fullName}
            disabled={!isEditing}
          />

          {/* Phone No. */}
          {/* Removed as per instruction, not present in new data prop */}

          {/* Email */}
          {!isEditing &&
            <ProfileInput
              label="Email"
              type="email"
              defaultValue={data.email || ""}
              icon={<ShieldCheck className="w-6 h-6 text-[#6B4EAB] shrink-0" fill="#6B4EAB" stroke="white" />}
            />}

          {/* Gender & User Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileInput
              label="Gender"
              defaultValue={data.gender || "Select"}
              isSelect
              icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
              disabled={!isEditing}
            />
            <ProfileInput
              label="User Type"
              defaultValue={data.userCategory?.replace(/_/g, ' ') || "Select"}
              isSelect
              icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
