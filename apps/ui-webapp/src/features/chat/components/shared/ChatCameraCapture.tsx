"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { X } from "lucide-react";

type ChatCameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function ChatCameraCapture({
  open,
  onClose,
  onCapture,
}: ChatCameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) return;
    fetch(shot)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onClose();
      })
      .catch(console.error);
  }, [onCapture, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button type="button" onClick={onClose} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={() =>
            setFacing((f) => (f === "user" ? "environment" : "user"))
          }
          className="text-sm font-semibold px-3 py-1.5 rounded-full bg-white/15"
        >
          Flip
        </button>
      </div>
      <div className="flex-1 relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: facing }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-8 flex justify-center">
        <button
          type="button"
          onClick={capture}
          className="w-16 h-16 rounded-full border-4 border-white bg-primary-600 shadow-lg"
          aria-label="Take photo"
        />
      </div>
    </div>
  );
}
