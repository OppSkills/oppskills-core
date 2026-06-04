"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

import type {
  CommunityMember as MemberDetails,
  CommunityTask as Task,
  CommunityMeet as Meet,
} from "@oppskills/types";

interface MemberDetailsSheetProps {
  member: MemberDetails | null;
  onClose: () => void;
  tasks?: Task[];
  meets?: Meet[];
  onToggleTask?: (id: string) => void;
  isEligibleToModify?: boolean;
  communityOwnerId?: string;
  currentUserMember?: MemberDetails;
  onUpdateRole?: (memberId: string, newRole: string) => void;
  onUpdateAccess?: (memberId: string, newAccess: string) => void;
}

const EMPTY_TASKS: Task[] = [];
const EMPTY_MEETS: Meet[] = [];

// Extracted detailed profiles matching the clicked member
const MEMBER_PROFILES: Record<
  string,
  {
    university: string;
    location: string;
    tags: string[];
    registeredDate: string;
  }
> = {
  "Ananya Sharma": {
    university: "Indian Institute of Technology Delhi",
    location: "New Delhi, Delhi, India",
    tags: [
      "College Student",
      "Technology",
      "4-Year B.Tech (Computer Science)",
      "Full Time",
      "3rd Year",
    ],
    registeredDate: "15 Jan 2025, 10:30 AM",
  },
  "Rohit Verma": {
    university: "Indian Institute of Management Ahmedabad",
    location: "Ahmedabad, Gujarat, India",
    tags: [
      "College Student",
      "Management",
      "2-Year MBA (Master of Business Administration)",
      "Full Time",
      "1st Year",
    ],
    registeredDate: "12 Feb 2025, 11:15 AM",
  },
  "Suhani Mehta": {
    university: "Delhi Technological University",
    location: "New Delhi, Delhi, India",
    tags: [
      "College Student",
      "Design",
      "4-Year B.Des (Interaction Design)",
      "Full Time",
      "2nd Year",
    ],
    registeredDate: "05 Mar 2025, 02:45 PM",
  },
  "Amitabh Singh": {
    university: "Symbiosis Institute of Media & Communication",
    location: "Pune, Maharashtra, India",
    tags: [
      "College Student",
      "Media",
      "2-Year MBA (Communication Management)",
      "Full Time",
      "1st Year",
    ],
    registeredDate: "20 Apr 2025, 09:10 AM",
  },
};

// Default profile for members not in explicit record
const DEFAULT_PROFILE = {
  university: "Indian Institute of Science Bangalore",
  location: "Bengaluru, Karnataka, India",
  tags: [
    "Research Student",
    "Engineering",
    "4-Year B.S. (Research)",
    "Full Time",
    "4th Year",
  ],
  registeredDate: "10 Feb 2025, 10:00 AM",
};

