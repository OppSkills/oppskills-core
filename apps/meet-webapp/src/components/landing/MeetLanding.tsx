"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Calendar, Link2, Loader2, Video, Zap } from "lucide-react";
import { toast } from "sonner";
import type { MeetKind } from "@oppskills/types";
import { createMeet } from "@/lib/api/meetApi";
import { parseInviteCode } from "@/lib/parseInviteCode";
import { cn } from "@/lib/utils";
import MeetLinkDialog from "./MeetLinkDialog";
import { UserAccountButton } from "@/components/user-account-button";

type MeetFlow = "instant" | "open-link" | "scheduled";

const flows: ReadonlyArray<{
  id: MeetFlow;
  label: string;
  icon: React.ElementType;
  kind: MeetKind;
}> = [
  { id: "instant", label: "Instant", icon: Zap, kind: "INSTANT" },
  { id: "open-link", label: "Link", icon: Link2, kind: "OPEN_LINK" },
  { id: "scheduled", label: "Schedule", icon: Calendar, kind: "SCHEDULED" },
];

export default function MeetLanding() {
  const { getToken, isSignedIn } = useAuth();
  const [activeFlow, setActiveFlow] = useState<MeetFlow>("instant");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [joinInput, setJoinInput] = useState("");
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");

  const [linkDialog, setLinkDialog] = useState<{
    open: boolean;
    title: string;
    meetUrl: string;
    autoOpen: boolean;
  }>({ open: false, title: "", meetUrl: "", autoOpen: false });

  const requireAuth = (): boolean => {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return false;
    }
    return true;
  };

  const handleJoin = () => {
    if (!requireAuth()) return;
    const code = parseInviteCode(joinInput);
    if (!code) {
      toast.error("Enter a valid meet code or link");
      return;
    }
    window.location.href = `/${code}`;
  };

  const resetForm = () => {
    setMeetTitle("");
    setMeetDate("");
    setMeetTime("");
  };

  const handleCreate = async (kind: MeetKind, autoOpen = false) => {
    if (!requireAuth()) return;

    const title =
      kind === "INSTANT"
        ? meetTitle.trim() || "Instant meet"
        : meetTitle.trim();

    if (!title) {
      toast.error("Enter a meeting title");
      return;
    }

    if (kind === "SCHEDULED" && (!meetDate || !meetTime)) {
      toast.error("Select date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Sign in to create a meet");
        return;
      }

      let scheduledStartAt: string | undefined;
      if (kind === "SCHEDULED") {
        scheduledStartAt = new Date(`${meetDate}T${meetTime}`).toISOString();
      }

      const created = await createMeet(token, {
        kind,
        title,
        scheduledStartAt,
        audienceScope: "ALL",
      });

      resetForm();
      setLinkDialog({
        open: true,
        title:
          kind === "INSTANT"
            ? "Instant meet ready"
            : kind === "OPEN_LINK"
              ? "Meet link created"
              : "Meet scheduled",
        meetUrl: created.meetUrl,
        autoOpen,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create meet",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeKind = flows.find((f) => f.id === activeFlow)?.kind ?? "INSTANT";

  return (
    <>
      <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0f]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(131,91,213,0.18),transparent)]"
        />

        <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-5 sm:px-8">
          <Image
            src="/logo.svg"
            alt="OppSkills Meet"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserAccountButton />
            ) : (
              <Link
                href="/sign-in"
                className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-2 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 text-center">
              <h1 className="text-[1.65rem] font-semibold tracking-tight text-white sm:text-3xl">
                Video meetings
              </h1>
              <p className="mt-2 text-sm text-white/45">
                Join a call or start one in seconds
              </p>
            </div>

            <section className="rounded-2xl border border-white/8 bg-[#14121c]/80 p-5 backdrop-blur-sm">
              <label
                htmlFor="join-code"
                className="text-xs font-medium uppercase tracking-wider text-white/40"
              >
                Join with a code
              </label>
              <div className="mt-2.5 flex gap-2">
                <input
                  id="join-code"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                  placeholder="abc-xyz or paste link"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#835BD5]/50 focus:ring-1 focus:ring-[#835BD5]/30"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  className="h-11 shrink-0 rounded-xl bg-white px-5 text-sm font-semibold text-[#0c0114] transition-opacity hover:opacity-90"
                >
                  Join
                </button>
              </div>
            </section>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <section className="rounded-2xl border border-white/8 bg-[#14121c]/80 p-5 backdrop-blur-sm">
              <div className="mb-4 flex rounded-xl bg-white/4 p-1">
                {flows.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveFlow(id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                      activeFlow === id
                        ? "bg-[#835BD5] text-white shadow-sm"
                        : "text-white/45 hover:text-white/70",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {!isSignedIn ? (
                <p className="text-center text-sm text-white/45">
                  <Link
                    href="/sign-in"
                    className="text-[#835BD5] hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  to create a meet
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label
                      htmlFor="meet-title"
                      className="text-xs font-medium uppercase tracking-wider text-white/40"
                    >
                      {activeFlow === "instant" ? "Title (optional)" : "Title"}
                    </label>
                    <input
                      id="meet-title"
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder={
                        activeFlow === "instant"
                          ? "Instant meet"
                          : activeFlow === "scheduled"
                            ? "Weekly sync"
                            : "Team sync"
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#835BD5]/50"
                    />
                  </div>

                  {activeFlow === "scheduled" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor="meet-date"
                          className="text-xs font-medium uppercase tracking-wider text-white/40"
                        >
                          Date
                        </label>
                        <input
                          id="meet-date"
                          type="date"
                          value={meetDate}
                          onChange={(e) => setMeetDate(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/4 px-3 text-sm text-white outline-none scheme-dark focus:border-[#835BD5]/50"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="meet-time"
                          className="text-xs font-medium uppercase tracking-wider text-white/40"
                        >
                          Time
                        </label>
                        <input
                          id="meet-time"
                          type="time"
                          value={meetTime}
                          onChange={(e) => setMeetTime(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/4 px-3 text-sm text-white outline-none scheme-dark focus:border-[#835BD5]/50"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      void handleCreate(activeKind, activeFlow === "instant")
                    }
                    className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#835BD5] text-sm font-semibold text-white transition-colors hover:bg-[#9470e0] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    {activeFlow === "instant"
                      ? "Start now"
                      : activeFlow === "open-link"
                        ? "Create link"
                        : "Schedule"}
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <MeetLinkDialog
        open={linkDialog.open}
        onOpenChange={(open) => setLinkDialog((prev) => ({ ...prev, open }))}
        title={linkDialog.title}
        meetUrl={linkDialog.meetUrl}
        autoOpen={linkDialog.autoOpen}
      />
    </>
  );
}
