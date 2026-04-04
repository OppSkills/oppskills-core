"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendEmail } from "@/lib/api/sendEmail";
import { useAuth } from "@clerk/nextjs";

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  eventDetails: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export function ComposeEmailModal({
  isOpen,
  onClose,
  participant,
  eventDetails,
}: ComposeEmailModalProps) {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = async () => {
      const t = await getToken();
      setToken(t);
    };
    a();
  }, []);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!participant || !eventDetails) return;
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsSending(true);
      const result = await sendEmail(token, {
        userId: participant.id,
        email: participant.email,
        firstName: participant.name.split(" ")[0],
        eventId: eventDetails.id,
        eventName: eventDetails.name,
        eventSlug: eventDetails.slug,
        body: message,
      });

      toast.success(result.message || "Email sent successfully!");
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto p-0 rounded-[20px] border-none bg-background scrollbar">
        <div className="flex flex-col p-6 gap-6">
          <DialogHeader>
            <DialogTitle>Message {participant.name}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] resize-none"
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
