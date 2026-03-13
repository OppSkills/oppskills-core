"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { Send, Bell, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getEventBySlug } from "@/lib/api/eventApi";
import { sendBulkEmail } from "@/lib/api/sendEmail";

export default function NotificationsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { getToken } = useAuth();

  const [message, setMessage] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEventId = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const eventData: any = await getEventBySlug(token, slug);
        if (eventData && eventData.id) {
          setEventId(eventData.id);
        } else {
          toast.error("Could not load event details.");
        }
      } catch (error) {
        console.error("Failed to fetch event", error);
        toast.error("Failed to load event details.");
      } finally {
        setFetchingEvent(false);
      }
    };

    if (slug) {
      fetchEventId();
    }
  }, [slug, getToken]);

  const handleSend = async () => {
    if (!message || message === "<p></p>") {
      toast.error("Please enter a message body");
      return;
    }
    if (!eventId) {
      toast.error("Event ID not found. Please refresh.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      await sendBulkEmail(token, {
        eventId,
        htmlBody: message
      });

      setSuccess(true);
      setMessage("");
      toast.success("Broadcast initiated successfully!");
    } catch (error) {
      console.error("Failed to send broadcast", error);
      toast.error("Failed to send broadcast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full bg-neutral-200 min-h-screen p-6 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-md bg-background rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-poppins text-neutral-800">Broadcast Initiated!</h2>
          <p className="text-muted-foreground">
            Your email broadcast has been queued and will be circulated to all registered participants shortly.
          </p>
          <div className="text-sm bg-neutral-50 p-4 rounded-lg border border-neutral-100 w-full mt-2">
            <p className="font-medium text-neutral-700">What happens next?</p>
            <p className="text-neutral-500 mt-1">You will receive a confirmation email with the final delivery metrics once the process is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-200 min-h-screen p-6 flex flex-col items-center gap-6">
      <div className="w-full max-w-4xl bg-background rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        {/* INFO BANNER */}
        <div className="flex items-center gap-3 p-4 w-full rounded-lg border border-blue-500/30 bg-blue-500/10">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-blue-700">
              Broadcast Mode
            </span>
            <span className="text-xs text-blue-600">
              Your message will be sent to <strong>ALL</strong> registered attendees and participants of this event.
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold font-poppins">
              Send Broadcast Notification
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Compose your email update below. This will be sent as a direct email to all users associated with this event.
          </p>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Body</label>
            <RichTextEditor
              placeholder="Type your broadcast message here..."
              value={message}
              onChange={(content) => setMessage(content)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={handleSend}
              disabled={loading || !eventId}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Broadcast to All Users
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
