"use client";

import React, { useEffect, useState } from "react";
import CustomModal from "./CustomModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AddMemberTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddType?: (typeName: string) => void | Promise<void>;
  existingTypes?: string[];
}

export default function AddMemberTypeModal({
  isOpen,
  onClose,
  onAddType,
  existingTypes = [],
}: AddMemberTypeModalProps) {
  const [typeName, setTypeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTypeName("");
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    const trimmed = typeName.trim();
    if (!trimmed) {
      toast.error("Please enter a member type name.");
      return;
    }

    const exists = existingTypes.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      toast.error(`"${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddType?.(trimmed);
      setTypeName("");
      onClose();
    } catch {
      // Parent shows error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerElement = (
    <Button
      type="button"
      disabled={isSubmitting}
      onClick={() => void handleSubmit()}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60"
    >
      {isSubmitting ? "Adding..." : "Add Type"}
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Member Type"
      footer={footerElement}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <p className="text-sm text-neutral-500 font-medium">
          Add a new member type tab. You can assign people to this type when
          adding members.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Type Name
          </label>
          <Input
            type="text"
            placeholder="e.g. Media Lead, Content Writer"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
            autoFocus
          />
        </div>
      </form>
    </CustomModal>
  );
}
