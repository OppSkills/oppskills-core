"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandFacebook,
  IconCopy,
  IconShare,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  link: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onOpenChange,
  title,
  description = "Check this out on OppSkills!",
  link,
}) => {
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <IconBrandWhatsapp className="w-6 h-6" />,
      color: "bg-[#25D366]",
      hoverColor: "hover:bg-[#20bd5a]",
      onClick: () => {
        const safeDescription = description || "Check this out on OppSkills!";
        const url = `https://wa.me/?text=${encodeURIComponent(`${safeDescription}\n\n${link}`)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Twitter",
      icon: <IconBrandX className="w-5 h-5" />,
      color: "bg-black",
      hoverColor: "hover:bg-neutral-800",
      onClick: () => {
        const safeDescription = description || "Check this out on OppSkills!";
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(safeDescription)}&url=${encodeURIComponent(link)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Facebook",
      icon: <IconBrandFacebook className="w-6 h-6" />,
      color: "bg-[#1877F2]",
      hoverColor: "hover:bg-[#166fe5]",
      onClick: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Other",
      icon: <IconShare className="w-5 h-5" />,
      color: "bg-neutral-600",
      hoverColor: "hover:bg-neutral-700",
      onClick: async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: description,
              url: link,
            });
            onOpenChange(false);
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              toast.error("Sharing failed");
            }
          }
        } else {
          toast.info("Native sharing is not supported on this browser.");
        }
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-background rounded-3xl">
        <div className="relative p-6 sm:p-8">
          {/* Header with gradient background hint */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
          
          <DialogHeader className="mb-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold aeonicPro">
                  Share this {title?.includes("Hackathon") ? "Hackathon" : "Event"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground urbanist">
                  Spread the word and invite your friends!
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Share Grid */}
          <div className="grid grid-cols-2 gap-4">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                onClick={option.onClick}
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center gap-3 h-28 rounded-2xl border border-neutral-200 bg-neutral-50/50 transition-all duration-300",
                  "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full text-white shadow-md transition-transform duration-300",
                    option.color,
                    "group-hover:scale-110"
                  )}
                >
                  {option.icon}
                </div>
                <span className="text-sm font-medium urbanist">
                  {option.name}
                </span>
              </Button>
            ))}
          </div>

          {/* Link Display Section */}
          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider urbanist">
              Or copy link
            </p>
            <div className="flex items-center gap-2 p-2 rounded-xl border bg-neutral-50 hover:bg-neutral-100 transition-colors group">
              <input
                readOnly
                value={link}
                className="flex-1 bg-transparent px-2 text-sm text-neutral-600 outline-none truncate urbanist"
              />
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg h-8 px-3 hover:bg-primary/10 text-primary transition-colors"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    toast.success("Link copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    toast.error("Failed to copy link");
                  }
                }}
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
