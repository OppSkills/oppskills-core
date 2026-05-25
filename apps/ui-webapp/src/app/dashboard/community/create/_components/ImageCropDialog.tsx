"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  aspectRatio: number; // e.g. 4/1 or 1/1
  onCropComplete: (croppedFile: File) => void;
  title?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.95,
    );
  });
}

export default function ImageCropDialog({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio,
  onCropComplete,
  title = "Crop Image",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixelsData: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsData);
    },
    [],
  );

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filename = `cropped-${Date.now()}.jpg`;
      const croppedFile = new File([croppedBlob], filename, {
        type: "image/jpeg",
      });
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-[95vw] rounded-2xl bg-white p-6 shadow-xl border border-neutral-100 flex flex-col gap-5">
        <DialogHeader className="pb-2 border-b border-neutral-100">
          <DialogTitle className="text-xl font-bold text-neutral-800">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Cropper Container */}
        <div className="relative w-full h-[320px] bg-neutral-950 rounded-xl overflow-hidden shadow-inner">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            classes={{
              containerClassName: "bg-neutral-950 rounded-xl",
            }}
          />
        </div>

        {/* Zoom Slider */}
        <div className="flex flex-col gap-2 px-1">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-500">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#5D3EBB] focus:outline-none"
          />
        </div>

        <DialogFooter className="pt-2 border-t border-neutral-100 flex flex-row items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full border-neutral-300 font-semibold px-5 hover:bg-neutral-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="rounded-full bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-6 shadow-md hover:shadow-lg transition-all duration-300"
          >
            {isProcessing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
