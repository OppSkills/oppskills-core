"use client";

import { useState } from "react";

export function useImageGallery() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);

  return {
    showImageModal,
    setShowImageModal,
    activeModalImageIndex,
    setActiveModalImageIndex,
  };
}
