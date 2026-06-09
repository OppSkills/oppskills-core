"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  blobToCroppedFile,
  type DisplaySize,
  FULL_IMAGE_CROP,
  getContainedSize,
  getCroppedImageBlob,
  toNaturalPixelCrop,
} from "@/features/chat/lib/cropImage";

type UseChatInlineImageCropOptions = {
  imageSrc: string;
  fileName: string;
  onApply: (file: File) => void;
};

export function useChatInlineImageCrop({
  imageSrc,
  fileName,
  onApply,
}: UseChatInlineImageCropOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [displaySize, setDisplaySize] = useState<DisplaySize | null>(null);
  const [processing, setProcessing] = useState(false);

  const syncDisplaySize = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img?.naturalWidth) return;

    setDisplaySize(
      getContainedSize(
        img.naturalWidth,
        img.naturalHeight,
        container.clientWidth,
        container.clientHeight,
      ),
    );
  }, []);

  useEffect(() => {
    setCrop(undefined);
    setDisplaySize(null);
  }, [imageSrc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => syncDisplaySize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [syncDisplaySize]);

  const onImageLoad = useCallback(() => {
    syncDisplaySize();
    setCrop(FULL_IMAGE_CROP);
  }, [syncDisplaySize]);

  const resetCrop = useCallback(() => {
    setCrop(FULL_IMAGE_CROP);
  }, []);

  const applyCrop = useCallback(async () => {
    const image = imgRef.current;
    if (!crop || !image) return;

    setProcessing(true);
    try {
      const naturalCrop = toNaturalPixelCrop(crop, image);
      const blob = await getCroppedImageBlob(imageSrc, naturalCrop);
      onApply(blobToCroppedFile(blob, fileName));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }, [crop, fileName, imageSrc, onApply]);

  const cropView = (
    <div
      ref={containerRef}
      className="h-full w-full flex items-center justify-center"
    >
      <ReactCrop
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)}
        ruleOfThirds
        keepSelection
        className="[&_img]:max-w-none [&_img]:max-h-none"
      >
        <img
          key={imageSrc}
          ref={imgRef}
          src={imageSrc}
          alt="Crop preview"
          onLoad={onImageLoad}
          className="block"
          style={
            displaySize
              ? {
                  width: displaySize.width,
                  height: displaySize.height,
                  visibility: "visible",
                }
              : { visibility: "hidden", width: 0, height: 0 }
          }
        />
      </ReactCrop>
    </div>
  );

  return {
    cropView,
    cropReady: Boolean(crop && displaySize),
    processing,
    resetCrop,
    applyCrop,
  };
}
