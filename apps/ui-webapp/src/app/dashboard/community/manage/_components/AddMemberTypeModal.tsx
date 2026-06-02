"use client";

import React, { useState } from "react";
import CustomModal from "./CustomModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AddMemberTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddType?: (name: string, accentColor: string) => void;
}

interface AccentColor {
  hex: string;
  name: string;
}

const ACCENT_COLORS: AccentColor[] = [
  { hex: "#FF3D00", name: "Red Orange" },
  { hex: "#FF9100", name: "Orange" },
  { hex: "#FFD600", name: "Yellow" },
  { hex: "#00BFA5", name: "Teal Green" },
  { hex: "#4FC3F7", name: "Sky Blue" },
  { hex: "#7C4DFF", name: "Periwinkle" },
  { hex: "#D500F9", name: "Purple" },
  { hex: "#FF4081", name: "Pink" },
];

export default function AddMemberTypeModal({
  isOpen,
  onClose,
  onAddType,
}: AddMemberTypeModalProps) {
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedHex, setSelectedHex] = useState(ACCENT_COLORS[2].hex); // Default to Yellow

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      toast.error("Please enter a member type name");
      return;
    }

    if (onAddType) {
      onAddType(typeName.trim(), selectedHex);
    }

    // Reset Form & Close
    setTypeName("");
    setDescription("");
    setSelectedHex(ACCENT_COLORS[2].hex);
    onClose();
  };

  // Footer component matching the screenshot
  const footerElement = (
    <Button
      onClick={handleSubmit}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      Add Member Type
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Member Type"
      footer={footerElement}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {/* Type Name Input Column */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Type Name
          </label>
          <Input
            type="text"
            placeholder="Placeholder Text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-400 font-medium bg-white"
          />
        </div>

        {/* Description Textarea Column */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Add Description
          </label>
          <Textarea
            placeholder="Admin will be responsible for handling the community entirely he will view complete admin dashboard"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] p-5 border border-neutral-350 focus:border-[#835BD5] rounded-3xl text-base placeholder-neutral-400 leading-relaxed resize-none bg-white"
          />
        </div>

        {/* Accent Color Circle Pickers */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Choose Accent
          </label>
          <div className="flex items-center gap-3.5 flex-wrap py-1.5">
            {ACCENT_COLORS.map((color) => {
              const isSelected = selectedHex === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setSelectedHex(color.hex)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-11 h-11 rounded-full cursor-pointer transition-all duration-300 transform active:scale-90 hover:scale-105 ${
                    isSelected
                      ? "border-[3.5px] border-[#0C0114] scale-105 shadow-md shadow-[#0C0114]/20"
                      : "border border-neutral-200/50 hover:shadow-xs"
                  }`}
                  title={color.name}
                />
              );
            })}
          </div>
        </div>
      </form>
    </CustomModal>
  );
}
