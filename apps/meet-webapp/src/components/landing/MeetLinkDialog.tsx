"use client";

import React from "react";
import { Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MeetLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  meetUrl: string;
  autoOpen?: boolean;
}

export default function MeetLinkDialog({
  open,
  onOpenChange,
  title,
  meetUrl,
  autoOpen = false,
}: MeetLinkDialogProps) {
  const openedRef = React.useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen && autoOpen && !openedRef.current) {
      openedRef.current = true;
      window.location.href = meetUrl;
    }
    if (!nextOpen) openedRef.current = false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetUrl);
      toast.success("Meet link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => handleOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meet-link-dialog-title"
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-white/10",
          "bg-[#14121c] p-6 shadow-2xl",
        )}
      >
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="meet-link-dialog-title"
          className="pr-8 text-lg font-semibold tracking-tight text-white"
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-white/50">
          Share this link with community members.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <input
            readOnly
            value={meetUrl}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#835BD5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9470e0]"
            >
              <Copy className="h-4 w-4" />
              Copy link
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = meetUrl;
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
              Join now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
