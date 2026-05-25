"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  CheckSquare,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  Flag,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  CommunityMember as Member,
  CommunityTask as Task,
} from "@oppskills/types";

interface TaskTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string | null;
  tasks?: Task[];
  onAddTask?: (
    text: string,
    tag: string,
    assignedToName?: string,
    dueDate?: string,
    priority?: "High" | "Medium" | "Low",
    description?: string,
  ) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  members?: Member[];
}

const AVAILABLE_TAGS = [
  "E-Summit",
  "Hackathon",
  "Ideathon",
  "Design",
  "Onboarding",
  "Outreach",
];

export default function TaskTracker({
  isOpen,
  onClose,
  memberName,
  tasks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  members = [],
}: TaskTrackerProps) {
  const [activeTaskTab, setActiveTaskTab] = useState<
    "In Progress" | "Completed"
  >("In Progress");

  // Form states
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("10-05-2026");
  const [assignee, setAssignee] = useState<string>(
    memberName || members[0]?.name || "Ananya Sharma",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "E-Summit",
    "Hackathon",
  ]);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("High");
  const [description, setDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  // Sync assignee when memberName prop changes
  React.useEffect(() => {
    if (memberName) {
      setAssignee(memberName);
    }
  }, [memberName]);

  // Toggle tag selection
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast.error("Please enter a task name");
      return;
    }

    if (onAddTask) {
      const tagsString = selectedTags.join(", ") || "General";
      onAddTask(
        taskName.trim(),
        tagsString,
        assignee,
        dueDate,
        priority,
        description.trim() ||
          "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large.",
      );
    }

    // Reset Form
    setTaskName("");
    setDescription("");
    setSelectedTags(["E-Summit", "Hackathon"]);
    setPriority("High");
    toast.success(`Successfully created task: "${taskName.trim()}"`);
  };

  const handleMarkComplete = (taskId: string) => {
    if (onToggleTask) {
      onToggleTask(taskId);
    }
  };

  const handleViewSubmission = (taskTitle: string) => {
    toast.info(`Viewing submissions for "${taskTitle}"`);
  };

  // Filter tasks based on active subtab
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) =>
      activeTaskTab === "Completed" ? task.completed : !task.completed,
    );
  }, [tasks, activeTaskTab]);

  // Find avatar for rendering inside table list
  const getMemberAvatar = (name?: string) => {
    const found = members.find((m) => m.name === name);
    return found?.avatarUrl || "/avatars/user.png";
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
            Manage Tasks
          </h2>
        </div>

        {/* Scrollable sheet body container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
          {/* Card 1: Create Task */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5"
          >
            <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800 tracking-tight select-none">
              Create Task
            </h3>

            {/* Title / Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                Task Title / Name*
              </label>
              <Input
                type="text"
                placeholder="Website Development"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base font-medium bg-white w-full"
              />
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Due Date select dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Task Due Date
                </label>
                <Select value={dueDate} onValueChange={setDueDate}>
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select due date" />
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

              {/* Assign Task To select dropdown with avatars */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Assign Task To
                </label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full flex items-center gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage
                          src={getMemberAvatar(assignee)}
                          alt={assignee}
                        />
                        <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                          {assignee.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignee}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    {members.map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.name}
                        className="rounded-lg font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-5 h-5 shrink-0">
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                            <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Tags toggles container */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Task Tags
                </label>
                <div className="min-h-12 p-2 border border-neutral-200 rounded-3xl bg-white w-full flex items-center flex-wrap gap-1.5 px-3.5">
                  {selectedTags.length === 0 ? (
                    <span className="text-neutral-400 text-xs font-medium pl-1 select-none">
                      No tags selected
                    </span>
                  ) : (
                    selectedTags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className="bg-[#F3EEFF] text-[#423072] hover:bg-[#E2D4FF] px-3 py-1 rounded-full text-xs font-bold border border-[#835BD5]/10 select-none cursor-pointer flex items-center gap-1"
                      >
                        {tag}
                        <X className="w-3 h-3 text-[#423072]/60" />
                      </span>
                    ))
                  )}
                </div>
                {/* Available quick tags selection pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#423072] text-white border-[#423072]"
                            : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Priority Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Task Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={(val: any) => setPriority(val)}
                >
                  <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full">
                    <SelectValue placeholder="Select task priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                    <SelectItem
                      value="High"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      High
                    </SelectItem>
                    <SelectItem
                      value="Medium"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="Low"
                      className="rounded-lg font-medium cursor-pointer"
                    >
                      Low
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
                Create Task
              </Button>
            </div>
          </form>

          {/* Card 2: Tasks Updates */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-5">
            <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800 tracking-tight select-none">
              Tasks Updates
            </h3>

            {/* In Progress vs Completed sub-tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-1.5 shrink-0 select-none">
              {(["In Progress", "Completed"] as const).map((tab) => {
                const isActive = activeTaskTab === tab;
                const count = tasks.filter((t) =>
                  tab === "Completed" ? t.completed : !t.completed,
                ).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTaskTab(tab)}
                    className={`relative px-4 py-2 text-sm font-bold transition-all cursor-pointer pb-2.5 ${
                      isActive
                        ? "text-[#423072]"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span>
                      {tab} ({count})
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#835BD5] animate-in fade-in slide-in-from-left duration-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic high fidelity table mapping screenshot specs */}
            <div className="overflow-x-auto border border-neutral-150 rounded-2xl">
              <table className="w-full border-collapse text-left min-w-[650px]">
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
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-neutral-400 font-semibold"
                      >
                        <AlertCircle className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" />
                        No tasks updates in this category
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const priorityColor =
                        task.priority === "High"
                          ? "bg-red-50 text-[#C62828] border-red-150"
                          : task.priority === "Low"
                            ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                            : "bg-amber-50 text-[#D84315] border-amber-150";

                      const tagList = task.tag.split(", ").map((t) => t.trim());

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-neutral-50/20 transition-colors"
                        >
                          <td className="py-3.5 px-4 border-r border-neutral-100 w-52 max-w-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800">
                                {task.text}
                              </span>
                              <span className="text-xs text-neutral-400 mt-1 leading-normal line-clamp-2">
                                {task.description}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <div className="flex items-center justify-center -space-x-2">
                              {task.assignedTo ? (
                                <Avatar
                                  className="w-8 h-8 border-2 border-white shadow-3xs shrink-0 select-none"
                                  title={task.assignedTo}
                                >
                                  <AvatarImage
                                    src={getMemberAvatar(task.assignedTo)}
                                    alt={task.assignedTo}
                                  />
                                  <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-[9px]">
                                    {task.assignedTo.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="text-neutral-400 text-xs font-semibold">
                                  Unassigned
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center font-semibold text-neutral-600">
                            {task.dueDate || "28 May 2026"}
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {tagList.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-[#F3EEFF] text-[#423072] px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#835BD5]/10 whitespace-nowrap"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                            <span
                              className={`border px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${priorityColor}`}
                            >
                              {task.priority || "Medium"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleMarkComplete(task.id)}
                                className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold text-[10px] px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap shadow-3xs"
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
