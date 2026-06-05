"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Video,
  VideoOff,
  Zap,
  Link2,
  Calendar,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MeetLinkDialog from "./MeetLinkDialog";
import {
  createCommunityMeet,
  toCommunityMeetUi,
} from "@/lib/api/communityMeetApi";

import type { CommunityMeet as Meet } from "@oppskills/types";

type MeetFlow = "instant" | "open-link" | "scheduled";

interface MeetSchedulerProps {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
  meets: Meet[];
  onMeetsChange: (meets: Meet[]) => void;
}

const kindLabels: Record<Meet["kind"], string> = {
  INSTANT: "Instant",
  OPEN_LINK: "Open link",
  SCHEDULED: "Scheduled",
};

const kindColors: Record<Meet["kind"], string> = {
  INSTANT: "bg-purple-50 text-[#423072] border-[#835BD5]/20",
  OPEN_LINK: "bg-blue-50 text-[#1565C0] border-blue-150",
  SCHEDULED: "bg-emerald-50 text-[#2E7D32] border-emerald-150",
};

export default function MeetScheduler({
  communityId,
  isOpen,
  onClose,
  meets,
  onMeetsChange,
}: MeetSchedulerProps) {
  const { getToken } = useAuth();
  const [activeFlow, setActiveFlow] = useState<MeetFlow>("instant");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [description, setDescription] = useState("");
  const [audienceScope, setAudienceScope] = useState<"ALL">("ALL");
  const [sendEmail, setSendEmail] = useState(true);

  const [linkDialog, setLinkDialog] = useState<{
    open: boolean;
    title: string;
    meetUrl: string;
    autoOpen: boolean;
  }>({ open: false, title: "", meetUrl: "", autoOpen: false });

  if (!isOpen) return null;

  const resetForms = () => {
    setMeetTitle("");
    setDescription("");
    setMeetDate("");
    setMeetTime("");
    setAudienceScope("ALL");
  };

  const handleCreate = async (
    kind: Meet["kind"],
    options?: { autoOpen?: boolean },
  ) => {
    const title =
      kind === "INSTANT"
        ? meetTitle.trim() || "Instant meet"
        : meetTitle.trim();

    if (!title) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (kind === "SCHEDULED" && (!meetDate || !meetTime)) {
      toast.error("Please select date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("You must be signed in");
        return;
      }

      let scheduledStartAt: string | undefined;
      if (kind === "SCHEDULED") {
        scheduledStartAt = new Date(`${meetDate}T${meetTime}`).toISOString();
      }

      const created = await createCommunityMeet(token, communityId, {
        kind,
        title,
        description: description.trim() || undefined,
        scheduledStartAt,
        audienceScope,
      });

      if (sendEmail && kind === "SCHEDULED") {
        toast.message("Email notifications coming soon");
      }

      onMeetsChange([toCommunityMeetUi(created), ...meets]);
      resetForms();

      setLinkDialog({
        open: true,
        title:
          kind === "INSTANT"
            ? "Instant meet ready"
            : kind === "OPEN_LINK"
              ? "Meet link created"
              : "Meet scheduled",
        meetUrl: created.meetUrl,
        autoOpen: options?.autoOpen ?? false,
      });

      toast.success(`Successfully created "${title}"`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create meet",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl bg-[#F5F5F5] p-0 flex flex-col gap-0 border-l border-neutral-200 overflow-hidden [&>button]:hidden h-full"
        >
          <div className="px-6 py-4.5 border-b border-neutral-200/50 bg-white flex flex-row items-center gap-4 shadow-2xs shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shrink-0"
              title="Go Back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <h2 className="text-xl font-bold font-aeonicPro text-[#0C0114] tracking-tight">
              Manage Meets
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setActiveFlow("instant")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeFlow === "instant"
                    ? "border-[#835BD5] bg-white shadow-md"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <Zap className="w-5 h-5 text-[#835BD5] mb-2" />
                <p className="font-bold text-neutral-800">Instant meet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Start now and share the link
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveFlow("open-link")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeFlow === "open-link"
                    ? "border-[#835BD5] bg-white shadow-md"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <Link2 className="w-5 h-5 text-[#835BD5] mb-2" />
                <p className="font-bold text-neutral-800">Link for later</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Create a reusable meet link
                </p>
              </button>
              <button
                type="button"
                onClick={() => setActiveFlow("scheduled")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeFlow === "scheduled"
                    ? "border-[#835BD5] bg-white shadow-md"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <Calendar className="w-5 h-5 text-[#835BD5] mb-2" />
                <p className="font-bold text-neutral-800">Schedule meet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Pick a date and time
                </p>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
              {activeFlow === "instant" && (
                <>
                  <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800">
                    Start instant meet
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Title (optional)
                    </label>
                    <Input
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder="Instant meet"
                      className="h-12 px-5 border border-neutral-200 rounded-full"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      void handleCreate("INSTANT", { autoOpen: true })
                    }
                    className="bg-[#271B40] hover:bg-[#423072] text-white font-bold px-9 py-5 rounded-full w-full sm:w-auto self-start"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Video className="w-4 h-4 mr-2" />
                    )}
                    Start instant meet
                  </Button>
                </>
              )}

              {activeFlow === "open-link" && (
                <>
                  <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800">
                    Create meet link
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Meet title*
                    </label>
                    <Input
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder="Community sync"
                      className="h-12 px-5 border border-neutral-200 rounded-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Who can join?
                    </label>
                    <Select
                      value={audienceScope}
                      onValueChange={() => undefined}
                    >
                      <SelectTrigger className="h-12 px-5 border border-neutral-200 rounded-full">
                        <SelectValue placeholder="Open to all members" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="ALL">Open to all members</SelectItem>
                        <SelectItem value="MEMBER_TYPES" disabled>
                          Specific member types (coming soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Description (optional)
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[90px] rounded-3xl p-5 border border-neutral-200 resize-none"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleCreate("OPEN_LINK")}
                    className="bg-[#271B40] hover:bg-[#423072] text-white font-bold px-9 py-5 rounded-full w-full sm:w-auto self-start"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Create link
                  </Button>
                </>
              )}

              {activeFlow === "scheduled" && (
                <>
                  <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800">
                    Schedule meet
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Meet title*
                    </label>
                    <Input
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder="Weekly sync"
                      className="h-12 px-5 border border-neutral-200 rounded-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                        Date*
                      </label>
                      <Input
                        type="date"
                        value={meetDate}
                        onChange={(e) => setMeetDate(e.target.value)}
                        className="h-12 px-5 border border-neutral-200 rounded-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                        Time*
                      </label>
                      <Input
                        type="time"
                        value={meetTime}
                        onChange={(e) => setMeetTime(e.target.value)}
                        className="h-12 px-5 border border-neutral-200 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-450 uppercase tracking-wide">
                      Description (optional)
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[90px] rounded-3xl p-5 border border-neutral-200 resize-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => setSendEmail(!sendEmail)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          sendEmail ? "bg-[#34C759]" : "bg-neutral-250"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            sendEmail ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-neutral-500">
                        Send email to members
                      </span>
                    </div>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleCreate("SCHEDULED")}
                      className="bg-[#271B40] hover:bg-[#423072] text-white font-bold px-9 py-5 rounded-full"
                    >
                      {isSubmitting && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Schedule meet
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
              <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800">
                Your meets
              </h3>
              <div className="overflow-x-auto border border-[#EBEBEB] rounded-2xl">
                <table className="w-full border-collapse text-left min-w-[640px]">
                  <thead>
                    <tr className="bg-[#22163b] text-white text-xs font-bold uppercase tracking-wider font-aeonicPro">
                      <th className="py-3 px-4 border-r border-neutral-700/20">
                        Meet
                      </th>
                      <th className="py-3 px-4 border-r border-neutral-700/20 text-center w-28">
                        Kind
                      </th>
                      <th className="py-3 px-4 border-r border-neutral-700/20 text-center w-36">
                        Date
                      </th>
                      <th className="py-3 px-4 text-center w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {meets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-neutral-400 font-semibold"
                        >
                          <VideoOff className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                          No meetings yet
                        </td>
                      </tr>
                    ) : (
                      meets.map((meet) => (
                        <tr key={meet.id} className="hover:bg-neutral-50/20">
                          <td className="py-3.5 px-4 border-r border-neutral-100 max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800">
                                {meet.title}
                              </span>
                              {meet.description && (
                                <span className="text-xs text-neutral-400 mt-1 line-clamp-2">
                                  {meet.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <span
                              className={`border px-3 py-1 rounded-md text-[10px] font-bold ${kindColors[meet.kind]}`}
                            >
                              {kindLabels[meet.kind]}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center font-semibold text-neutral-600">
                            {meet.date}
                            <div className="text-xs text-neutral-400">
                              {meet.time}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleCopyLink(meet.link)}
                                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                                title="Copy link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    meet.link,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                                title="Join"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
