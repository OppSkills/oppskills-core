"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useParticipants,
  useSpeakingParticipants,
  ParticipantContext,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import { MonitorUp } from "lucide-react";
import type { LayoutMode } from "./MeetHeader";
import ParticipantTile from "./ParticipantTile";
import EmptyRoomState from "./EmptyRoomState";
import StagePagination from "./StagePagination";
import DraggableLocalPip from "./DraggableLocalPip";
import { useViewportLayout } from "@/hooks/useViewportLayout";
import { getGridDimensions } from "@/lib/meet/gridLayout";

const SCREEN_SHARE_CAROUSEL_PER_PAGE = 6;

type StageParticipant = Participant;

interface VideoStageProps {
  layoutMode: LayoutMode;
  raisedHands: Set<string>;
  inviteCode: string;
  isMobile?: boolean;
}

const MOBILE_CONTROL_BAR_INSET = 80;

function sortForGrid(participants: StageParticipant[]): StageParticipant[] {
  return [...participants]
    .filter((p) => !p.isLocal)
    .sort((a, b) =>
      (a.name || a.identity).localeCompare(b.name || b.identity),
    );
}

function LocalParticipantPip({
  localParticipant,
  speakingIds,
  raisedHands,
  isMobile = false,
  className = "absolute bottom-2 z-30 right-6",
}: {
  localParticipant: StageParticipant;
  speakingIds: Set<string>;
  raisedHands: Set<string>;
  isMobile?: boolean;
  className?: string;
}) {
  if (isMobile) {
    return (
      <DraggableLocalPip
        localParticipant={localParticipant}
        speakingIds={speakingIds}
        raisedHands={raisedHands}
        bottomInset={MOBILE_CONTROL_BAR_INSET}
      />
    );
  }

  return (
    <div className={className}>
      <ParticipantTileWrapped
        participant={localParticipant}
        speakingIds={speakingIds}
        raisedHands={raisedHands}
        isLocal
        className="w-40 h-24 sm:w-48 sm:h-28 md:w-56 md:h-32 shadow-lg border border-white/20 aspect-auto!"
      />
    </div>
  );
}

function ParticipantTileWrapped({
  participant,
  speakingIds,
  raisedHands,
  isLocal,
  className,
  onSelect,
}: {
  participant: StageParticipant;
  speakingIds: Set<string>;
  raisedHands: Set<string>;
  isLocal?: boolean;
  className?: string;
  onSelect?: () => void;
}) {
  const tile = (
    <ParticipantContext.Provider value={participant}>
      <ParticipantTile
        isLocal={isLocal ?? participant.isLocal}
        isSpeaking={speakingIds.has(participant.identity)}
        raisedHand={raisedHands.has(participant.identity)}
        className={className}
      />
    </ParticipantContext.Provider>
  );

  if (!onSelect) return tile;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="min-w-0 min-h-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#835BD5]"
      aria-label={`Focus on ${participant.name || participant.identity}`}
    >
      {tile}
    </button>
  );
}

