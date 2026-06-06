"use client";

import React, { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddReferrerModal } from "@/app/dashboard/_components/referrals/AddReferrerModal";
import type { ReferralEntityType } from "@/lib/api/referralApi";

export const AddReferrerButton: React.FC<{
  entityType: ReferralEntityType;
  entityId: string;
  isReadOnly?: boolean;
}> = memo(({ entityType, entityId, isReadOnly = false }) => {
  if (process.env.NODE_ENV === "development") {
    console.count("[render] AddReferrerButton");
  }

  const [isOpen, setIsOpen] = useState(false);

  if (isReadOnly) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-full px-6 h-12 bg-[#4C3E73] hover:bg-[#3D315C] text-white font-semibold shadow-lg transition-all active:scale-95"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Referrer
      </Button>

      {isOpen ? (
        <AddReferrerModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          entityType={entityType}
          entityId={entityId}
        />
      ) : null}
    </>
  );
});
