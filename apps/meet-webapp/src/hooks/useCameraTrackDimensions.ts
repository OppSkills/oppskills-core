"use client";

import { useEffect, useState } from "react";
import {
  Track,
  TrackEvent,
  ParticipantEvent,
  type Participant,
  type TrackPublication,
} from "livekit-client";

export type VideoDimensions = Readonly<{ width: number; height: number }>;

function readPublicationDimensions(
  publication: TrackPublication,
): VideoDimensions | null {
  if (publication.dimensions?.width && publication.dimensions.height) {
    return {
      width: publication.dimensions.width,
      height: publication.dimensions.height,
    };
  }

  const track = publication.videoTrack;
  if (track) {
    const settings = track.mediaStreamTrack.getSettings();
    if (settings.width && settings.height) {
      return { width: settings.width, height: settings.height };
    }
  }

  return null;
}

export function useCameraTrackDimensions(
  participant: Participant,
): VideoDimensions | null {
  const [dimensions, setDimensions] = useState<VideoDimensions | null>(null);

  useEffect(() => {
    const publication = participant.getTrackPublication(Track.Source.Camera);
    let attachedTrack = publication?.videoTrack ?? null;

    const syncDimensions = () => {
      const pub = participant.getTrackPublication(Track.Source.Camera);
      if (!pub) {
        setDimensions(null);
        return;
      }
      setDimensions(readPublicationDimensions(pub));
    };

    const onVideoDimensionsChanged = () => {
      syncDimensions();
    };

    const attachTrackListeners = () => {
      const pub = participant.getTrackPublication(Track.Source.Camera);
      const track = pub?.videoTrack ?? null;
      if (track === attachedTrack) return;

      attachedTrack?.off(
        TrackEvent.VideoDimensionsChanged,
        onVideoDimensionsChanged,
      );
      attachedTrack = track;
      attachedTrack?.on(
        TrackEvent.VideoDimensionsChanged,
        onVideoDimensionsChanged,
      );
      syncDimensions();
    };

    syncDimensions();
    attachTrackListeners();

    participant.on(ParticipantEvent.TrackPublished, attachTrackListeners);
    participant.on(ParticipantEvent.TrackUnpublished, syncDimensions);
    participant.on(ParticipantEvent.TrackMuted, syncDimensions);
    participant.on(ParticipantEvent.TrackUnmuted, syncDimensions);

    return () => {
      participant.off(ParticipantEvent.TrackPublished, attachTrackListeners);
      participant.off(ParticipantEvent.TrackUnpublished, syncDimensions);
      participant.off(ParticipantEvent.TrackMuted, syncDimensions);
      participant.off(ParticipantEvent.TrackUnmuted, syncDimensions);
      attachedTrack?.off(
        TrackEvent.VideoDimensionsChanged,
        onVideoDimensionsChanged,
      );
    };
  }, [participant]);

  return dimensions;
}
