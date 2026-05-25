"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldAlert } from "lucide-react";

interface ManageHeaderProps {
  communityId: string;
  onAddMember?: () => void;
  onAddRole?: () => void;
}

export default function ManageHeader({
  communityId,
  onAddMember,
  onAddRole,
}: ManageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full pb-2 border-b border-neutral-100">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl tracking-tight text-neutral-900">
          Manage Your Community
        </h1>
        <p className="text-neutral-700 text-base">
          Here is summary of your Community
        </p>
        <p className="text-xs text-neutral-500 font-mono" aria-label="Community identifier">
          {communityId}
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button onClick={onAddMember} className="bg-primary-700">Add Member</Button>
        <Button variant="outline" onClick={onAddRole}>Add Member Role</Button>
      </div>
    </div>
  );
}
