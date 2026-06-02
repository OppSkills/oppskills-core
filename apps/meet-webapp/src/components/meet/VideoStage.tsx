"use client";

import React, { useMemo, useState } from "react";
import {
  useParticipants,
  useSpeakingParticipants,
  ParticipantContext,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MonitorUp } from "lucide-react";
import type { LayoutMode } from "./MeetHeader";
import ParticipantTile from "./ParticipantTile";

const TILES_PER_PAGE = 16;
const CAROUSEL_TILES_PER_PAGE = 6;

interface VideoStageProps {
  layoutMode: LayoutMode;
  raisedHands: Set<string>;
  sidebarOpen: boolean;
}

export default function VideoStage({
  layoutMode,
  raisedHands,
  sidebarOpen,
}: VideoStageProps) {
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();
  const [page, setPage] = useState(0);
  const [carouselPage, setCarouselPage] = useState(0);

  const speakingIds = useMemo(
    () => new Set(speakingParticipants.map((p) => p.identity)),
    [speakingParticipants],
  );
  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  ).filter((track) => track.publication);
  const activeScreenShareTrack =
    screenShareTracks.find((track) => track.participant.isLocal) ??
    screenShareTracks[0];
  type VideoTrackRef = NonNullable<
    React.ComponentProps<typeof VideoTrack>["trackRef"]
  >;
  const activeScreenShareRef: VideoTrackRef | undefined = activeScreenShareTrack
    ? (activeScreenShareTrack as VideoTrackRef)
    : undefined;

  const remoteParticipants = participants.filter((p) => !p.isLocal);
  const localParticipant = participants.find((p) => p.isLocal);
  const screenShareOwnerIdentity = activeScreenShareTrack?.participant.identity;
  const carouselParticipants = participants.filter(
    (participant) =>
      participant.identity !== screenShareOwnerIdentity && !participant.isLocal,
  );
  const effectiveLayout =
    participants.length === 2 ? "spotlight" : layoutMode;
  const totalPages = Math.max(
    1,
    Math.ceil(remoteParticipants.length / TILES_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages - 1);
  const pageParticipants = remoteParticipants.slice(
    safePage * TILES_PER_PAGE,
    safePage * TILES_PER_PAGE + TILES_PER_PAGE,
  );
  const totalCarouselPages = Math.max(
    1,
    Math.ceil(carouselParticipants.length / CAROUSEL_TILES_PER_PAGE),
  );
  const safeCarouselPage = Math.min(carouselPage, totalCarouselPages - 1);
  const pageCarouselParticipants = carouselParticipants.slice(
    safeCarouselPage * CAROUSEL_TILES_PER_PAGE,
    safeCarouselPage * CAROUSEL_TILES_PER_PAGE + CAROUSEL_TILES_PER_PAGE,
  );

  if (activeScreenShareRef && activeScreenShareTrack) {
    const sharerName =
      activeScreenShareTrack.participant.name ||
      activeScreenShareTrack.participant.identity;

    return (
      <div className="flex-1 p-4 min-h-0">
        <div className="relative h-full min-h-0 rounded-2xl overflow-hidden border border-white/15 bg-[#14121c]">
          <VideoTrack
            trackRef={activeScreenShareRef}
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold">
            <MonitorUp className="w-3.5 h-3.5 text-[#b78bff]" />
            {sharerName} is sharing
          </div>

          {carouselParticipants.length > 0 && (
            <div className="absolute left-4 right-4 bottom-4 space-y-2 z-20">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {pageCarouselParticipants.map((participant) => (
                  <ParticipantContext.Provider
                    key={participant.identity}
                    value={participant}
                  >
                    <ParticipantTile
                      isLocal={participant.isLocal}
                      isSpeaking={speakingIds.has(participant.identity)}
                      raisedHand={raisedHands.has(participant.identity)}
                      className="h-24 w-full border border-white/20 bg-black/30 backdrop-blur-sm"
                    />
                  </ParticipantContext.Provider>
                ))}
              </div>

              {totalCarouselPages > 1 && (
                <div className="flex justify-center gap-2 py-1">
                  {Array.from({ length: totalCarouselPages }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCarouselPage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === safeCarouselPage ? "bg-[#835BD5]" : "bg-white/30"
                      }`}
                      aria-label={`Carousel page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {localParticipant && (
            <div
              className={`absolute bottom-4 z-30 ${
                sidebarOpen ? "right-88" : "right-4"
              }`}
            >
              <ParticipantContext.Provider value={localParticipant}>
                <ParticipantTile
                  isLocal
                  isSpeaking={speakingIds.has(localParticipant.identity)}
                  raisedHand={raisedHands.has(localParticipant.identity)}
                  className="w-56 h-32 shadow-lg border border-white/20"
                />
              </ParticipantContext.Provider>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (participants.length === 2 && effectiveLayout === "spotlight") {
    const remote = remoteParticipants[0];
    return (
      <div className="flex-1 p-4 min-h-0 relative">
        {remote && (
          <ParticipantContext.Provider value={remote}>
            <ParticipantTile
              isSpeaking={speakingIds.has(remote.identity)}
              raisedHand={raisedHands.has(remote.identity)}
              className="w-full h-full min-h-0 aspect-auto!"
            />
          </ParticipantContext.Provider>
        )}
        {localParticipant && (
          <div
            className={`absolute bottom-8 z-20 ${
              sidebarOpen ? "right-88" : "right-4"
            }`}
          >
            <ParticipantContext.Provider value={localParticipant}>
              <ParticipantTile
                isLocal
                isSpeaking={speakingIds.has(localParticipant.identity)}
                raisedHand={raisedHands.has(localParticipant.identity)}
                className="w-56 h-32 shadow-lg border border-white/20"
              />
            </ParticipantContext.Provider>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1 min-h-0 auto-rows-fr">
        {pageParticipants.map((participant) => (
          <ParticipantContext.Provider
            key={participant.identity}
            value={participant}
          >
            <ParticipantTile
              isSpeaking={speakingIds.has(participant.identity)}
              raisedHand={raisedHands.has(participant.identity)}
            />
          </ParticipantContext.Provider>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-1">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === safePage ? "bg-[#835BD5]" : "bg-white/30"
              }`}
              aria-label={`Page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {localParticipant && (
        <div
          className={`absolute bottom-4 z-20 ${
            sidebarOpen ? "right-88" : "right-4"
          }`}
        >
          <ParticipantContext.Provider value={localParticipant}>
            <ParticipantTile
              isLocal
              isSpeaking={speakingIds.has(localParticipant.identity)}
              raisedHand={raisedHands.has(localParticipant.identity)}
              className="w-56 h-32 shadow-lg border border-white/20"
            />
          </ParticipantContext.Provider>
        </div>
      )}
    </div>
  );
}