function GridLayoutView({
  participants,
  localParticipant,
  speakingIds,
  raisedHands,
  maxCols,
  tilesPerPage,
  isMobile,
}: {
  participants: StageParticipant[];
  localParticipant?: StageParticipant;
  speakingIds: Set<string>;
  raisedHands: Set<string>;
  maxCols: number;
  tilesPerPage: number;
  isMobile?: boolean;
}) {
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => sortForGrid(participants), [participants]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / tilesPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const pageParticipants = sorted.slice(
    safePage * tilesPerPage,
    safePage * tilesPerPage + tilesPerPage,
  );
  const gridDimensions = useMemo(
    () => getGridDimensions(pageParticipants.length, maxCols),
    [pageParticipants.length, maxCols],
  );

  useEffect(() => {
    setPage(0);
  }, [sorted.length, tilesPerPage]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  return (
    <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 relative">
      <div
        className="flex-1 min-h-0 grid gap-2 sm:gap-3 [direction:rtl]"
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridDimensions.rows}, minmax(0, 1fr))`,
        }}
      >
        {pageParticipants.map((participant) => (
          <ParticipantTileWrapped
            key={participant.identity}
            participant={participant}
            speakingIds={speakingIds}
            raisedHands={raisedHands}
            className="w-full h-full min-h-0 aspect-auto! [direction:ltr]"
          />
        ))}
      </div>
      <StagePagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        label="Grid pages"
      />
      {localParticipant && (
        <LocalParticipantPip
          localParticipant={localParticipant}
          speakingIds={speakingIds}
          raisedHands={raisedHands}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function SpotlightLayoutView({
  remoteParticipants,
  localParticipant,
  speakingParticipants,
  speakingIds,
  raisedHands,
  filmstripPerPage,
  isMobile,
}: {
  remoteParticipants: StageParticipant[];
  localParticipant?: StageParticipant;
  speakingParticipants: StageParticipant[];
  speakingIds: Set<string>;
  raisedHands: Set<string>;
  filmstripPerPage: number;
  isMobile?: boolean;
}) {
  const [spotlightIdentity, setSpotlightIdentity] = useState<string | null>(
    null,
  );
  const [filmstripPage, setFilmstripPage] = useState(0);
  const manualSpotlightRef = useRef(false);

  const dominantSpeaker = useMemo(
    () =>
      speakingParticipants.find((p) => !p.isLocal) ?? speakingParticipants[0],
    [speakingParticipants],
  );

  useEffect(() => {
    const stillPresent =
      spotlightIdentity &&
      remoteParticipants.some((p) => p.identity === spotlightIdentity);
    if (stillPresent) return;

    const fallback = dominantSpeaker ?? remoteParticipants[0];
    if (fallback) {
      setSpotlightIdentity(fallback.identity);
      manualSpotlightRef.current = false;
    }
  }, [remoteParticipants, dominantSpeaker, spotlightIdentity]);

  useEffect(() => {
    if (!dominantSpeaker) return;
    if (manualSpotlightRef.current) {
      if (dominantSpeaker.identity !== spotlightIdentity) {
        manualSpotlightRef.current = false;
      }
      return;
    }
    setSpotlightIdentity(dominantSpeaker.identity);
  }, [dominantSpeaker?.identity, spotlightIdentity]);

  const spotlightParticipant = useMemo(
    () =>
      remoteParticipants.find((p) => p.identity === spotlightIdentity) ??
      dominantSpeaker ??
      remoteParticipants[0],
    [remoteParticipants, spotlightIdentity, dominantSpeaker],
  );

  const filmstripParticipants = useMemo(
    () =>
      remoteParticipants.filter(
        (p) => p.identity !== spotlightParticipant?.identity,
      ),
    [remoteParticipants, spotlightParticipant?.identity],
  );

  const filmstripTotalPages = Math.max(
    1,
    Math.ceil(filmstripParticipants.length / filmstripPerPage),
  );
  const safeFilmstripPage = Math.min(filmstripPage, filmstripTotalPages - 1);
  const pageFilmstrip = filmstripParticipants.slice(
    safeFilmstripPage * filmstripPerPage,
    safeFilmstripPage * filmstripPerPage + filmstripPerPage,
  );

  useEffect(() => {
    setFilmstripPage(0);
  }, [filmstripParticipants.length, filmstripPerPage]);

  useEffect(() => {
    if (filmstripPage > filmstripTotalPages - 1) {
      setFilmstripPage(Math.max(0, filmstripTotalPages - 1));
    }
  }, [filmstripPage, filmstripTotalPages]);

  const selectSpotlight = (identity: string) => {
    manualSpotlightRef.current = true;
    setSpotlightIdentity(identity);
  };

  if (!spotlightParticipant) return null;

  return (
    <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 relative">
      <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden">
        <ParticipantTileWrapped
          participant={spotlightParticipant}
          speakingIds={speakingIds}
          raisedHands={raisedHands}
          className="w-full h-full min-h-0 aspect-auto!"
        />
      </div>

      {filmstripParticipants.length > 0 && (
        <div className="shrink-0 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin justify-center">
            {pageFilmstrip.map((participant) => (
              <ParticipantTileWrapped
                key={participant.identity}
                participant={participant}
                speakingIds={speakingIds}
                raisedHands={raisedHands}
                onSelect={() => selectSpotlight(participant.identity)}
                className={`w-24 h-16 sm:w-28 sm:h-18 md:w-32 md:h-20 shrink-0 aspect-auto! border-2 transition-colors ${
                  participant.identity === spotlightParticipant.identity
                    ? "border-[#835BD5]"
                    : "border-transparent opacity-90 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <StagePagination
            page={safeFilmstripPage}
            totalPages={filmstripTotalPages}
            onPageChange={setFilmstripPage}
            label="Participant pages"
          />
        </div>
      )}
      {localParticipant && (
        <LocalParticipantPip
          localParticipant={localParticipant}
          speakingIds={speakingIds}
          raisedHands={raisedHands}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

export default function VideoStage({
  layoutMode,
  raisedHands,
  inviteCode,
  isMobile = false,
}: VideoStageProps) {
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();
  const { maxCols, tilesPerPage, filmstripPerPage } = useViewportLayout();
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
  const totalCarouselPages = Math.max(
    1,
    Math.ceil(carouselParticipants.length / SCREEN_SHARE_CAROUSEL_PER_PAGE),
  );
  const safeCarouselPage = Math.min(carouselPage, totalCarouselPages - 1);
  const pageCarouselParticipants = carouselParticipants.slice(
    safeCarouselPage * SCREEN_SHARE_CAROUSEL_PER_PAGE,
    safeCarouselPage * SCREEN_SHARE_CAROUSEL_PER_PAGE +
      SCREEN_SHARE_CAROUSEL_PER_PAGE,
  );

  useEffect(() => {
    setCarouselPage(0);
  }, [carouselParticipants.length]);

  useEffect(() => {
    if (carouselPage > totalCarouselPages - 1) {
      setCarouselPage(Math.max(0, totalCarouselPages - 1));
    }
  }, [carouselPage, totalCarouselPages]);

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
                  <ParticipantTileWrapped
                    key={participant.identity}
                    participant={participant}
                    speakingIds={speakingIds}
                    raisedHands={raisedHands}
                    className="h-24 w-full border border-white/20 bg-black/30 backdrop-blur-sm aspect-auto!"
                  />
                ))}
              </div>
              <StagePagination
                page={safeCarouselPage}
                totalPages={totalCarouselPages}
                onPageChange={setCarouselPage}
                label="Carousel pages"
              />
            </div>
          )}

          {localParticipant &&
            localParticipant.identity !== screenShareOwnerIdentity && (
              <LocalParticipantPip
                localParticipant={localParticipant}
                speakingIds={speakingIds}
                raisedHands={raisedHands}
                isMobile={isMobile}
              />
            )}
        </div>
      </div>
    );
  }

  if (remoteParticipants.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0 relative">
        <EmptyRoomState inviteCode={inviteCode} />
        {localParticipant && (
          <LocalParticipantPip
            localParticipant={localParticipant}
            speakingIds={speakingIds}
            raisedHands={raisedHands}
            isMobile={isMobile}
            className="absolute bottom-2 z-20 right-6"
          />
        )}
      </div>
    );
  }

  if (layoutMode === "spotlight") {
    return (
      <SpotlightLayoutView
        remoteParticipants={remoteParticipants}
        localParticipant={localParticipant}
        speakingParticipants={speakingParticipants}
        speakingIds={speakingIds}
        raisedHands={raisedHands}
        filmstripPerPage={filmstripPerPage}
        isMobile={isMobile}
      />
    );
  }

  return (
    <GridLayoutView
      participants={participants}
      localParticipant={localParticipant}
      speakingIds={speakingIds}
      raisedHands={raisedHands}
      maxCols={maxCols}
      tilesPerPage={tilesPerPage}
      isMobile={isMobile}
    />
  );
}
