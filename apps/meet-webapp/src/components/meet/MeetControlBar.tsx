"use client";

import React, { useEffect, useState } from "react";
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
  Loader2,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MeetControlBarProps {
  onToggleSidebar: () => void;
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
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
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
  onToggleSidebar,
  onLeave,
  handRaised,
  onToggleHand,
  onReaction,
}: MeetControlBarProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const micEnabled = localParticipant.isMicrophoneEnabled;
  const camEnabled = localParticipant.isCameraEnabled;
  const [isScreenShareUpdating, setIsScreenShareUpdating] = useState(false);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camEnabled);
  };

  const toggleScreenShare = async () => {
    const nextEnabled = !localParticipant.isScreenShareEnabled;
    if (!nextEnabled) {
      const confirmed = window.confirm(
        "Are you sure you want to stop sharing your screen?",
      );
      if (!confirmed) return;
    }

    setIsScreenShareUpdating(true);
    try {
      await localParticipant.setScreenShareEnabled(nextEnabled);
      toast.success(nextEnabled ? "Screen sharing started" : "Screen sharing stopped");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not change screen sharing state",
      );
    } finally {
      setIsScreenShareUpdating(false);
    }
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
        active={localParticipant.isScreenShareEnabled || isScreenShareUpdating}
        disabled={isScreenShareUpdating}
        onClick={() => void toggleScreenShare()}
        title={
          isScreenShareUpdating
            ? "Updating screen sharing..."
            : localParticipant.isScreenShareEnabled
              ? "Stop sharing screen"
              : "Share screen"
        }
      >
        {isScreenShareUpdating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <MonitorUp
            className={cn(
              "w-5 h-5",
              localParticipant.isScreenShareEnabled && "text-emerald-300",
            )}
          />
        )}
      </ControlButton>

      <ControlButton
        onClick={() => {
          onToggleSidebar();
        }}
        title="Open side panel"
      >
        <PanelLeft className="w-5 h-5 opacity-40" />
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
