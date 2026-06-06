"use client";

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { CommunityMember as Member } from "@oppskills/types";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onUpdateMember: (
    memberId: string,
    role: string,
    accessControl: string
  ) => Promise<void>;
  availableRoles?: string[];
}

export default function EditMemberModal({
  isOpen,
  onClose,
  member,
  onUpdateMember,
  availableRoles = ["Community Admin", "Media Lead", "Content Writer", "Circle"],
}: EditMemberModalProps) {
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [accessControl, setAccessControl] = useState("Read Only");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when member is loaded or changed
  useEffect(() => {
    if (member) {
      // Map accessControlRole code to friendly name
      let friendlyAccess = "Read Only";
      if (member.accessControlRole === "ADMIN") {
        friendlyAccess = "Admin Access";
      } else if (member.accessControlRole === "MODERATOR") {
        friendlyAccess = "Moderator";
      } else if (member.accessControlRole === "MEMBER") {
        friendlyAccess = "Member";
      }
      setAccessControl(friendlyAccess);

      // Map role to select option
      if (availableRoles.includes(member.role)) {
        setRole(member.role);
        setCustomRole("");
      } else {
        setRole("custom");
        setCustomRole(member.role);
      }
    } else {
      // Reset to defaults when member is cleared (modal closed/reset)
      setRole("");
      setCustomRole("");
      setAccessControl("Read Only");
    }
  }, [member, availableRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const finalRole = role === "custom" ? customRole.trim() : role;
    if (!finalRole) {
      toast.error("Please select a role or enter a custom one.");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateMember(member.id, finalRole, accessControl);
      onClose();
    } catch (err) {
      // Errors handled by parent toast, but safety fallback
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const footerElement = (
    <Button
      onClick={handleSubmit}
      disabled={isSaving}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Member Role & Access"
      footer={footerElement}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {/* Member Info Banner */}
        {member && (
          <div className="bg-[#F8F9FA] border border-neutral-200/60 p-4 rounded-2xl flex flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-400 select-none uppercase tracking-wider">
              Editing Member
            </span>
            <span className="text-base font-bold text-neutral-800">
              {member.name}
            </span>
            <span className="text-sm text-neutral-500 font-medium">
              {member.email}
            </span>
          </div>
        )}

        {/* Member Role Select Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Member Role / Label
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-355 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select member role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {availableRoles.map((roleOption) => (
                <SelectItem
                  key={roleOption}
                  value={roleOption}
                  className="rounded-lg font-medium cursor-pointer"
                >
                  {roleOption}
                </SelectItem>
              ))}
              <SelectItem
                value="custom"
                className="rounded-lg font-medium cursor-pointer text-[#835BD5] font-semibold"
              >
                Create Custom Type...
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {role === "custom" && (
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
              Custom Role Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Media Lead, content writer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
            />
          </div>
        )}

        {/* Access Control Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Access Control Role
          </label>
          <Select value={accessControl} onValueChange={setAccessControl}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select access control" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {["Admin Access", "Moderator", "Read Only", "Member"].map((level) => (
                <SelectItem
                  key={level}
                  value={level}
                  className="rounded-lg font-medium cursor-pointer"
                >
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </CustomModal>
  );
}
