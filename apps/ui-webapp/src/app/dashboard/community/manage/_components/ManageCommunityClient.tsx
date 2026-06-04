"use client";

import React, { useState, useEffect, useMemo } from "react";
import ManageHeader from "./ManageHeader";
import CommunityStats from "./CommunityStats";
import MembersDirectory from "./MembersDirectory";
import MeetScheduler from "./MeetScheduler";
import TaskTracker from "./TaskTracker";
import AddMemberModal from "./AddMemberModal";
import MemberDetailsSheet from "./MemberDetailsSheet";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  getCommunity,
  getUniqueMemberTypes,
  addCommunityMembers,
  listCommunityMembers,
  deleteCommunityMember,
  updateMemberType,
  updateMemberAccess,
} from "@/lib/api/communityApi";
import {
  listCommunityMeets,
  toCommunityMeetUi,
} from "@/lib/api/communityMeetApi";
import { listTasks, updateTaskStatus } from "@/lib/api/communityTaskApi";

import type { CommunityMember as Member, CommunityTask as Task, CommunityMeet as Meet } from "@oppskills/types";

const initialMembers: Member[] = [];

const defaultRoles = [
  "Community Admin",
  "Media Lead",
  "Content Writer",
  "Circle",
];




const initialMeets: Meet[] = [];

