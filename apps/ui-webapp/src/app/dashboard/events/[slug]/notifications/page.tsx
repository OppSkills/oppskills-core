"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getEventBySlug } from "@/lib/api/eventApi";
import { SendNotification } from "@/components/common/SendNotification";

export default function NotificationsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { getToken } = useAuth();

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  useEffect(() => {
    const fetchEventId = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const eventData: any = await getEventBySlug(token, slug);
        if (eventData && eventData.id) {
          setEventId(eventData.id);
          setEventName(eventData.name || "Event");
          if (eventData.eventTimeTo) {
            setEventEndDate(new Date(eventData.eventTimeTo));
          } else if (eventData.endDate) {
            setEventEndDate(new Date(eventData.endDate));
          }
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

  if (fetchingEvent) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SendNotification
      type="event"
      id={eventId}
      name={eventName}
      endDate={eventEndDate}
    />
  );
}
