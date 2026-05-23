"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShareModal } from "@/components/common/ShareModal";
import { cn } from "@/lib/utils";
import { SquareShareLine } from "@solar-icons/react";

interface ShareButtonProps {
  title: string;
  slug: string;
  type: "hackathon" | "event";
  description?: string;
  className?: string;
  minimal?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  slug,
  type,
  description,
  className,
  minimal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const baseUrl = "https://oppskills.com";
  const path = type === "hackathon" ? "hackathons" : "events";
  const shareLink = `${baseUrl}/${path}/${slug}`;

  // Default templates if description is not provided
  const getTemplate = () => {
    if (description) return description;

    if (type === "hackathon") {
      return `🚀 Ready to innovate? Join me at *${title}* on OppSkills! Let's build something extraordinary together. Check it out here:`;
    } else {
      return `📅 Don't miss out! I'm attending *${title}* on OppSkills. It'll be a great opportunity to learn and network. Register now:`;
    }
  };

  if (minimal) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full h-10 w-10 hover:bg-neutral-100 transition-all active:scale-95",
            className,
          )}
        >
          <SquareShareLine size={24} />
        </Button>

        <ShareModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          title={title}
          description={getTemplate()}
          link={shareLink}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-full shadow-sm hover:shadow-md transition-all active:scale-95",
          className,
        )}
      >
        <Image
          src="/icons/share.svg"
          alt="Share"
          width={16}
          height={16}
          className="mr-2"
        />
        Share
      </Button>

      <ShareModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={title}
        description={getTemplate()}
        link={shareLink}
      />
    </>
  );
};
