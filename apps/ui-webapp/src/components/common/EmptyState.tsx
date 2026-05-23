"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  imageSize?: number;
}

/**
 * A standard empty state component with a responsive illustration.
 */
export function EmptyState({
  title = "No data found",
  description = "There are no records to display at the moment.",
  className,
  imageSize = 300,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-8 text-center animate-in fade-in zoom-in duration-500",
        className,
      )}
    >
      <div
        className="relative mb-6"
        style={{
          width: imageSize,
          height: imageSize,
          maxWidth: "100%",
          aspectRatio: "1/1",
        }}
      >
        <Image
          src="/illustrations/no_data.svg"
          alt="No data illustration"
          fill
          className="object-contain"
          priority
        />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2 poppins">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm inter leading-relaxed">
        {description}
      </p>
    </div>
  );
}
