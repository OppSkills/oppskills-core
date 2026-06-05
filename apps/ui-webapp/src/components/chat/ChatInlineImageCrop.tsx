"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Crop } from "lucide-react";
import { blobToCroppedFile, getCroppedImageBlob } from "@/lib/chat/cropImage";

type ChatInlineImageCropProps = {
  imageSrc: string;
  fileName: string;
  onApply: (file: File) => void;
  onCancel: () => void;
};

export function ChatInlineImageCrop({
  imageSrc,
  fileName,
  onApply,
  onCancel,
}: ChatInlineImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsData: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onApply(blobToCroppedFile(blob, fileName));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div className="relative flex-1 min-h-0 bg-neutral-950">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={false}
          classes={{
            containerClassName: "bg-neutral-950",
            cropAreaClassName: "!border-2 !border-white/90",
          }}
        />
      </div>

      <div className="shrink-0 flex items-center justify-center gap-6 py-4 bg-white border-t border-neutral-200">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => void handleDone()}
          disabled={processing || !croppedAreaPixels}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          <Crop className="w-4 h-4" />
          {processing ? "Applying…" : "Done"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-neutral-500 hover:text-neutral-800 ml-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
