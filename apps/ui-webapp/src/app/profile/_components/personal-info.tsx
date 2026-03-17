"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, ShieldCheck, ChevronDown, Check, Loader2, Camera } from "lucide-react";
import { ProfileInput } from "./profile-input";
import { useAuth, useUser } from "@clerk/nextjs";
import { updateProfile } from "@/lib/api/usersApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

const CATEGORY_OPTIONS = [
  { label: "School Student", value: "SCHOOL_STUDENT" },
  { label: "College Student", value: "COLLEGE_STUDENT" },
  { label: "Working Professional", value: "WORKING_PROFESSIONAL" },
  { label: "Fresher", value: "FRESHER" },
  { label: "Professional School Student", value: "PROFESSIONAL_SCHOOL_STUDENT" },
];

export function PersonalInfo({ data }: PersonalInfoProps) {
  const { getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    gender: data?.gender || "",
    userCategory: data?.userCategory || "",
  });

  if (!data) return null;

  const initials = `${formData.firstName?.charAt(0) || ""}${formData.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      await updateProfile(token, formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Updating profile picture...");

    try {
      if (!user) throw new Error("User not found");
      await user.setProfileImage({ file });
      toast.success("Profile picture updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Failed to update profile picture", error);
      toast.error("Failed to update profile picture", { id: loadingToast });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getLabel = (options: { label: string; value: string }[], value: string) => {
    return options.find((opt) => opt.value === value)?.label || "Select";
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full mb-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">Personal Info</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-purple-200 text-[#6B4EAB] hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            <Check className="w-4 h-4" />
          ) : (
            <Pencil className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">{isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Avatar Section */}
        <div className="relative self-center lg:self-start shrink-0 group">
          <Avatar className="h-40 w-40 shadow-sm rounded-full border-[6px] border-white relative overflow-hidden">
            <AvatarImage src={user?.imageUrl || data.imageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-4xl font-bold bg-primary-100 text-primary-600 uppercase">
              {initials}
            </AvatarFallback>

            {/* Upload Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isUserLoaded}
              className={cn(
                "absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-300",
                isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Change Photo</span>
                </>
              )}
            </button>
          </Avatar>

          {/* Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full space-y-6">
          {/* Name Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileInput
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={!isEditing}
              placeholder="First Name"
            />
            <ProfileInput
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={!isEditing}
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          {!isEditing && (
            <ProfileInput
              label="Email"
              type="email"
              defaultValue={data.email || ""}
              disabled={true}
              icon={<ShieldCheck className="w-6 h-6 text-[#6B4EAB] shrink-0" fill="#6B4EAB" stroke="white" />}
            />
          )}

          {/* Gender & User Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Gender</label>
              <DropdownMenu>
                <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                  <ProfileInput
                    defaultValue={getLabel(GENDER_OPTIONS, formData.gender)}
                    isSelect
                    icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
                    disabled={!isEditing}
                    className="space-y-0"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {GENDER_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, gender: opt.value })}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">User Type</label>
              <DropdownMenu>
                <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                  <ProfileInput
                    defaultValue={getLabel(CATEGORY_OPTIONS, formData.userCategory)}
                    isSelect
                    icon={isEditing ? <ChevronDown className="w-5 h-5 text-neutral-600" /> : undefined}
                    disabled={!isEditing}
                    className="space-y-0"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, userCategory: opt.value })}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
