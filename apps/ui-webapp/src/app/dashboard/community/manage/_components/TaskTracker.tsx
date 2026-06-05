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
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Flag,
  Check,
  FileText,
  Paperclip,
  Loader2,
  RefreshCw,
  MoreVertical,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { startOfToday, format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@clerk/nextjs";
import {
  createTask as apiCreateTask,
  createComment as apiCreateComment,
  updateTaskStatus as apiUpdateTaskStatus,
  getTask as apiGetTask,
  deleteComment as apiDeleteComment,
  TaskResponse,
  TaskThreadMessage,
  TaskPriority,
  TaskStatus,
} from "@/lib/api/communityTaskApi";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";

import type { CommunityMember as Member } from "@oppskills/types";

interface TaskTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string | null;
  tasks?: TaskResponse[];
  onTasksChange?: (tasks: TaskResponse[]) => void;
  members?: Member[];
  communityId: string;
}

const EMPTY_TASKS: TaskResponse[] = [];
const EMPTY_MEMBERS: Member[] = [];

const AVAILABLE_TAGS = [
  "E-Summit",
  "Hackathon",
  "Ideathon",
  "Design",
  "Onboarding",
  "Outreach",
  "Development",
  "Marketing",
  "Operations",
  "Sponsorship",
  "Social Media",
  "Content Writing",
  "Logistics",
  "Finance",
  "Public Relations",
];

