"use client";

import React from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Hand,
  Smile,
  CircleDot,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetControlBarProps {
  onLeave: () => void;
  handRaised: boolean;
  onToggleHand: () => void;
  onReaction: (emoji: string) => void;
}

function ControlButton({
  active,
  onClick,
  children,
  title,
  danger,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
        danger
          ? "bg-red-600 hover:bg-red-500 text-white"
          : active
            ? "bg-[#835BD5] text-white"
            : "bg-white/10 hover:bg-white/20 text-white",
      )}
    >
      {children}
    </button>
  );
}

export default function MeetControlBar({
  onLeave,
  handRaised,
  onToggleHand,
  onReaction,
}: MeetControlBarProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const micEnabled = localParticipant.isMicrophoneEnabled;
  const camEnabled = localParticipant.isCameraEnabled;

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camEnabled);
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(
      !localParticipant.isScreenShareEnabled,
    );
  };

  const publishData = (payload: Record<string, unknown>) => {
    const data = new TextEncoder().encode(JSON.stringify(payload));
    void room.localParticipant.publishData(data, { reliable: true });
  };

  return (
    <footer className="h-20 shrink-0 border-t border-white/10 bg-[#0c0114]/95 px-4 flex items-center justify-center gap-3">
      <ControlButton
        active={micEnabled}
        onClick={() => void toggleMic()}
        title={micEnabled ? "Mute" : "Unmute"}
      >
        {micEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </ControlButton>

      <ControlButton
        active={camEnabled}
        onClick={() => void toggleCam()}
        title={camEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {camEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </ControlButton>

      <ControlButton
        active={localParticipant.isScreenShareEnabled}
        onClick={() => void toggleScreenShare()}
        title="Share screen"
      >
        <MonitorUp className="w-5 h-5" />
      </ControlButton>

      <ControlButton
        onClick={() => undefined}
        title="Recording coming soon"
      >
        <CircleDot className="w-5 h-5 opacity-40" />
      </ControlButton>

      <ControlButton
        active={handRaised}
        onClick={onToggleHand}
        title="Raise hand"
      >
        <Hand className="w-5 h-5" />
      </ControlButton>

      <ControlButton
        onClick={() => {
          onReaction("👍");
          publishData({ type: "reaction", emoji: "👍" });
        }}
        title="Send reaction"
      >
        <Smile className="w-5 h-5" />
      </ControlButton>

      <ControlButton onClick={onLeave} title="Leave meeting" danger>
        <PhoneOff className="w-5 h-5" />
      </ControlButton>
    </footer>
  );
}
