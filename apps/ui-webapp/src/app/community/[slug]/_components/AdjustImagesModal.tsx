"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X } from "lucide-react";
import CustomModal from "./CustomModal";
import { Button } from "@/components/ui/button";
import { blobToCroppedFile, getCroppedImageBlob } from "@/lib/chat/cropImage";

interface AdjustImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  onRemoveImage: (index: number) => void;
  onImageCropped: (index: number, croppedObjectUrl: string) => void;
  onContinue: () => void;
}

const FULL_IMAGE_CROP: Crop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

function toNaturalPixelCrop(crop: Crop, image: HTMLImageElement): PixelCrop {
  const displayCrop = convertToPixelCrop(crop, image.width, image.height);
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  return {
    unit: "px",
    x: Math.round(displayCrop.x * scaleX),
    y: Math.round(displayCrop.y * scaleY),
    width: Math.round(displayCrop.width * scaleX),
    height: Math.round(displayCrop.height * scaleY),
  };
}

export default function AdjustImagesModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  onRemoveImage,
  onImageCropped,
  onContinue,
}: AdjustImagesModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [crop, setCrop] = useState<Crop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      setCrop(undefined);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(Math.max(0, images.length - 1));
    }
  }, [images, activeIndex]);

  const onImageLoad = useCallback(() => {
    setCrop(FULL_IMAGE_CROP);
  }, []);

  const handleApplyCrop = async () => {
    const src = images[activeIndex];
    const image = imgRef.current;
    if (!src || !crop || !image) return;

    setIsProcessing(true);
    try {
      const naturalCrop = toNaturalPixelCrop(crop, image);
      const blob = await getCroppedImageBlob(src, naturalCrop);
      const file = blobToCroppedFile(blob, `post-image-${activeIndex}.jpg`);
      const objectUrl = URL.createObjectURL(file);
      onImageCropped(activeIndex, objectUrl);
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onRemoveImage(idx);
  };

  const selectImage = (idx: number) => {
    setActiveIndex(idx);
    setCrop(undefined);
  };

  if (!isOpen) return null;

  const activeSrc = images[activeIndex];

  const footer = (
    <div className="flex items-center gap-3 w-full justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isProcessing}
        className="rounded-full border-neutral-300 font-semibold px-5"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleApplyCrop}
        disabled={isProcessing || !activeSrc || !crop}
        className="rounded-full font-semibold px-5"
      >
        {isProcessing ? "Cropping..." : "Apply Crop"}
      </Button>
      <Button
        onClick={onContinue}
        disabled={isProcessing}
        className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-8 py-2.5 rounded-full text-sm shadow-md active:scale-95 transition-all duration-200"
      >
        Continue
      </Button>
    </div>
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
        <div className="relative w-full min-h-[320px] max-h-[420px] bg-neutral-900 rounded-3xl overflow-hidden shadow-inner border border-neutral-100 flex items-center justify-center">
          {activeSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              ruleOfThirds
              keepSelection
              className="max-h-[420px] [&_.ReactCrop__child-wrapper]:max-h-[420px] [&_img]:max-h-[420px] [&_img]:w-auto [&_img]:object-contain"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={activeSrc}
                ref={imgRef}
                src={activeSrc}
                alt="Crop preview"
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                className="block max-h-[420px] w-auto max-w-full"
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-neutral-400 text-sm font-bold">
              No images attached
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
            Attached images ({images.length})
          </span>
          <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin select-none">
            {images.map((img, idx) => (
              <div
                key={`${idx}-${img.slice(-12)}`}
                onClick={() => selectImage(idx)}
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
