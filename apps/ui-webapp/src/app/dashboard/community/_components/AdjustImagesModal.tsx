"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import CustomModal from "./CustomModal";
import { Button } from "@/components/ui/button";

interface AdjustImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  onRemoveImage: (index: number) => void;
  onContinue: () => void;
}

export default function AdjustImagesModal({
  isOpen,
  onClose,
  images,
  onRemoveImage,
  onContinue,
}: AdjustImagesModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-adjust activeIndex if images change/shrink
  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(Math.max(0, images.length - 1));
    }
  }, [images, activeIndex]);

  if (!isOpen) return null;

  const handleRemove = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onRemoveImage(idx);
  };

  const footer = (
    <Button
      onClick={onContinue}
      className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-8 py-2.5 rounded-full text-sm shadow-md active:scale-95 transition-all duration-200"
    >
      Continue
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Images"
      footer={footer}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-6">
        {/* Large Active Preview Container with thin overlays mimicking cropping grids */}
        <div className="relative w-full aspect-video sm:h-[340px] bg-neutral-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center select-none group border border-neutral-100">
          {images.length > 0 ? (
            <>
              {/* Active Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex]}
                alt="Active adjustable adjustment"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />

              {/* Grid overlay mimicking adjustment borders (Mockup 3) */}
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 pointer-events-none">
                {/* Columns */}
                <div className="border-r border-white/20 h-full w-full col-span-1" />
                <div className="border-r border-white/20 h-full w-full col-span-1" />
                <div className="border-r border-white/20 h-full w-full col-span-1" />
                <div className="border-r border-white/20 h-full w-full col-span-1" />
                <div className="col-span-1" />

                {/* Rows are implicitly created by the grid-rows border utilities */}
                <div className="absolute inset-x-0 top-1/3 border-b border-white/20" />
                <div className="absolute inset-x-0 top-2/3 border-b border-white/20" />
              </div>
            </>
          ) : (
            <div className="text-neutral-400 text-sm font-bold">
              No images attached
            </div>
          )}
        </div>

        {/* Upload text block */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
            Upload up to 20 images
          </span>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin select-none">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden cursor-pointer border-2 shrink-0 transition-all ${
                  activeIndex === idx
                    ? "border-[#5D3EBB] scale-[1.03] shadow-xs"
                    : "border-transparent hover:border-neutral-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Delete Thumbnail circle X overlay */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, idx)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 shadow-md hover:scale-105 active:scale-95 transition-all z-10"
                  title="Remove image"
                >
                  <X className="w-2.5 h-2.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomModal>
  );
}
