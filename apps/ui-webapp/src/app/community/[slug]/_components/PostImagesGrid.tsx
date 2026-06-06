"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { COMMUNITY_POST_FEED_IMAGE_GRID_VISIBLE } from "@oppskills/types/constants";

interface PostImagesGridProps {
  images: string[];
  onImageClick: (index: number) => void;
  className?: string;
}

function GridCell({
  src,
  alt,
  onClick,
  overlay,
  className,
}: {
  src: string;
  alt: string;
  onClick: () => void;
  overlay?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full min-h-0 cursor-zoom-in overflow-hidden bg-neutral-100",
        className,
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" />
      {overlay ? (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
          <span className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
            {overlay}
          </span>
        </div>
      ) : null}
    </button>
  );
}

export default function PostImagesGrid({
  images,
  onImageClick,
  className,
}: PostImagesGridProps) {
  const count = images.length;
  if (count === 0) return null;

  const wrapper = cn(
    "w-full rounded-2xl overflow-hidden shadow-2xs border border-neutral-100",
    className,
  );

  if (count === 1) {
    return (
      <div className={cn(wrapper, "relative h-64 sm:h-96")}>
        <GridCell
          src={images[0]}
          alt="Post image"
          onClick={() => onImageClick(0)}
          className="absolute inset-0 h-full"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={cn(wrapper, "grid grid-cols-2 gap-1 h-64 sm:h-80")}>
        {images.map((img, index) => (
          <GridCell
            key={img}
            src={img}
            alt={`Post image ${index + 1}`}
            onClick={() => onImageClick(index)}
            className="h-full min-h-32"
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className={cn(wrapper, "grid grid-cols-2 grid-rows-2 gap-1 h-72 sm:h-96")}>
        <GridCell
          src={images[0]}
          alt="Post image 1"
          onClick={() => onImageClick(0)}
          className="row-span-2 h-full min-h-48"
        />
        <GridCell
          src={images[1]}
          alt="Post image 2"
          onClick={() => onImageClick(1)}
          className="h-full min-h-24"
        />
        <GridCell
          src={images[2]}
          alt="Post image 3"
          onClick={() => onImageClick(2)}
          className="h-full min-h-24"
        />
      </div>
    );
  }

  const extraCount = count - COMMUNITY_POST_FEED_IMAGE_GRID_VISIBLE;

  return (
    <div className={cn(wrapper, "grid grid-cols-2 grid-rows-3 gap-1 h-72 sm:h-96")}>
      <GridCell
        src={images[0]}
        alt="Post image 1"
        onClick={() => onImageClick(0)}
        className="row-span-3 h-full min-h-48"
      />
      <GridCell
        src={images[1]}
        alt="Post image 2"
        onClick={() => onImageClick(1)}
        className="h-full min-h-16"
      />
      <GridCell
        src={images[2]}
        alt="Post image 3"
        onClick={() => onImageClick(2)}
        className="h-full min-h-16"
      />
      <GridCell
        src={images[3]}
        alt="Post image 4"
        onClick={() => onImageClick(3)}
        overlay={extraCount > 0 ? `+${extraCount}` : undefined}
        className="h-full min-h-16"
      />
    </div>
  );
}
