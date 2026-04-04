"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { Loader2, Mail } from "lucide-react";

interface RichTextEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  templateNote?: React.ReactNode;
  sendFn: (content: string) => Promise<{ message?: string; [key: string]: any }>;
  onSuccess?: (result: any) => void;
  successMessage?: string;
}

export default function RichTextEmailModal({
  isOpen,
  onClose,
  title,
  description,
  templateNote,
  sendFn,
  onSuccess,
  successMessage = "Email sent successfully!",
}: RichTextEmailModalProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!content || content === "<p></p>") {
      toast.error("Please enter a message to send.");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendFn(content);
      toast.success(result.message || successMessage);
      if (onSuccess) onSuccess(result);
      onClose();
      setContent(""); // Clear content for next use
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send email"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSending && !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto flex flex-col gap-6 scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1">
          {templateNote && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Email Template Note:</p>
              {templateNote}
            </div>
          )}

          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your custom message here..."
            className="min-h-[300px]"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="rounded-full px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !content || content === "<p></p>"}
            className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
