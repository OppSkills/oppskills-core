"use client";

import React, { useMemo, useState } from "react";
import {
  useParticipants,
  useSpeakingParticipants,
  ParticipantContext,
} from "@livekit/components-react";
import type { LayoutMode } from "./MeetHeader";
import ParticipantTile from "./ParticipantTile";

const TILES_PER_PAGE = 16;

interface VideoStageProps {
  layoutMode: LayoutMode;
  raisedHands: Set<string>;
}

export default function VideoStage({
  layoutMode,
  raisedHands,
}: VideoStageProps) {
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();
  const [page, setPage] = useState(0);

  const speakingIds = useMemo(
    () => new Set(speakingParticipants.map((p) => p.identity)),
    [speakingParticipants],
  );

  const remoteParticipants = participants.filter((p) => !p.isLocal);
  const localParticipant = participants.find((p) => p.isLocal);
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

  if (participants.length === 2 && effectiveLayout === "spotlight") {
    const remote = remoteParticipants[0];
    return (
      <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
        {remote && (
          <ParticipantContext.Provider value={remote}>
            <ParticipantTile
              isSpeaking={speakingIds.has(remote.identity)}
              raisedHand={raisedHands.has(remote.identity)}
              className="flex-1 min-h-0 !aspect-auto"
            />
          </ParticipantContext.Provider>
        )}
        {localParticipant && (
          <ParticipantContext.Provider value={localParticipant}>
            <ParticipantTile
              isLocal
              isSpeaking={speakingIds.has(localParticipant.identity)}
              raisedHand={raisedHands.has(localParticipant.identity)}
              className="w-48 h-28 shrink-0 self-end"
            />
          </ParticipantContext.Provider>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
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
    </div>
  );
}
