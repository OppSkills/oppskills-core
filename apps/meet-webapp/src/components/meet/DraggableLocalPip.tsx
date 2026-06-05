"use client";

import React, { useCallback, useRef, useState } from "react";
import type { Participant } from "livekit-client";
import { cn } from "@/lib/utils";
import ParticipantTile from "./ParticipantTile";
import { ParticipantContext } from "@livekit/components-react";

type PipCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const CORNER_CLASSES: Record<PipCorner, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

function snapCorner(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
): PipCorner {
  const midX = bounds.left + bounds.width / 2;
  const midY = bounds.top + bounds.height / 2;
  const isLeft = clientX < midX;
  const isTop = clientY < midY;
  if (isTop) return isLeft ? "top-left" : "top-right";
  return isLeft ? "bottom-left" : "bottom-right";
}

interface DraggableLocalPipProps {
  localParticipant: Participant;
  speakingIds: Set<string>;
  raisedHands: Set<string>;
  bottomInset?: number;
  className?: string;
}

export default function DraggableLocalPip({
  localParticipant,
  speakingIds,
  raisedHands,
  bottomInset = 0,
  className,
}: DraggableLocalPipProps) {
  const [corner, setCorner] = useState<PipCorner>("bottom-right");
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pipRef = useRef<HTMLDivElement>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });

  const getBounds = useCallback(() => {
    const stage = pipRef.current?.closest("[data-meet-stage]");
    return stage?.getBoundingClientRect() ?? null;
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pipRect = pipRef.current?.getBoundingClientRect();
    if (!pipRect) return;

    pointerOffsetRef.current = {
      x: event.clientX - pipRect.left,
      y: event.clientY - pipRect.top,
    };
    setIsDragging(true);
    setDragPosition({ x: pipRect.left, y: pipRect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragPosition({
      x: event.clientX - pointerOffsetRef.current.x,
      y: event.clientY - pointerOffsetRef.current.y,
    });
  };

  const finishDrag = (clientX: number, clientY: number) => {
    const bounds = getBounds();
    if (bounds) {
      setCorner(snapCorner(clientX, clientY, bounds));
    }
    setDragPosition(null);
    setIsDragging(false);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    finishDrag(event.clientX, event.clientY);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    finishDrag(event.clientX, event.clientY);
  };

  const cornerClass = CORNER_CLASSES[corner];
  const bottomStyle =
    !dragPosition && corner.startsWith("bottom")
      ? { bottom: `${bottomInset + 8}px` }
      : undefined;

  return (
    <div
      ref={pipRef}
      data-local-pip
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={
        dragPosition
          ? {
              position: "fixed",
              left: dragPosition.x,
              top: dragPosition.y,
              zIndex: 60,
              touchAction: "none",
            }
          : bottomStyle
      }
      className={cn(
        "absolute z-30 touch-none select-none",
        !dragPosition && cornerClass,
        !isDragging && !dragPosition && "transition-all duration-300 ease-out",
        isDragging && "scale-[1.02] shadow-2xl ring-2 ring-[#835BD5]",
        className,
      )}
    >
      <ParticipantContext.Provider value={localParticipant}>
        <ParticipantTile
          isLocal
          isSpeaking={speakingIds.has(localParticipant.identity)}
          raisedHand={raisedHands.has(localParticipant.identity)}
          className="w-full h-full min-h-0 shadow-lg border border-white/20 pointer-events-none max-w-[min(40vw,10rem)] max-h-[min(40vh,11rem)]"
        />
      </ParticipantContext.Provider>
    </div>
  );
}
