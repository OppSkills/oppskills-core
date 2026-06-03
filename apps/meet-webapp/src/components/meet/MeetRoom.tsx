"use client";

import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import type { MeetPreviewResponse } from "@oppskills/types";
import MeetHeader, { type LayoutMode } from "./MeetHeader";
import VideoStage from "./VideoStage";
import MeetSidebar from "./MeetSidebar";
import MeetControlBar from "./MeetControlBar";
interface MeetRoomProps {
  token: string;
  serverUrl: string;
  preview: MeetPreviewResponse;
  inviteCode: string;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
  onLeave: () => void;
}

function MeetRoomContent({
  preview,
  inviteCode,
  sidebarOpen,
  onToggleSidebar,
  onLeave,
}: {
  preview: MeetPreviewResponse;
  inviteCode: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLeave: () => void;
}) {
  const room = useRoomContext();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      participant?: { identity: string },
    ) => {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          raised?: boolean;
          emoji?: string;
        };
        if (!participant) return;
        if (parsed.type === "hand") {
          setRaisedHands((prev) => {
            const next = new Set(prev);
            if (parsed.raised) next.add(participant.identity);
            else next.delete(participant.identity);
            return next;
          });
        }
        if (parsed.type === "reaction" && parsed.emoji) {
          setReaction(parsed.emoji);
          window.setTimeout(() => setReaction(null), 2000);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room]);

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    const data = new TextEncoder().encode(
      JSON.stringify({ type: "hand", raised: next }),
    );
    void room.localParticipant.publishData(data, { reliable: true });
    setRaisedHands((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(room.localParticipant.identity);
      else updated.delete(room.localParticipant.identity);
      return updated;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] relative">
      <MeetHeader
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <VideoStage
            layoutMode={layoutMode}
            raisedHands={raisedHands}
            inviteCode={inviteCode}
          />
          {reaction && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce pointer-events-none">
              {reaction}
            </div>
          )}
        </div>
        <MeetSidebar hostUserId={preview.hostUserId} open={sidebarOpen} />
      </div>

      <MeetControlBar
        onLeave={onLeave}
        handRaised={handRaised}
        onToggleHand={toggleHand}
        onReaction={() => undefined}
        onToggleSidebar={onToggleSidebar}
      />
      <RoomAudioRenderer />
    </div>
  );
}

export default function MeetRoom({
  token,
  serverUrl,
  preview,
  inviteCode,
  initialAudioEnabled = true,
  initialVideoEnabled = true,
  onLeave,
}: MeetRoomProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      video={initialVideoEnabled}
      audio={initialAudioEnabled}
      onDisconnected={onLeave}
      className="h-screen"
    >
      <MeetRoomContent
        preview={preview}
        inviteCode={inviteCode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
