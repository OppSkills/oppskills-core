"use client";

import React, { useState, useMemo } from "react";
import CustomModal from "./CustomModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole?: (roleName: string, roleType: string) => void;
  customRoleTypes?: string[];
}

export default function AddMemberRoleModal({
  isOpen,
  onClose,
  onAddRole,
  customRoleTypes = [],
}: AddMemberRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [roleType, setRoleType] = useState("Circle");
  const [platformAccess, setPlatformAccess] = useState("Admin Access");
  const [responsibility, setResponsibility] = useState("");

  const allRoleTypes = useMemo(() => {
    const base = ["Circle", "Core Team", "Alumini"];
    return [...base, ...customRoleTypes];
  }, [customRoleTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    if (onAddRole) {
      onAddRole(roleName.trim(), roleType);
    } else {
      toast.success(
        `Successfully created community role "${roleName.trim()}"!`,
      );
    }

    // Reset Form & Close
    setRoleName("");
    setRoleType("Circle");
    setPlatformAccess("Admin Access");
    setResponsibility("");
    onClose();
  };

  // Footer button matching screenshot
  const footerElement = (
    <Button
      onClick={handleSubmit}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      Add Member Role
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Member Role"
      footer={footerElement}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {/* Role Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Role Name*
          </label>
          <Input
            type="text"
            placeholder="Captain"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full h-12 px-5 border border-[#c3bfc4] focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
          />
        </div>

        {/* Role Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Role Type*
          </label>
          <Select value={roleType} onValueChange={setRoleType}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select role type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {allRoleTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="rounded-lg font-medium cursor-pointer"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role Platform Access */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Role Platform Access
          </label>
          <Select value={platformAccess} onValueChange={setPlatformAccess}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select platform access" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              <SelectItem
                value="Admin Access"
                className="rounded-lg font-medium cursor-pointer"
              >
                Admin Access
              </SelectItem>
              <SelectItem
                value="Create Opportunities"
                className="rounded-lg font-medium cursor-pointer"
              >
                Create Opportunities
              </SelectItem>
              <SelectItem
                value="View Analytics"
                className="rounded-lg font-medium cursor-pointer"
              >
                View Analytics
              </SelectItem>
              <SelectItem
                value="Assign Tasks"
                className="rounded-lg font-medium cursor-pointer"
              >
                Assign Tasks
              </SelectItem>
              <SelectItem
                value="Create Meets"
                className="rounded-lg font-medium cursor-pointer"
              >
                Create Meets
              </SelectItem>
              <SelectItem
                value="Manage Feed"
                className="rounded-lg font-medium cursor-pointer"
              >
                Manage Feed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Responsibility Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Role Responsibility
          </label>
          <Textarea
            placeholder="Admin will be responsible for handling the community entirely he will view complete admin dashboard"
            value={responsibility}
            onChange={(e) => setResponsibility(e.target.value)}
            className="w-full min-h-[100px] p-5 border border-neutral-350 focus:border-[#835BD5] rounded-3xl text-base placeholder-neutral-450 leading-relaxed resize-none bg-white"
          />
        </div>
      </form>
    </CustomModal>
  );
}
