"use client";

import React from "react";
import { sendEmail } from "@/lib/api/sendEmail";
import { useAuth } from "@clerk/nextjs";
import RichTextEmailModal from "@/components/modals/RichTextEmailModal";

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface SendParticipantEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  participant: Participant | null;
  eventDetails: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export default function SendParticipantEmailModal({
  isOpen,
  onClose,
  onSuccess,
  participant,
  eventDetails,
}: SendParticipantEmailModalProps) {
  const { getToken } = useAuth();

  const handleSend = async (content: string) => {
    if (!participant || !eventDetails) throw new Error("Missing recipient or event details");
    
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    return sendEmail(token, {
      userId: participant.id,
      email: participant.email,
      firstName: participant.name.split(" ")[0],
      eventId: eventDetails.id,
      eventName: eventDetails.name,
      eventSlug: eventDetails.slug,
      htmlBody: content, // We are sending HTML into the htmlBody field
    });
  };

  if (!participant) return null;

  return (
    <RichTextEmailModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      title={`Message ${participant.name}`}
      description={
        <>
          This message will be sent to <strong>{participant.name}</strong>.
          Personalization (e.g., "Hi {participant.name.split(" ")[0]}") will be applied automatically.
        </>
      }
      templateNote={
        eventDetails && (
          <>
            Your message will be wrapped in the official <strong>{eventDetails.name}</strong> template including links back to the event page.
          </>
        )
      }
      sendFn={handleSend}
    />
  );
}