export default function TaskTracker({
  isOpen,
  onClose,
  memberName,
  tasks = EMPTY_TASKS,
  onTasksChange,
  members = EMPTY_MEMBERS,
  communityId,
}: TaskTrackerProps) {
  const { getToken, userId: currentUserId } = useAuth();

  const [activeTaskTab, setActiveTaskTab] = useState<
    "In Progress" | "Completed"
  >("In Progress");

  // Thread details state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] =
    useState<TaskResponse | null>(null);
  const [refreshingThread, setRefreshingThread] = useState(false);
  const isClosed = useMemo(() => {
    return (
      selectedTaskDetails?.status === "COMPLETED" ||
      selectedTaskDetails?.status === "CANCELLED"
    );
  }, [selectedTaskDetails]);
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    return date;
  });
  const [assignee, setAssignee] = useState<string>(memberName || "unassigned");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "E-Summit",
    "Hackathon",
  ]);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("High");
  const [description, setDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const filteredAvailableTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return AVAILABLE_TAGS;
    return AVAILABLE_TAGS.filter((tag) =>
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase().trim()),
    );
  }, [tagSearchQuery]);

  // Sync assignee when memberName prop changes
  React.useEffect(() => {
    if (memberName) {
      setAssignee(memberName);
    } else {
      setAssignee("unassigned");
    }
  }, [memberName]);

  // Reset all states when sheet is closed
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedTaskId(null);
      setSelectedTaskDetails(null);
      setCommentText("");
      setSelectedFile(null);
      setUploadingFile(false);
      setTaskName("");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate);
      setAssignee(memberName || "unassigned");
      setSelectedTags(["E-Summit", "Hackathon"]);
      setPriority("High");
      setDescription("");
      setSendEmail(true);
      setTagSearchQuery("");
      setActiveTaskTab("In Progress");
      setRefreshingThread(false);
    }
  }, [isOpen, memberName]);

  // Load Task Thread Details
  const loadTaskDetails = React.useCallback(
    async (taskId: string, isManualRefresh = false) => {
      if (isManualRefresh) setRefreshingThread(true);
      try {
        const token = await getToken();
        if (!token) return;
        const details = await apiGetTask(token, communityId, taskId);
        setSelectedTaskDetails(details);
        if (isManualRefresh) {
          toast.success("Thread updated successfully");
        }
      } catch (err: any) {
        console.error("Failed to load task details:", err);
        toast.error(err.message || "Failed to load task details");
      } finally {
        if (isManualRefresh) setRefreshingThread(false);
      }
    },
    [getToken, communityId],
  );

  React.useEffect(() => {
    if (selectedTaskId) {
      void loadTaskDetails(selectedTaskId);
    } else {
      setSelectedTaskDetails(null);
    }
  }, [selectedTaskId, loadTaskDetails]);

  // Toggle tag selection
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast.error("Please enter a task name");
      return;
    }

    const assignedUser = members.find((m) => m.name === assignee);
    if (!assignedUser && assignee !== "unassigned") {
      toast.error("Please select a valid assignee");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const priorityMap: Record<string, TaskPriority> = {
        High: "HIGH",
        Medium: "MEDIUM",
        Low: "LOW",
      };

      const newTask = await apiCreateTask(token, communityId, {
        title: taskName.trim(),
        description:
          description.trim() || "Dedicated community milestone deliverable.",
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        toUserId: assignedUser ? assignedUser.userId : currentUserId!,
        priority: priorityMap[priority] || "MEDIUM",
        tags: selectedTags,
        optForMail: sendEmail,
      });

      if (onTasksChange) {
        onTasksChange([newTask, ...tasks]);
      }

      // Reset Form
      setTaskName("");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate);
      setDescription("");
      setSelectedTags(["E-Summit", "Hackathon"]);
      setPriority("High");
      setAssignee(memberName || "unassigned");
      setTagSearchQuery("");
      toast.success(`Successfully created task: "${newTask.title}"`);
    } catch (err: any) {
      console.error("Failed to create task:", err);
      toast.error(err.message || "Failed to create task");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !selectedFile) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      let content = commentText.trim();
      let fileData: any = {};

      if (selectedFile) {
        setUploadingFile(true);
        // 1. Presign upload
        const presign = await presignDocumentUpload(token, {
          purpose: "COMMUNITY_THREAD_ATTACHMENT",
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        });

        // 2. Upload file to S3
        await uploadDocumentToS3PresignedPost({
          presign,
          file: selectedFile,
        });

        // 3. Set content to the public S3 URL
        content = presign.publicUrl;
        fileData = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        };
      }

      // Send comment
      const newComment = await apiCreateComment(
        token,
        communityId,
        selectedTaskId!,
        {
          type: selectedFile ? "DOCUMENT" : "TEXT",
          content,
          ...fileData,
        },
      );

      // Refresh task details
      if (selectedTaskDetails) {
        setSelectedTaskDetails({
          ...selectedTaskDetails,
          messages: [...(selectedTaskDetails.messages || []), newComment],
        });
      }

      setCommentText("");
      setSelectedFile(null);
      toast.success("Comment sent successfully");
    } catch (err: any) {
      console.error("Failed to send comment:", err);
      toast.error(err.message || "Failed to send comment");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await apiUpdateTaskStatus(
        token,
        communityId,
        selectedTaskId!,
        { status },
      );
      setSelectedTaskDetails(updated);

      if (onTasksChange) {
        onTasksChange(
          tasks.map((t) => (t.id === selectedTaskId ? updated : t)),
        );
      }

      toast.success(`Task status updated to ${status}`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err.message || "Failed to update task status");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTaskId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await apiDeleteComment(token, communityId, selectedTaskId, commentId);

      // Remove the comment locally in the state
      if (selectedTaskDetails) {
        setSelectedTaskDetails({
          ...selectedTaskDetails,
          messages:
            selectedTaskDetails.messages?.filter(
              (msg) => msg.id !== commentId,
            ) || [],
        });
      }
      toast.success("Comment deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      toast.error(err.message || "Failed to delete comment");
    }
  };

  // Filter tasks based on active subtab
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) =>
      activeTaskTab === "Completed"
        ? task.status === "COMPLETED"
        : task.status !== "COMPLETED",
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
            onClick={selectedTaskId ? () => setSelectedTaskId(null) : onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Go Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h2 className="text-xl font-bold font-aeonicPro text-[#0C0114] tracking-tight">
            {selectedTaskId ? "Task Details & Thread" : "Manage Tasks"}
          </h2>
        </div>

        {/* Selected Task details thread view */}
        {selectedTaskId && selectedTaskDetails ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
            {/* Task Card Header */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`border px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                    selectedTaskDetails.priority === "HIGH"
                      ? "bg-red-50 text-[#C62828] border-red-150"
                      : selectedTaskDetails.priority === "LOW"
                        ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                        : "bg-amber-50 text-[#D84315] border-amber-150"
                  }`}
                >
                  {selectedTaskDetails.priority} Priority
                </span>

                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    selectedTaskDetails.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : selectedTaskDetails.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : selectedTaskDetails.status === "CANCELLED"
                          ? "bg-neutral-150 text-neutral-600 border border-neutral-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  Status: {selectedTaskDetails.status}
                </span>
              </div>

              <div>
                <h3 className="font-aeonicPro text-2xl font-bold text-neutral-800 tracking-tight leading-tight">
                  {selectedTaskDetails.title}
                </h3>
                {selectedTaskDetails.description && (
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                    {selectedTaskDetails.description}
                  </p>
                )}
              </div>

              {/* Members Involved */}
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-neutral-450 uppercase">
                    Assigner
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-neutral-100">
                      <AvatarImage
                        src={selectedTaskDetails.byUserAvatar || undefined}
                      />
                      <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700 font-bold">
                        {selectedTaskDetails.byUserName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-neutral-700">
                      {selectedTaskDetails.byUserName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-neutral-450 uppercase">
                    Assignee
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-neutral-100">
                      <AvatarImage
                        src={selectedTaskDetails.toUserAvatar || undefined}
                      />
                      <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700 font-bold">
                        {selectedTaskDetails.toUserName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-neutral-700">
                      {selectedTaskDetails.toUserName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task status transitions */}
              <div className="flex flex-wrap items-center gap-2.5 border-t border-neutral-100 pt-4">
                {currentUserId === selectedTaskDetails.byUserId && (
                  <>
                    {selectedTaskDetails.status === "COMPLETED" ||
                    selectedTaskDetails.status === "CANCELLED" ? (
                      <Button
                        onClick={() => handleUpdateStatus("IN_PROGRESS")}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold h-9 px-5 active:scale-97 cursor-pointer"
                      >
                        Revert to In Progress
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleUpdateStatus("COMPLETED")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold h-9 px-5 active:scale-97 cursor-pointer"
                        >
                          Approve Task
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus("CANCELLED")}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold h-9 px-5 active:scale-97 cursor-pointer"
                        >
                          Reject / Cancel
                        </Button>
                      </>
                    )}
                  </>
                )}

                {currentUserId === selectedTaskDetails.toUserId &&
                  selectedTaskDetails.status === "PENDING" && (
                    <Button
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold h-9 px-5 active:scale-97 cursor-pointer"
                    >
                      Start Work
                    </Button>
                  )}
              </div>
            </div>

            {/* Comment Thread Messages list */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between select-none">
                <h4 className="font-aeonicPro text-lg font-bold text-neutral-800">
                  Activity Thread
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    selectedTaskId && loadTaskDetails(selectedTaskId, true)
                  }
                  disabled={refreshingThread}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#423072] hover:text-[#5c44a0] border border-neutral-200 hover:bg-neutral-50 rounded-full cursor-pointer transition-colors disabled:opacity-50"
                  title="Refresh Thread"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshingThread ? "animate-spin" : ""}`}
                  />
                  {refreshingThread ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                {!selectedTaskDetails.messages ||
                selectedTaskDetails.messages.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-sm font-semibold select-none">
                    No activity updates yet. Use the area below to add comments
                    or upload documents.
                  </div>
                ) : (
                  selectedTaskDetails.messages.map((msg) =>
                    msg.type === "ALERT" ? (
                      <div
                        key={msg.id}
                        className="flex items-center justify-center w-full py-2 my-1 select-none"
                      >
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50/70 border border-amber-200/50 rounded-full shadow-3xs text-[11px] font-bold text-amber-700 leading-normal">
                          <span className="opacity-60 font-medium">——</span>
                          {msg.content}
                          <span className="opacity-60 font-medium">——</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1.5 p-3.5 rounded-2xl ${
                          msg.userId === currentUserId
                            ? "bg-[#423072] text-white self-end rounded-tr-xs shadow-sm"
                            : "bg-[#F4F4F5] border border-neutral-200/60 text-neutral-800 self-start rounded-tl-xs shadow-xs"
                        } w-[85%] md:w-3/4`}
                      >
                        <div className="flex items-center justify-between gap-2 select-none">
                          <div className="flex items-center gap-2">
                            <Avatar
                              className={`w-5 h-5 border ${msg.userId === currentUserId ? "border-purple-400/30" : "border-neutral-200"}`}
                            >
                              <AvatarImage src={msg.userAvatar || undefined} />
                              <AvatarFallback
                                className={`text-[8px] font-bold ${msg.userId === currentUserId ? "bg-white/20 text-white" : "bg-purple-100 text-[#423072]"}`}
                              >
                                {msg.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`text-xs font-bold ${msg.userId === currentUserId ? "text-purple-100" : "text-neutral-700"}`}
                            >
                              {msg.userName}{" "}
                              {msg.userId === currentUserId && " (You)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-medium ${msg.userId === currentUserId ? "text-purple-300" : "text-neutral-450"}`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString(
                                "en-GB",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>

                            {msg.userId === currentUserId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className={`p-1 rounded-full cursor-pointer hover:bg-white/10 ${msg.userId === currentUserId ? "text-purple-200 hover:text-white" : "text-neutral-450 hover:text-neutral-600"}`}
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-32 border-neutral-200 shadow-md rounded-xl"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(msg.id)}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {msg.type === "DOCUMENT" ? (
                          <div
                            className={`flex items-center gap-2.5 mt-1.5 p-2.5 rounded-xl border ${
                              msg.userId === currentUserId
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white border-neutral-200 text-neutral-800"
                            }`}
                          >
                            <FileText
                              className={`w-5 h-5 shrink-0 ${msg.userId === currentUserId ? "text-purple-200" : "text-[#423072]"}`}
                            />
                            <div className="flex flex-col min-w-0">
                              <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs font-bold hover:underline truncate ${
                                  msg.userId === currentUserId
                                    ? "text-white"
                                    : "text-[#423072]"
                                }`}
                              >
                                {msg.fileName || "View Attachment"}
                              </a>
                              {msg.fileSize && (
                                <span
                                  className={`text-[9px] ${msg.userId === currentUserId ? "text-purple-200" : "text-[#423072]"}`}
                                >
                                  {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p
                            className={`text-sm leading-relaxed whitespace-pre-line mt-1 ${msg.userId === currentUserId ? "text-white" : "text-neutral-800"}`}
                          >
                            {msg.content}
                          </p>
                        )}
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            {/* Comment Post Form */}
            <form
              onSubmit={handleSendComment}
              className="bg-white rounded-3xl p-6 border border-neutral-150 shadow-2xs flex flex-col gap-4 shrink-0"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                  Write comment or post file
                </label>
                <Textarea
                  placeholder="Share updates, links, or ask questions..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full min-h-[80px] p-4 border border-neutral-200 focus:border-[#835BD5] rounded-2xl text-sm placeholder-neutral-400 leading-relaxed resize-none bg-white font-medium"
                />
              </div>

              {/* Show selected file attachment name */}
              {selectedFile && (
                <div className="flex items-center justify-between p-2 px-3.5 bg-neutral-50 rounded-full border border-neutral-150 select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-700 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 select-none">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 rounded-full active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Attach File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <Button
                  type="submit"
                  disabled={
                    uploadingFile || (!commentText.trim() && !selectedFile)
                  }
                  className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-6 py-2.5 rounded-full text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading Attachment...
                    </>
                  ) : (
                    "Post Comment"
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Scrollable sheet body container for list/create tasks */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-none">
            {/* Card 1: Create Task */}
            <form
              onSubmit={handleCreateTask}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 px-5 border border-neutral-200 hover:border-neutral-300 focus:border-[#835BD5] focus:ring-0 rounded-full text-base text-neutral-700 hover:text-neutral-700 bg-white hover:bg-white font-medium w-full flex items-center justify-between shadow-none"
                      >
                        {dueDate ? (
                          format(dueDate, "dd-MM-yyyy")
                        ) : (
                          <span className="text-neutral-400">
                            Select due date
                          </span>
                        )}
                        <CalendarIcon className="w-5 h-5 text-neutral-400 shrink-0 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-2xl shadow-md border-neutral-200"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        disabled={{ before: startOfToday() }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Assign Task To select dropdown with avatars */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-450 pl-0.5 select-none uppercase tracking-wide">
                    Assign Task To
                  </label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="h-12 px-5 border border-neutral-200 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white font-medium focus:ring-0 w-full flex items-center gap-2">
                      {assignee && assignee !== "unassigned" ? (
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
                      ) : (
                        <span className="text-neutral-400">
                          Select a member
                        </span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-md border-neutral-200">
                      <SelectItem
                        value="unassigned"
                        className="rounded-lg font-medium cursor-pointer text-neutral-450"
                      >
                        Unassigned
                      </SelectItem>
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

                  {/* Search / Add Custom Tag Input */}
                  <Input
                    type="text"
                    placeholder="Search or add custom tag..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="h-10 px-4 border border-neutral-200 focus:border-[#835BD5] rounded-full text-sm font-medium bg-white w-full"
                  />

                  {/* Available quick tags selection pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {tagSearchQuery.trim() &&
                      !AVAILABLE_TAGS.some(
                        (t) =>
                          t.toLowerCase() ===
                          tagSearchQuery.trim().toLowerCase(),
                      ) && (
                        <button
                          key="custom-tag-btn"
                          type="button"
                          onClick={() => {
                            const newTag = tagSearchQuery.trim();
                            if (!selectedTags.includes(newTag)) {
                              setSelectedTags((prev) => [...prev, newTag]);
                            }
                            setTagSearchQuery("");
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer bg-[#F3EEFF] text-[#423072] border-[#835BD5]/30 hover:bg-[#E2D4FF]"
                        >
                          {tagSearchQuery.trim()}
                        </button>
                      )}
                    {filteredAvailableTags.map((tag) => {
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
                  className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-9 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto cursor-pointer"
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
                    tab === "Completed"
                      ? t.status === "COMPLETED"
                      : t.status !== "COMPLETED",
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
                    <tr className="bg-[#22163b] text-white text-xs font-bold uppercase tracking-wider font-aeonicPro select-none">
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
                          task.priority === "HIGH"
                            ? "bg-red-50 text-[#C62828] border-red-150"
                            : task.priority === "LOW"
                              ? "bg-emerald-50 text-[#2E7D32] border-emerald-150"
                              : "bg-amber-50 text-[#D84315] border-amber-150";

                        const displayPriority =
                          task.priority === "HIGH"
                            ? "High"
                            : task.priority === "LOW"
                              ? "Low"
                              : "Medium";
                        const displayDueDate = task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A";

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-neutral-50/20 transition-colors"
                          >
                            <td className="py-3.5 px-4 border-r border-neutral-100 w-52 max-w-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-neutral-800">
                                  {task.title}
                                </span>
                                <span className="text-xs text-neutral-400 mt-1 leading-normal line-clamp-2">
                                  {task.description}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                              <div className="flex items-center justify-center -space-x-2">
                                {task.toUserName ? (
                                  <Avatar
                                    className="w-8 h-8 border-2 border-white shadow-3xs shrink-0 select-none"
                                    title={task.toUserName}
                                  >
                                    <AvatarImage
                                      src={task.toUserAvatar || undefined}
                                      alt={task.toUserName}
                                    />
                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-[9px]">
                                      {task.toUserName.charAt(0)}
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
                              {displayDueDate}
                            </td>
                            <td className="py-3.5 px-4 border-r border-neutral-100 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {task.tags.map((tag) => (
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
                                {displayPriority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedTaskId(task.id)}
                                  className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold text-[10px] px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap shadow-3xs"
                                >
                                  View Thread
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
        )}
      </SheetContent>
    </Sheet>
  );
}
