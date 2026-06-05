"use client";

import React, { useMemo, useState } from "react";
import { useParticipants, useChat } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MeetSidebarProps {
  hostUserId: string;
  open: boolean;
  onClose?: () => void;
}

export default function MeetSidebar({
  hostUserId,
  open,
  onClose,
}: MeetSidebarProps) {
  const [tab, setTab] = useState<"participants" | "chat">("participants");
  const participants = useParticipants();
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState("");

  const sortedParticipants = useMemo(
    () =>
      [...participants].sort((a, b) => {
        if (a.identity === hostUserId) return -1;
        if (b.identity === hostUserId) return 1;
        return (a.name || a.identity).localeCompare(b.name || b.identity);
      }),
    [participants, hostUserId],
  );

  if (!open) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    void send(trimmed);
    setMessage("");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-40 bg-black/60"
      />

      <aside
        className={cn(
          "flex flex-col bg-[#14121c]",
          "fixed inset-0 z-[60]",
          "max-md:pb-[calc(5rem+env(safe-area-inset-bottom))]",
          "md:static md:inset-auto md:z-auto md:w-80 md:shrink-0 md:border-l md:border-white/10 md:pb-0",
        )}
      >
        <div className="flex items-center justify-between px-4 border-b border-white/10 md:hidden">
          <Image src="/logo.svg" alt="OppSkills" width={120} height={32} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-3 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab("participants")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold",
              tab === "participants"
                ? "text-[#835BD5] border-b-2 border-[#835BD5]"
                : "text-white/60",
            )}
          >
            Participants ({participants.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold",
              tab === "chat"
                ? "text-[#835BD5] border-b-2 border-[#835BD5]"
                : "text-white/60",
            )}
          >
            Chat
          </button>
        </div>

        {tab === "participants" ? (
          <ul className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedParticipants.map((participant) => (
              <li
                key={participant.identity}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5"
              >
                <div className="w-9 h-9 rounded-full bg-[#835BD5]/30 flex items-center justify-center text-sm font-bold shrink-0">
                  {(participant.name || participant.identity)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {participant.name || participant.identity}
                  </p>
                  {participant.identity === hostUserId && (
                    <span className="text-[10px] font-bold text-[#835BD5] uppercase">
                      Host
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {participant.isMicrophoneEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                  {participant.isCameraEnabled ? (
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-8">
                  No messages yet
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.timestamp} className="text-sm">
                    <span className="font-semibold text-[#835BD5]">
                      {msg.from?.name ?? "Guest"}:
                    </span>{" "}
                    <span className="text-white/90">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleSend}
              className="shrink-0 p-3 border-t border-white/10 max-md:pb-1"
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#835BD5]"
              />
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