export default function ManageCommunityClient({
  communityId,
}: {
  communityId: string;
}) {
  const router = useRouter();
  const { getToken, isLoaded, userId: loggedInUserId } = useAuth();
  const [communityName, setCommunityName] = useState<string>("");
  const [communityOwnerId, setCommunityOwnerId] = useState<string>("");
  const [meets, setMeets] = useState<Meet[]>(initialMeets);

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) return;
        const [details, meetItems, types, memberList, taskList] = await Promise.all([
          getCommunity(token, communityId),
          listCommunityMeets(token, communityId),
          getUniqueMemberTypes(token, communityId),
          listCommunityMembers(token, communityId),
          listTasks(token, communityId),
        ]);
        if (!cancelled) {
          const isOwner = loggedInUserId === details.ownerId;
          const myMemberRecord = memberList.find((m) => m.userId === loggedInUserId);
          const isOwnerOrMember =
            isOwner ||
            (myMemberRecord &&
              ["ADMIN", "MODERATOR", "READ_ONLY"].includes(myMemberRecord.accessControlRole));

          if (!isOwnerOrMember) {
            toast.error("You do not have permission to view this community.");
            router.push("/dashboard/community");
            return;
          }

          setCommunityName(details.name);
          setCommunityOwnerId(details.ownerId);
          setMeets(meetItems.map(toCommunityMeetUi));
          setCustomMemberTypes(types);
          setMembers(memberList);
          setAvailableRoles(types.length > 0 ? types : defaultRoles);
          setTasks(taskList);
        }
      } catch (error) {
        console.error("Failed to load community details:", error);
        toast.error("You do not have permission to manage this community or it does not exist.");
        router.push("/dashboard/community");
      }
    }
    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, getToken, communityId, loggedInUserId, router]);

  const [isMeetSchedulerOpen, setIsMeetSchedulerOpen] = useState(false);
  const [isTaskTrackerOpen, setIsTaskTrackerOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const [selectedMemberForTask, setSelectedMemberForTask] = useState<string | null>(null);
  const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<Member | null>(null);

  // Shared Dynamic State Pools
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [customMemberTypes, setCustomMemberTypes] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(defaultRoles);
  const [tasks, setTasks] = useState<any[]>([]);

  const mappedTasksForSheet = useMemo(() => {
    return tasks.map(t => ({
      id: t.id,
      text: t.title,
      description: t.description || "",
      tag: t.tags.join(", "),
      completed: t.status === "COMPLETED",
      assignedTo: t.toUserName || undefined,
      dueDate: t.dueDate
        ? new Date(t.dueDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : undefined,
      priority: (t.priority === "HIGH" ? "High" : t.priority === "LOW" ? "Low" : "Medium") as "High" | "Medium" | "Low",
    }));
  }, [tasks]);

  const handleAssignTask = (memberName: string) => {
    setSelectedMemberForTask(memberName);
    setIsTaskTrackerOpen(true);
  };

  const handleCloseTaskTracker = () => {
    setIsTaskTrackerOpen(false);
    setSelectedMemberForTask(null);
  };

  const currentUserMember = members.find((m) => m.userId === loggedInUserId);
  const isOwner = loggedInUserId === communityOwnerId;
  const isAdmin = currentUserMember?.accessControlRole === "ADMIN";
  const isModerator = currentUserMember?.accessControlRole === "MODERATOR";
  const isEligibleToModify = isOwner || isAdmin || isModerator;

  // State Mutators
  const handleInviteMembers = async (
    selectedUsers: { id: string; email: string; firstName: string | null; lastName: string | null; imageUrl: string | null }[],
    roleName: string,
    accessControl: string,
  ) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      let accessControlRole = "READ_ONLY";
      if (accessControl === "Admin Access") {
        accessControlRole = "ADMIN";
      } else if (accessControl === "Moderator") {
        accessControlRole = "MODERATOR";
      }

      await addCommunityMembers(token, communityId, {
        userIds: selectedUsers.map((u) => u.id),
        role: roleName,
        accessControlRole,
      });

      const memberList = await listCommunityMembers(token, communityId);
      setMembers(memberList);

      const updatedTypes = await getUniqueMemberTypes(token, communityId);
      setCustomMemberTypes(updatedTypes);
      setAvailableRoles(updatedTypes.length > 0 ? updatedTypes : defaultRoles);

      const names = selectedUsers
        .map((u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email)
        .join(", ");
      toast.success(
        `Successfully added ${selectedUsers.length} member(s): ${names} as "${roleName}" with "${accessControl}"!`,
      );
    } catch (err: any) {
      console.error("Failed to add members:", err);
      toast.error(err.message || "Failed to add members. Please try again.");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await deleteCommunityMember(token, communityId, id);

      setMembers((prev) => prev.filter((m) => m.id !== id));

      const updatedTypes = await getUniqueMemberTypes(token, communityId);
      setCustomMemberTypes(updatedTypes);
      setAvailableRoles(updatedTypes.length > 0 ? updatedTypes : defaultRoles);

      toast.success(`Removed ${name} from community`);
    } catch (err: any) {
      console.error("Failed to delete member:", err);
      toast.error(err.message || "Failed to remove member");
    }
  };

  const handleUpdateMemberType = async (memberId: string, newRole: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await updateMemberType(token, communityId, memberId, newRole);
      
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );

      setSelectedMemberForDetails((prev) =>
        prev && prev.id === memberId ? { ...prev, role: newRole } : prev
      );

      const updatedTypes = await getUniqueMemberTypes(token, communityId);
      setCustomMemberTypes(updatedTypes);
      setAvailableRoles(updatedTypes.length > 0 ? updatedTypes : defaultRoles);

      toast.success("Member role updated successfully");
    } catch (err: any) {
      console.error("Failed to update member role:", err);
      toast.error(err.message || "Failed to update member role");
    }
  };

  const handleUpdateMemberAccess = async (memberId: string, newAccess: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      let accessControlRole = "READ_ONLY";
      if (newAccess === "Admin Access" || newAccess === "ADMIN") {
        accessControlRole = "ADMIN";
      } else if (newAccess === "Moderator" || newAccess === "MODERATOR") {
        accessControlRole = "MODERATOR";
      }

      await updateMemberAccess(token, communityId, memberId, accessControlRole);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, accessControlRole } : m
        )
      );

      setSelectedMemberForDetails((prev) =>
        prev && prev.id === memberId ? { ...prev, accessControlRole } : prev
      );

      toast.success("Member access control updated successfully");
    } catch (err: any) {
      console.error("Failed to update member access:", err);
      toast.error(err.message || "Failed to update member access");
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      const updated = await updateTaskStatus(token, communityId, id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(
        nextStatus === "COMPLETED"
          ? `Completed task: "${task.title}"`
          : `Reopened task: "${task.title}"`
      );
    } catch (err: any) {
      console.error("Failed to toggle task:", err);
      toast.error(err.message || "Failed to toggle task");
    }
  };

  // Dynamic calculations relative to core stats
  const totalCommunitySize = Math.max(members.length, 12300 + (members.length - 7));
  const coreTeamCount = members.filter((m) =>
    ["Community Admin", "Media Lead", "Content Writer"].includes(m.role) || m.accessControlRole === "ADMIN"
  ).length;

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA] pb-12">
      <div className="w-full p-4 lg:p-6 flex flex-col gap-8 animate-in fade-in duration-500">

        {/* Header Section */}
        <ManageHeader
          communityId={communityId}
          communityName={communityName}
          onAddMember={() => setIsAddMemberOpen(true)}
          isEligibleToModify={isEligibleToModify}
        />

        {/* Stats Grid Section */}
        <div className="w-full">
          <CommunityStats
            onManageMeets={() => setIsMeetSchedulerOpen(true)}
            onManageTasks={() => setIsTaskTrackerOpen(true)}
            totalSize={totalCommunitySize}
            coreTeamCount={coreTeamCount}
          />
        </div>

        {/* Members Directory Section with Dynamic Custom Tabs, View Details, and Add Type Trigger */}
        <div className="w-full mt-2">
          <MembersDirectory
            onAssignTask={handleAssignTask}
            onViewDetails={setSelectedMemberForDetails}
            customTabs={customMemberTypes}
            members={members}
            onDeleteMember={handleDeleteMember}
            isEligibleToModify={isEligibleToModify}
            communityOwnerId={communityOwnerId}
            currentUserMember={currentUserMember}
          />
        </div>

        {/* Drawer Overlays */}
        <MeetScheduler
          communityId={communityId}
          isOpen={isMeetSchedulerOpen}
          onClose={() => setIsMeetSchedulerOpen(false)}
          meets={meets}
          onMeetsChange={setMeets}
        />
        <TaskTracker
          isOpen={isTaskTrackerOpen}
          onClose={handleCloseTaskTracker}
          memberName={selectedMemberForTask}
          tasks={tasks}
          onTasksChange={setTasks}
          members={members}
          communityId={communityId}
        />

        {/* Add Member Dialog Modal (Triggered by header 'Add Member' button) */}
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onAddMember={handleInviteMembers}
          availableRoles={availableRoles}
        />

        {/* Member Details Sliding Side Sheet (Triggered by clicking any member in the table) */}
        <MemberDetailsSheet
          member={selectedMemberForDetails}
          onClose={() => setSelectedMemberForDetails(null)}
          tasks={mappedTasksForSheet}
          meets={meets}
          onToggleTask={handleToggleTask}
          isEligibleToModify={isEligibleToModify}
          communityOwnerId={communityOwnerId}
          currentUserMember={currentUserMember}
          onUpdateRole={handleUpdateMemberType}
          onUpdateAccess={handleUpdateMemberAccess}
        />
      </div>
    </div>
  );
}