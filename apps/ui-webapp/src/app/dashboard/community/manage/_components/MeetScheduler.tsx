"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Video,
  Plus,
  X,
  VideoOff,
  Users,
  ArrowRight,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
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

import type { CommunityMeet as Meet } from "@oppskills/types";

interface MeetSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  meets?: Meet[];
  onScheduleMeet?: (
    title: string,
    dateStr: string,
    timeStr: string,
    targetGroup: string,
    meetType: "Urgent" | "Recurring" | "Feedback" | "Important",
    description: string,
  ) => void;
}

const initialMeets: Meet[] = [
  {
    id: "1",
    title: "Weekly Core Sync",
    date: "May 28, 2026",
    time: "06:00 PM - 07:00 PM",
    attendees: 12,
    link: "https://oppskills.meet/weekly-sync",
  },
  {
    id: "2",
    title: "Hackathon Organizer Prep",
    date: "Jun 02, 2026",
    time: "04:30 PM - 05:30 PM",
    attendees: 8,
    link: "https://oppskills.meet/hackathon-prep",
  },
];

export default function MeetScheduler({
  isOpen,
  onClose,
  meets = [],
  onScheduleMeet,
}: MeetSchedulerProps) {
  const [localMeets, setLocalMeets] = useState<Meet[]>(initialMeets);
  const activeMeets = meets.length > 0 ? meets : localMeets;

  // Form states
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("10-05-2026");
  const [meetTime, setMeetTime] = useState("9:00 AM");
  const [targetGroup, setTargetGroup] = useState("Core Members");
  const [meetType, setMeetType] = useState<
    "Urgent" | "Recurring" | "Feedback" | "Important"
  >("Recurring");
  const [description, setDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (onScheduleMeet) {
      onScheduleMeet(
        meetTitle.trim(),
        meetDate,
        meetTime,
        targetGroup,
        meetType,
        description.trim() ||
          "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large.",
      );
    } else {
      const newMeet: Meet = {
        id: String(activeMeets.length + 1),
        title: meetTitle.trim(),
        date: meetDate,
        time: meetTime,
        attendees: targetGroup === "Core Members" ? 12 : 543,
        link: `https://oppskills.meet/${meetTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        targetGroup,
        type: meetType,
        description:
          description.trim() ||
          "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large.",
        attendance: "Scheduled",
      };
      setLocalMeets((prev) => [newMeet, ...prev]);
      toast.success(`Successfully scheduled "${meetTitle.trim()}"!`);
    }

    // Reset Form
    setMeetTitle("");
    setDescription("");
    setMeetType("Recurring");
    toast.success(`Successfully created meeting: "${meetTitle.trim()}"`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl bg-[#F5F5F5] p-0 flex flex-col gap-0 border-l border-neutral-200 overflow-hidden [&>button]:hidden h-full"
      >
        {/* Custom Header with Back Caret and Title */}
        <div className="px-6 py-4.5 border-b border-neutral-200/50 bg-white flex flex-row items-center gap-4 space-y-0 shadow-2xs shrink-0 select-none">
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

        {/* Scrollable sheet body container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
          {/* Card 1: Create Meet */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5"
          >
            <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800 tracking-tight select-none">
              Create Meet
            </h3>

            {/* Title / Scope Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                Meet Title / Scope*
              </label>
              <Input
                type="text"
                placeholder="Website Development"
                value={meetTitle}
                onChange={(e) => setMeetTitle(e.target.value)}
                className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base font-medium bg-white w-full"
              />
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meet Date select dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Meet Date
                </label>
                <Select value={meetDate} onValueChange={setMeetDate}>
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select meet date" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    <SelectItem
                      value="10-05-2026"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      10-05-2026
                    </SelectItem>
                    <SelectItem
                      value="15-05-2026"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      15-05-2026
                    </SelectItem>
                    <SelectItem
                      value="21 Mar 2026"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      21 Mar 2026
                    </SelectItem>
                    <SelectItem
                      value="28 May 2026"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      28 May 2026
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Meet Time select dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Meet Time
                </label>
                <Select value={meetTime} onValueChange={setMeetTime}>
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select meet time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    <SelectItem
                      value="9:00 AM"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      9:00 AM
                    </SelectItem>
                    <SelectItem
                      value="11:30 AM"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      11:30 AM
                    </SelectItem>
                    <SelectItem
                      value="03:00 PM"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      03:00 PM
                    </SelectItem>
                    <SelectItem
                      value="06:00 PM"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      06:00 PM
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meet is for (Target audience dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Meet is for
                </label>
                <Select value={targetGroup} onValueChange={setTargetGroup}>
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    <SelectItem
                      value="Core Members"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Core Members
                    </SelectItem>
                    <SelectItem
                      value="All Members"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      All Members
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Meet is for (Type dropdown recurring/urgent) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Meet is for
                </label>
                <Select
                  value={meetType}
                  onValueChange={(val: any) => setMeetType(val)}
                >
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select meet type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    <SelectItem
                      value="Recurring"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Recurring
                    </SelectItem>
                    <SelectItem
                      value="Urgent"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Urgent
                    </SelectItem>
                    <SelectItem
                      value="Feedback"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Feedback
                    </SelectItem>
                    <SelectItem
                      value="Important"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Important
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                Add Description
              </label>
              <Textarea
                placeholder="Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato crust Hawaiian stuffed sausage. Burnt steak party extra style stuffed."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px] p-5 border border-neutral-200 focus:border-[#835BD5] rounded-3xl text-base placeholder-neutral-400 leading-relaxed resize-none bg-white font-medium"
              />
            </div>

            {/* iOS green toggle switch and Create button row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3.5 select-none">
                <button
                  type="button"
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    sendEmail ? "bg-[#34C759]" : "bg-neutral-250"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      sendEmail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-neutral-500">
                  Send Email to the Members
                </span>
              </div>

              <Button
                type="submit"
                className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-9 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                Create Meet
              </Button>
            </div>
          </form>

          {/* Card 2: Scheduled Meets */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
            <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800 tracking-tight select-none">
              Scheduled Meets
            </h3>

            {/* Dynamic high fidelity table mapping screenshot specs */}
            <div className="overflow-x-auto border border-[#EBEBEB] rounded-2xl">
              <table className="w-full border-collapse text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[#22163b] text-white text-xs font-bold uppercase tracking-wider font-aeonicPro">
                    <th className="py-3 px-4 border-r border-neutral-700/20">
                      Meet
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center w-36">
                      Date
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center w-36">
                      Type
                    </th>
                    <th className="py-3 px-4 text-center w-48">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {activeMeets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-neutral-400 font-semibold"
                      >
                        <VideoOff className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                        No meetings scheduled
                      </td>
                    </tr>
                  ) : (
                    activeMeets.map((meet) => {
                      const isUrgent = meet.type === "Urgent";
                      const isRecurring = meet.type === "Recurring";
                      const isFeedback = meet.type === "Feedback";
                      const isImportant = meet.type === "Important";

                      const typeColor = isUrgent
                        ? "bg-red-50 text-[#C62828] border-red-150"
                        : isRecurring
                          ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                          : isFeedback
                            ? "bg-amber-50 text-[#D84315] border-amber-150"
                            : "bg-blue-50 text-[#1565C0] border-blue-150";

                      const attendanceColor =
                        meet.attendance === "Present"
                          ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                          : meet.attendance === "Absent"
                            ? "bg-red-50 text-[#C62828] border-red-150"
                            : "bg-[#F3EEFF] text-[#423072] border-[#835BD5]/10";

                      return (
                        <tr
                          key={meet.id}
                          className="hover:bg-neutral-50/20 transition-colors"
                        >
                          <td className="py-3.5 px-4 border-r border-neutral-100 max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800">
                                {meet.title}
                              </span>
                              <span className="text-xs text-neutral-400 mt-1 leading-normal">
                                {meet.description ||
                                  "Community sync meeting. Review deliverables, coordinate tasks, and align on project milestones."}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center font-semibold text-neutral-600">
                            {meet.date}
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <span
                              className={`border px-3.5 py-1.5 rounded-md text-[10px] font-bold ${typeColor}`}
                            >
                              {meet.type || "Recurring"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`border px-3.5 py-1.5 rounded-md text-[10px] font-bold ${attendanceColor}`}
                            >
                              {meet.attendance === "Scheduled"
                                ? `Scheduled for ${meet.date}`
                                : meet.attendance || "Present"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
