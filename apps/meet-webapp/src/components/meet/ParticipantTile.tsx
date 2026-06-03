"use client";

import React from "react";
import {
  useParticipantContext,
  VideoTrack,
  AudioTrack,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantTileProps {
  isSpeaking?: boolean;
  isLocal?: boolean;
  raisedHand?: boolean;
  className?: string;
}

export default function ParticipantTile({
  isSpeaking = false,
  isLocal = false,
  raisedHand = false,
  className,
}: ParticipantTileProps) {
  const participant = useParticipantContext();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  ).filter((track) => track.participant.identity === participant.identity);

  const cameraTrack = tracks.find(
    (track) => track.source === Track.Source.Camera,
  );
  const audioTrack = tracks.find(
    (track) => track.source === Track.Source.Microphone,
  );
  type VideoTrackRef = NonNullable<
    React.ComponentProps<typeof VideoTrack>["trackRef"]
  >;
  const videoTrackRef: VideoTrackRef | undefined =
    cameraTrack && cameraTrack.publication
      ? (cameraTrack as VideoTrackRef)
      : undefined;
  const audioTrackRef: VideoTrackRef | undefined =
    audioTrack && audioTrack.publication
      ? (audioTrack as VideoTrackRef)
      : undefined;
  const displayName = participant.name || participant.identity;
  const firstName = displayName.trim().split(" ")[0] || displayName;
  const isMuted = !participant.isMicrophoneEnabled;
  const isCameraOff = !participant.isCameraEnabled;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#1a1525] aspect-video",
        isSpeaking && "ring-2 ring-[#835BD5] ring-offset-2 ring-offset-[#0a0a0f]",
        className,
      )}
    >
      {videoTrackRef && !isCameraOff ? (
        <VideoTrack
          trackRef={videoTrackRef}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#271B40] to-[#14121c]">
          <div className="w-16 h-16 rounded-full bg-[#835BD5]/30 flex items-center justify-center text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {audioTrackRef && <AudioTrack trackRef={audioTrackRef} />}

      {raisedHand && (
        <div className="absolute top-2 right-2 bg-amber-400 text-black rounded-full p-1.5">
          <Hand className="w-3.5 h-3.5" />
        </div>
      )}

      {isLocal ? (
        <>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-xs font-semibold bg-black/60 px-2 py-1 rounded-md truncate">
            {firstName} (You)
          </span>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <StatusIcon isMuted={isCameraOff} isMic={false} />
          <StatusIcon isMuted={isMuted} isMic />
        </div>
        </>
        
      ) : (
        <>
          <div className="absolute bottom-2 left-2 right-2 flex items-center">
            <span className="text-xs font-semibold bg-black/60 px-2 py-1 rounded-md truncate max-w-full">
              {firstName}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex items-center justify-between gap-2">
            <ParticipantMicCameraStatus isMuted={isMuted} isCameraOff={isCameraOff} />
          </div>
        </>
   
      )}
    </div>
  );
}

function ParticipantMicCameraStatus({
  isMuted,
  isCameraOff,
}: {
  isMuted: boolean;
  isCameraOff: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <StatusIcon isMuted={isMuted} isMic />
      <StatusIcon isMuted={isCameraOff} isMic={false} />
    </div>
  );
}

function StatusIcon({
  isMuted,
  isMic,
}: {
  isMuted: boolean;
  isMic: boolean;
}) {
  if (isMic) {
    return isMuted ? (
      <MicOff className="w-3.5 h-3.5 text-red-400" />
    ) : (
      <Mic className="w-3.5 h-3.5 text-emerald-400" />
    );
  }
  return isMuted ? (
    <VideoOff className="w-3.5 h-3.5 text-red-400" />
  ) : (
    <Video className="w-3.5 h-3.5 text-emerald-400" />
  );
}
