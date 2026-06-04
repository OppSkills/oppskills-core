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
import { useCameraTrackDimensions } from "@/hooks/useCameraTrackDimensions";

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
  const dimensions = useCameraTrackDimensions(participant);
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

  const videoAspectRatio =
    dimensions && dimensions.width > 0 && dimensions.height > 0
      ? `${dimensions.width} / ${dimensions.height}`
      : "16 / 9";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#1a1525] w-full h-full min-h-0 flex items-center justify-center",
        isSpeaking && "ring-2 ring-[#835BD5] ring-offset-2 ring-offset-[#0a0a0f]",
        className,
      )}
    >
      {videoTrackRef && !isCameraOff ? (
        <div
          className="relative flex max-h-full max-w-full items-center justify-center"
          style={{ aspectRatio: videoAspectRatio }}
        >
          <VideoTrack
            trackRef={videoTrackRef}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#271B40] to-[#14121c]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#835BD5]/30 text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {audioTrackRef && <AudioTrack trackRef={audioTrackRef} />}

      {raisedHand && (
        <div className="absolute top-2 right-2 rounded-full bg-amber-400 p-1.5 text-black">
          <Hand className="h-3.5 w-3.5" />
        </div>
      )}

      {isLocal ? (
        <>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="truncate rounded-md bg-black/60 px-2 py-1 text-xs font-semibold">
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
            <span className="max-w-full truncate rounded-md bg-black/60 px-2 py-1 text-xs font-semibold">
              {firstName}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex items-center justify-between gap-2">
            <ParticipantMicCameraStatus
              isMuted={isMuted}
              isCameraOff={isCameraOff}
            />
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
      <MicOff className="h-3.5 w-3.5 text-red-400" />
    ) : (
      <Mic className="h-3.5 w-3.5 text-emerald-400" />
    );
  }
  return isMuted ? (
    <VideoOff className="h-3.5 w-3.5 text-red-400" />
  ) : (
    <Video className="h-3.5 w-3.5 text-emerald-400" />
  );
}
