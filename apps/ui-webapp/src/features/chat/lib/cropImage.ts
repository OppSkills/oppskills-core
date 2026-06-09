import {
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";

export type PixelArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplaySize = { width: number; height: number };

/** Match CSS `object-contain` sizing within a bounding box. */
export function getContainedSize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
): DisplaySize {
  if (naturalWidth <= 0 || naturalHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const ratio = naturalWidth / naturalHeight;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/** Default selection covering the full displayed image. */
export const FULL_IMAGE_CROP: Crop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export function toNaturalPixelCrop(
  crop: Crop,
  image: HTMLImageElement,
): PixelCrop {
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

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelArea,
): Promise<Blob> {
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
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.95,
    );
  });
}

export function blobToCroppedFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}-cropped.jpg`, { type: "image/jpeg" });
}
