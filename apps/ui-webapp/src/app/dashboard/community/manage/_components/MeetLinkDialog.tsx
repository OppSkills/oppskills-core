"use client";

import React from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Prefer handling open actions where the event occurs instead of faking
  // an event with an effect. Use the dialog's `onOpenChange` event to
  // perform the side-effect immediately when the dialog opens.
  const handleDialogOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && autoOpen && !openedRef.current) {
      openedRef.current = true;
      window.open(meetUrl, "_blank", "noopener,noreferrer");
    }
    if (!newOpen) openedRef.current = false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetUrl);
      toast.success("Meet link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-aeonicPro text-xl">{title}</DialogTitle>
          <DialogDescription>
            Share this link with community members. Anyone signed in to
            OppSkills can join.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            readOnly
            value={meetUrl}
            className="h-11 rounded-xl font-medium"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              className="rounded-full bg-[#271B40] hover:bg-[#423072] flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full flex-1"
              onClick={() =>
                window.open(meetUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Join now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
