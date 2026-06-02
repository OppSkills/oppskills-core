"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import type { MeetJoinTokenResponse, MeetPreviewResponse } from "@oppskills/types";
import { getMeetJoinToken, getMeetPreview } from "@/lib/api/meetApi";
import MeetRoom from "@/components/meet/MeetRoom";

type PageState =
  | { phase: "loading" }
  | { phase: "lobby"; preview: MeetPreviewResponse }
  | {
      phase: "room";
      preview: MeetPreviewResponse;
      join: MeetJoinTokenResponse;
    }
  | { phase: "left" }
  | { phase: "error"; message: string };

export default function MeetPageClient({ inviteCode }: { inviteCode: string }) {
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [isJoining, setIsJoining] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setState({ phase: "error", message: "Please sign in to join." });
          }
          return;
        }
        const preview = await getMeetPreview(token, inviteCode);
        if (!cancelled) {
          setState({ phase: "lobby", preview });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            phase: "error",
            message:
              error instanceof Error ? error.message : "Failed to load meeting",
          });
        }
      }
    }
    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [getToken, inviteCode, isLoaded]);

  useEffect(() => {
    if (state.phase !== "lobby") return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let levelTimer: number | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    const cleanup = () => {
      if (levelTimer) window.clearInterval(levelTimer);
      source?.disconnect();
      analyser?.disconnect();
      void audioContext?.close();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    };

    const setupPreview = async () => {
      if (!cameraEnabled && !micEnabled) {
        setAudioLevel(0);
        setMediaError(null);
        return;
      }

      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: cameraEnabled,
          audio: micEnabled,
        });
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = nextStream;
        setMediaError(null);

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.muted = true;
          void previewVideoRef.current.play().catch(() => undefined);
        }

        const audioTracks = stream.getAudioTracks();
        if (micEnabled && audioTracks.length > 0) {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          levelTimer = window.setInterval(() => {
            if (!analyser) return;
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (const value of data) {
              const centered = (value - 128) / 128;
              sum += centered * centered;
            }
            const rms = Math.sqrt(sum / data.length);
            setAudioLevel(Math.min(100, Math.round(rms * 220)));
          }, 150);
        } else {
          setAudioLevel(0);
        }
      } catch (error) {
        if (!cancelled) {
          setAudioLevel(0);
          setMediaError(
            error instanceof Error
              ? error.message
              : "Could not access camera or microphone.",
          );
        }
      }
    };

    void setupPreview();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cameraEnabled, micEnabled, state.phase]);

  const handleJoin = async () => {
    if (state.phase !== "lobby") return;
    setIsJoining(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to join");
        return;
      }
      const join = await getMeetJoinToken(token, inviteCode);
      setState({ phase: "room", preview: state.preview, join });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not join meeting",
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (state.phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#835BD5]" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Unable to join</h1>
          <p className="text-white/60">{state.message}</p>
        </div>
      </div>
    );
  }

  if (state.phase === "left") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">You left the meeting</h1>
          <p className="text-white/60">
            You can close this tab or rejoin using the same link.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-[#835BD5] hover:bg-[#6f4bc0] font-semibold"
          >
            Rejoin
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "room") {
    return (
      <MeetRoom
        token={state.join.token}
        serverUrl={state.join.livekitUrl}
        preview={state.preview}
        initialAudioEnabled={micEnabled}
        initialVideoEnabled={cameraEnabled}
        onLeave={() => setState({ phase: "left" })}
      />
    );
  }

  const { preview } = state;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#14121c] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#835BD5]/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-[#835BD5]" />
          </div>
          <div>
            <p className="text-sm text-white/50">{preview.communityName}</p>
            <h1 className="text-2xl font-bold">{preview.title}</h1>
          </div>
        </div>

        {preview.description && (
          <p className="text-white/70 text-sm leading-relaxed">
            {preview.description}
          </p>
        )}

        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video">
            {cameraEnabled ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/70">
                Camera is off
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-md bg-black/60">
                Preview
              </span>
              <div className="w-24 h-2 rounded-full bg-black/60 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-[width] duration-150"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMicEnabled((v) => !v)}
              className="h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {micEnabled ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
              {micEnabled ? "Mic on" : "Mic off"}
            </button>
            <button
              type="button"
              onClick={() => setCameraEnabled((v) => !v)}
              className="h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {cameraEnabled ? (
                <Video className="w-4 h-4 text-emerald-400" />
              ) : (
                <VideoOff className="w-4 h-4 text-red-400" />
              )}
              {cameraEnabled ? "Camera on" : "Camera off"}
            </button>
          </div>
          {mediaError && <p className="text-xs text-red-300">{mediaError}</p>}
        </div>

        <div className="text-sm text-white/50 space-y-1">
          <p>Host: {preview.hostName}</p>
          {preview.scheduledStartAt && (
            <p>
              Scheduled:{" "}
              {new Date(preview.scheduledStartAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={isJoining}
          onClick={() => void handleJoin()}
          className="w-full py-4 rounded-full bg-[#835BD5] hover:bg-[#6f4bc0] font-bold text-lg transition-colors disabled:opacity-60"
        >
          {isJoining ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Joining...
            </span>
          ) : (
            "Join meeting"
          )}
        </button>
      </div>
    </div>
  );
}
