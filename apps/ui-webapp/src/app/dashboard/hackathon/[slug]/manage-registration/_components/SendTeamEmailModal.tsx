"use client";

import React from "react";
import { sendTeamEmail } from "@/lib/api/hackathonApi";
import { useAuth } from "@clerk/nextjs";
import RichTextEmailModal from "@/components/modals/RichTextEmailModal";

interface SendTeamEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  hackathonId: string;
  hackathonName: string;
  slug: string;
  onSuccess?: (result: any) => void;
}

export default function SendTeamEmailModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  hackathonId,
  hackathonName,
  slug,
  onSuccess,
}: SendTeamEmailModalProps) {
  const { getToken } = useAuth();

  const handleSend = async (content: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    return sendTeamEmail(token, hackathonId, teamId, {
      teamId,
      htmlBody: content,
      hackathonName,
      slug,
      teamName,
    });
  };

  return (
    <RichTextEmailModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send Email to ${teamName}`}
      description={
        <>
          This message will be sent to <strong>all members</strong> of the team in {hackathonName}.
          Individual personalization (e.g., "Hi [FirstName]") will be applied automatically.
        </>
      }
      templateNote={
        <>
          Your message will be wrapped in the official <strong>{hackathonName}</strong> template including links back to the hackathon page.
        </>
      }
      sendFn={handleSend}
      onSuccess={onSuccess}
    />
  );
}
