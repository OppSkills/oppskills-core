"use client";

import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getDisplayUrl } from "./communityUtils";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
}: ImageLightboxProps) {
  // Keypress event navigation (Arrow keys to navigate, Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        handlePrev();
      } else if (e.key === "ArrowRight" && images.length > 1) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    onIndexChange(prevIndex);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextIndex = (currentIndex + 1) % images.length;
    onIndexChange(nextIndex);
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Top Right Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all z-50 duration-200"
        title="Close Lightbox"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Left Chevron Controller */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all z-50 duration-200"
          title="Previous Image"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>
      )}

      {/* Full Size Image */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing lightbox when clicking on the image itself
      >
        {/* We use an standard img tag for fluid responsive lightbox sizing */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getDisplayUrl(images[currentIndex])}
          alt={`Preview image ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl select-none"
          draggable="false"
        />
      </div>

      {/* Right Chevron Controller */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all z-50 duration-200"
          title="Next Image"
        >
          <ChevronRight className="w-6 h-6 stroke-[3]" />
        </button>
      )}
    </div>
  );
}
