"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import type { MeetJoinTokenResponse, MeetPreviewResponse } from "@oppskills/types";
import { getMeetJoinToken, getMeetPreview } from "@/lib/api/meetApi";
import MeetRoom from "@/components/meet/MeetRoom";

type PageState =
  | { phase: "loading" }
  | { phase: "lobby"; preview: MeetPreviewResponse }
  | {
      phase: "room";
      preview: MeetPreviewResponse;
      join: MeetJoinTokenResponse;
    }
  | { phase: "left" }
  | { phase: "error"; message: string };

export default function MeetPageClient({ inviteCode }: { inviteCode: string }) {
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setState({ phase: "error", message: "Please sign in to join." });
          }
          return;
        }
        const preview = await getMeetPreview(token, inviteCode);
        if (!cancelled) {
          setState({ phase: "lobby", preview });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            phase: "error",
            message:
              error instanceof Error ? error.message : "Failed to load meeting",
          });
        }
      }
    }
    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [getToken, inviteCode, isLoaded]);

  const handleJoin = async () => {
    if (state.phase !== "lobby") return;
    setIsJoining(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to join");
        return;
      }
      const join = await getMeetJoinToken(token, inviteCode);
      setState({ phase: "room", preview: state.preview, join });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not join meeting",
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (state.phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#835BD5]" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Unable to join</h1>
          <p className="text-white/60">{state.message}</p>
        </div>
      </div>
    );
  }

  if (state.phase === "left") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">You left the meeting</h1>
          <p className="text-white/60">
            You can close this tab or rejoin using the same link.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-[#835BD5] hover:bg-[#6f4bc0] font-semibold"
          >
            Rejoin
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "room") {
    return (
      <MeetRoom
        token={state.join.token}
        serverUrl={state.join.livekitUrl}
        preview={state.preview}
        onLeave={() => setState({ phase: "left" })}
      />
    );
  }

  const { preview } = state;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#14121c] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#835BD5]/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-[#835BD5]" />
          </div>
          <div>
            <p className="text-sm text-white/50">{preview.communityName}</p>
            <h1 className="text-2xl font-bold">{preview.title}</h1>
          </div>
        </div>

        {preview.description && (
          <p className="text-white/70 text-sm leading-relaxed">
            {preview.description}
          </p>
        )}

        <div className="text-sm text-white/50 space-y-1">
          <p>Host: {preview.hostName}</p>
          {preview.scheduledStartAt && (
            <p>
              Scheduled:{" "}
              {new Date(preview.scheduledStartAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={isJoining}
          onClick={() => void handleJoin()}
          className="w-full py-4 rounded-full bg-[#835BD5] hover:bg-[#6f4bc0] font-bold text-lg transition-colors disabled:opacity-60"
        >
          {isJoining ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Joining...
            </span>
          ) : (
            "Join meeting"
          )}
        </button>
      </div>
    </div>
  );
}
