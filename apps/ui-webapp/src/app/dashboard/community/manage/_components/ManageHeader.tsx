"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldAlert } from "lucide-react";

interface ManageHeaderProps {
  communityId: string;
  communityName?: string;
  onAddMember?: () => void;
  isEligibleToModify?: boolean;
}

export default function ManageHeader({
  communityId,
  communityName,
  onAddMember,
  isEligibleToModify = false,
}: ManageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full pb-2 border-b border-neutral-100">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl tracking-tight text-neutral-900">
          {communityName || "Manage Your Community"}
        </h1>
        <p className="text-neutral-700 text-base">
          Here is summary of your Community
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {isEligibleToModify && (
          <Button onClick={onAddMember} className="bg-primary-700">
            Add Member
          </Button>
        )}
      </div>
    </div>
  );
}
