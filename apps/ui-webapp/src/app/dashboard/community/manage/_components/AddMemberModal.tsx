"use client";

import React, { useState } from "react";
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

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember?: (email: string, role: string) => void;
  availableRoles?: string[];
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  availableRoles = ["Community Admin", "Media Lead", "Content Writer", "Circle"],
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(availableRoles[0] || "Community Admin");

  // Keep state synchronized if availableRoles changes
  React.useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter member email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (onAddMember) {
      onAddMember(email.trim(), role);
    } else {
      toast.success(`Successfully invited "${email.trim()}" as "${role}"!`);
    }

    // Reset Form & Close
    setEmail("");
    setRole(availableRoles[0] || "Community Admin");
    onClose();
  };

  // Footer button matching screenshot
  const footerElement = (
    <Button
      onClick={handleSubmit}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      Add Member
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Member"
      footer={footerElement}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        
        {/* Member Email Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Member Email
          </label>
          <Input
            type="email"
            placeholder="myemail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
          />
        </div>

        {/* Member Role Radix Select Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Member Role
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select member role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {availableRoles.map((roleOption) => (
                <SelectItem key={roleOption} value={roleOption} className="rounded-lg font-medium cursor-pointer">
                  {roleOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </form>
    </CustomModal>
  );
}