export default function MemberDetailsSheet({
  member,
  onClose,
  tasks = EMPTY_TASKS,
  meets = EMPTY_MEETS,
  onToggleTask,
  isEligibleToModify = false,
  communityOwnerId = "",
  currentUserMember,
  onUpdateRole,
  onUpdateAccess,
}: MemberDetailsSheetProps) {
  const [activeTaskTab, setActiveTaskTab] = useState<
    "In Progress" | "Completed"
  >("In Progress");

  const [roleInput, setRoleInput] = useState("");

  // Sync roleInput when member changes
  useEffect(() => {
    if (member) {
      setRoleInput(member.role);
    }
  }, [member]);

  const canModifyTarget = () => {
    if (!member || !isEligibleToModify) return false;
    if (member.userId === communityOwnerId) return false;
    if (member.accessControlRole === "ADMIN") {
      const isCurrentOwner = currentUserMember?.userId === communityOwnerId;
      if (!isCurrentOwner) return false;
    }
    return true;
  };

  const profileDetails = useMemo(() => {
    if (!member) return null;
    return MEMBER_PROFILES[member.name] || DEFAULT_PROFILE;
  }, [member]);

  const memberTasks = useMemo(() => {
    if (!member) return [];
    return tasks.filter((task) => {
      const isAssigned = task.assignedTo === member.name;
      const isGeneral = !task.assignedTo;

      const belongs =
        isAssigned ||
        (isGeneral &&
          !member.role.startsWith("Alumini") &&
          member.role !== "Circle");
      const matchesTab =
        activeTaskTab === "Completed" ? task.completed : !task.completed;

      return belongs && matchesTab;
    });
  }, [tasks, member, activeTaskTab]);

  if (!member || !profileDetails) return null;

  const handleMarkComplete = (taskId: string) => {
    if (onToggleTask) {
      onToggleTask(taskId);
    }
  };

  const handleViewSubmission = (taskName: string) => {
    toast.info(`Viewing student submission docs for "${taskName}"`);
  };

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      {/* Dynamic Sheet Panel exactly matching screen specs */}
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl bg-[#F5F5F5] p-0 flex flex-col gap-0 border-l border-neutral-200 overflow-hidden [&>button]:hidden h-full"
      >
        {/* Custom Header: Back Caret Arrow & Title ("Member Details") */}
        <SheetHeader className="px-6 py-4.5 border-b border-neutral-200/50 bg-white flex flex-row items-center gap-4 space-y-0 shadow-2xs">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Go Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <SheetTitle className="text-xl font-bold font-aeonicPro text-[#0C0114] tracking-tight">
            Member Details
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Container Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
          {/* 1. Member Overview Box Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col md:flex-row gap-5 items-start">
            <Avatar className="w-20 h-20 border-2 border-neutral-100 shrink-0 shadow-2xs">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback className="bg-purple-100 text-purple-700 font-extrabold text-2xl">
                {member.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col min-w-0 w-full">
              <div className="flex items-center justify-between gap-3 w-full">
                <span className="font-aeonicPro text-2xl font-bold text-neutral-800 truncate">
                  {member.name}
                </span>

                {/* Accent Role Badge */}
                <div className="bg-[#FFEFA6] text-[#6A4E00] border border-[#FFF59D]/40 px-3.5 py-1.5 rounded-md text-xs font-bold shrink-0 select-none shadow-3xs">
                  {member.role}
                </div>
              </div>

              {/* Dynamic Metadata Attributes */}
              <div className="flex flex-col gap-3.5 mt-4.5 text-sm text-neutral-500 font-medium select-text">
                {/* School */}
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{profileDetails.university}</span>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="text-[#835BD5] hover:underline cursor-pointer">
                    {member.email}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{profileDetails.location}</span>
                </div>

                {/* Profile tags list */}
                <div className="flex items-start gap-3 pt-0.5 border-t border-dashed border-neutral-100 mt-0.5 pt-3">
                  <BookOpen className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {profileDetails.tags.map((tag, idx) => (
                      <React.Fragment key={tag}>
                        {idx > 0 && (
                          <span className="text-neutral-300 select-none">
                            |
                          </span>
                        )}
                        <span className="text-neutral-500">{tag}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Registered date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>Registered on: {profileDetails.registeredDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Access & Role Settings Card (Only shown if eligible) */}
          {canModifyTarget() && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-4">
              <h3 className="font-aeonicPro text-lg font-bold text-neutral-800 tracking-tight">
                Access & Role Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Role Input/Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500">
                    Custom Member Role
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="e.g. Media Lead"
                      className="flex-1 h-10 px-3 border border-neutral-200 focus:border-[#835BD5] outline-none rounded-xl text-sm bg-white font-medium shadow-3xs"
                    />
                    <button
                      onClick={() => {
                        if (roleInput.trim() && onUpdateRole) {
                          onUpdateRole(member.id, roleInput.trim());
                        }
                      }}
                      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Access Control Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500">
                    Access Control Level
                  </label>
                  <select
                    value={member.accessControlRole || "READ_ONLY"}
                    onChange={(e) => {
                      if (onUpdateAccess) {
                        onUpdateAccess(member.id, e.target.value);
                      }
                    }}
                    className="h-10 px-3 border border-neutral-200 focus:border-[#835BD5] outline-none rounded-xl text-sm bg-white font-medium cursor-pointer shadow-3xs"
                  >
                    <option value="ADMIN">Admin Access</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="READ_ONLY">Read Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. Tasks Updates Box Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
            <h3 className="font-aeonicPro text-xl font-bold text-neutral-800 tracking-tight">
              Tasks Updates
            </h3>

            {/* In Progress vs Completed Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-1.5">
              {(["In Progress", "Completed"] as const).map((tab) => {
                const isActive = activeTaskTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTaskTab(tab)}
                    className={`relative px-4 py-2 text-sm font-bold transition-all cursor-pointer pb-2.5 ${
                      isActive
                        ? "text-[#423072]"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#835BD5] animate-in fade-in slide-in-from-left duration-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tasks Data Grid Table */}
            <div className="overflow-x-auto border border-neutral-150 rounded-2xl">
              <table className="w-full border-collapse text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[#22163b] text-white text-xs font-bold uppercase tracking-wider font-aeonicPro">
                    <th className="py-3 px-4 border-r border-neutral-700/20">
                      Name
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Assigned to
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Due Date
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Task Tag
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Priority
                    </th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {memberTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-neutral-400 font-semibold"
                      >
                        No tasks in this category
                      </td>
                    </tr>
                  ) : (
                    memberTasks.map((task) => {
                      const priorityColor =
                        task.priority === "High"
                          ? "bg-red-50 text-[#C62828] border-red-150"
                          : task.priority === "Low"
                            ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                            : "bg-amber-50 text-[#D84315] border-amber-150";
                      const priorityText = task.priority || "Medium";

                      return (
                        <tr key={task.id}>
                          <td className="py-3.5 px-4 border-r border-neutral-100 w-52 max-w-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800">
                                {task.text}
                              </span>
                              <span className="text-xs text-neutral-400 mt-1 leading-normal line-clamp-2">
                                {task.description ||
                                  "Dedicated community milestone deliverable. Responsible for handling critical requirements, coordinating with stakeholders, and delivering the milestone."}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <div className="flex items-center justify-center -space-x-2.5">
                              {/* Avatar stack with selected member as first */}
                              <Avatar className="w-7 h-7 border border-white shadow-3xs shrink-0 select-none">
                                <AvatarImage
                                  src={member.avatarUrl}
                                  alt={member.name}
                                />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-[9px]">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {["A", "B", "C"]
                                .slice(0, task.assignedTo ? 0 : 2)
                                .map((initial, i) => (
                                  <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border border-white bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-700 shadow-3xs shrink-0 select-none"
                                  >
                                    <span>{initial}</span>
                                  </div>
                                ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center font-semibold text-neutral-600">
                            {task.dueDate || "28 May 2026"}
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {task.tag.split(", ").map((t) => (
                                <span
                                  key={t}
                                  className="bg-[#F3EEFF] text-[#423072] px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#835BD5]/10 whitespace-nowrap"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <span
                              className={`border px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${priorityColor}`}
                            >
                              {priorityText}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleMarkComplete(task.id)}
                                className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
                              >
                                {task.completed
                                  ? "Reopen task"
                                  : "Mark complete"}
                              </button>
                              <button
                                onClick={() => handleViewSubmission(task.text)}
                                className="text-[#5c6bc0] hover:text-[#3f51b5] underline font-bold text-[10px] cursor-pointer"
                              >
                                View Submission
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Meets Box Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
            <h3 className="font-aeonicPro text-xl font-bold text-neutral-800 tracking-tight">
              Meets
            </h3>

            {/* Meets Data Grid Table */}
            <div className="overflow-x-auto border border-neutral-150 rounded-2xl">
              <table className="w-full border-collapse text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[#22163b] text-white text-xs font-bold uppercase tracking-wider font-aeonicPro">
                    <th className="py-3 px-4 border-r border-neutral-700/20">
                      Meet
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Date
                    </th>
                    <th className="py-3 px-4 border-r border-neutral-700/20 text-center">
                      Type
                    </th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {meets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-neutral-400 font-semibold"
                      >
                        No meetings scheduled
                      </td>
                    </tr>
                  ) : (
                    meets.map((meet) => {
                      const meetHash = meet.title.length + meet.id.length;
                      const memberHash = member.name.length + member.id.length;
                      const isPresent = (meetHash + memberHash) % 3 !== 0;

                      const kindLabels: Record<Meet["kind"], string> = {
                        INSTANT: "Instant",
                        OPEN_LINK: "Open link",
                        SCHEDULED: "Scheduled",
                      };
                      const typeColor =
                        meet.kind === "SCHEDULED"
                          ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                          : meet.kind === "OPEN_LINK"
                            ? "bg-blue-50 text-[#1565C0] border-blue-150"
                            : "bg-purple-50 text-[#423072] border-[#835BD5]/20";
                      const typeText = kindLabels[meet.kind];

                      return (
                        <tr key={meet.id}>
                          <td className="py-3.5 px-4 border-r border-neutral-100 max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800">
                                {meet.title}
                              </span>
                              <span className="text-xs text-neutral-400 mt-1 leading-normal">
                                Community team sync meeting. Review
                                deliverables, coordinate tasks, and align on
                                upcoming project milestones.
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
                              {typeText}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`border px-3.5 py-1.5 rounded-md text-[10px] font-bold ${
                                isPresent
                                  ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                                  : "bg-red-50 text-[#C62828] border-red-150"
                              }`}
                            >
                              {isPresent ? "Present" : "Absent"}
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
