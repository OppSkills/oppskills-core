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
  IconBrandLinkedin,
  IconBrandX,
  IconFlame,
  IconCopy,
  IconShare,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";

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
  const [showFireIcon, setShowFireIcon] = useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setShowFireIcon((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const shareOptions = [
    {
      name: "LinkedIn",
      isHot: true,
      icon: (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {showFireIcon ? (
              <motion.div
                key="fire"
                initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 15 }}
                transition={{ duration: 0.3 }}
              >
                <IconFlame className="w-6 h-6 text-orange-500 fill-orange-500" />
              </motion.div>
            ) : (
              <motion.div
                key="linkedin"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <IconBrandLinkedin className="w-6 h-6 text-[#0A66C2]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
      onClick: async () => {
        const caption = `Another step forward 🚀\n\nJoined ${title} to level up my skills and work on real challenges.\nLet’s see where this goes 👀\n\n#KeepBuilding #NextLevel`;
        try {
          await navigator.clipboard.writeText(caption);
          toast.success("Caption copied! You can now paste it on LinkedIn.");
        } catch (err) {
          console.error("Failed to copy caption:", err);
        }
        setTimeout(() => {
          const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
          window.open(url, "_blank");
        }, 1000);
      },
    },
    {
      name: "X",
      icon: <IconBrandX className="w-6 h-6" />,
      onClick: () => {
        const safeDescription = description || "Check this out on OppSkills!";
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(safeDescription)}&url=${encodeURIComponent(link)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "WhatsApp",
      icon: <IconBrandWhatsapp className="w-6 h-6" />,
      onClick: () => {
        const safeDescription = description || "Check this out on OppSkills!";
        const url = `https://wa.me/?text=${encodeURIComponent(`${safeDescription}\n\n${link}`)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Other",
      icon: <IconShare className="w-6 h-6" />,
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
      <DialogContent showCloseButton={false} className="max-w-[90vw] sm:max-w-sm p-0 overflow-hidden border-none bg-background rounded-3xl!">
        <div className="relative">
          <DialogHeader className="mb-6 bg-neutral-300 px-6 py-4 flex flex-row justify-between items-center">
            <div className="flex justify-between items-start w-full">
              <div className="space-y-1 flex flex-row justify-between items-center w-full">
                <DialogTitle className="text-2xl font-medium text-neutral-900 font-sans! m-0">
                  Share {title}
                </DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-neutral-100 transition-all active:scale-95">
                    <IconX size={24} />
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          {/* Share Grid */}
          <div className="grid grid-cols-4 gap-4 px-4 sm:px-6">
            {shareOptions.map((option) => (
              <div key={option.name} className="flex w-full flex-col gap-2 justify-center items-center group cursor-pointer relative" onClick={option.onClick}>
                {"isHot" in option && option.isHot && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: 1 
                    }}
                    transition={{
                      scale: {
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut"
                      },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute -top-1 -right-1 z-10 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-[10px] font-bold text-white shadow-sm border border-white/20"
                  >
                    HOT
                  </motion.div>
                )}
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-neutral-200 border border-neutral-200 group-hover:border-primary transition-colors group-hover:bg-primary/10 text-neutral-700">
                  {option.icon}
                </div>
                <p className="text-sm font-medium text-neutral-900 group-hover:text-primary transition-colors">{option.name}</p>
              </div>
            ))}
          </div>

          {/* Link Display Section */}
          <div className="mt-8 space-y-3 px-6 pb-6">
            <p className="text-base text-neutral-900">
              Copy Link
            </p>
            <div className="flex items-center gap-2 p-2 rounded-full border bg-neutral-50 hover:bg-neutral-100 transition-colors group">
              <input type="text" readOnly value={link} className="flex-1 text-neutral-600 px-2 bg-transparent text-sm outline-none border-0 outline-0 truncate" />
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
