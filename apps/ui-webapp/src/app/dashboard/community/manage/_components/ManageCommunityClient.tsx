"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import ManageHeader from "./ManageHeader";
import CommunityStats from "./CommunityStats";
import MembersDirectory from "./MembersDirectory";
import MeetScheduler from "./MeetScheduler";
import TaskTracker from "./TaskTracker";
import AddMemberModal from "./AddMemberModal";
import EditMemberModal from "./EditMemberModal";
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
  getCommunityStats,
  getMyMemberRecord,
  type CommunityStatsResponse,
} from "@/lib/api/communityApi";
import {
  listCommunityMeets,
  toCommunityMeetUi,
} from "@/lib/api/communityMeetApi";
import { listTasks, updateTaskStatus } from "@/lib/api/communityTaskApi";

import type {
  CommunityMember as Member,
  CommunityTask as Task,
  CommunityMeet as Meet,
} from "@oppskills/types";

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

  const [stats, setStats] = useState<CommunityStatsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<boolean>(false);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [take] = useState(20);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Members");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);

  // Edit Member Modal States
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<Member | null>(null);

  // Shared Dynamic State Pools
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [customMemberTypes, setCustomMemberTypes] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(defaultRoles);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchMembers = useCallback(async (
    p: number,
    s: string,
    r: string,
    sort: "asc" | "desc" | null
  ) => {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      if (!token) return;
      setIsLoadingMembers(true);
      const res = await listCommunityMembers(token, communityId, {
        page: p,
        take,
        search: s || undefined,
        role: r === "All Members" ? undefined : r,
        sortDirection: sort || undefined,
      });
      setMembers(res.items);
      setTotalMembers(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load community members:", err);
      toast.error("Failed to load community members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [isLoaded, getToken, communityId, take]);

  useEffect(() => {
    void fetchMembers(page, search, role, sortDirection);
  }, [page, search, role, sortDirection, fetchMembers]);

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) return;

        setIsLoadingStats(true);
        setStatsError(false);

        const statsPromise = getCommunityStats(token, communityId).catch(
          (err) => {
            console.error("Failed to load community stats:", err);
            setStatsError(true);
            return null;
          },
        );

        const [details, meetItems, types, taskList, statsData, myMemberRecord] =
          await Promise.all([
            getCommunity(token, communityId),
            listCommunityMeets(token, communityId),
            getUniqueMemberTypes(token, communityId),
            listTasks(token, communityId),
            statsPromise,
            getMyMemberRecord(token, communityId).catch(() => null),
          ]);
        if (!cancelled) {
          const isOwner = loggedInUserId === details.ownerId;
          const isOwnerOrMember =
            isOwner ||
            (myMemberRecord &&
              ["ADMIN", "MODERATOR", "READ_ONLY"].includes(
                myMemberRecord.accessControlRole,
              ));

          if (!isOwnerOrMember) {
            toast.error("You do not have permission to view this community.");
            router.push("/dashboard/community");
            return;
          }

          setCommunityName(details.name);
          setCommunityOwnerId(details.ownerId);
          setMeets(meetItems.map(toCommunityMeetUi));
          setCustomMemberTypes(types);
          setAvailableRoles(types.length > 0 ? types : defaultRoles);
          setTasks(taskList);
          setStats(statsData);
          setCurrentUserMember(myMemberRecord);
          setIsLoadingStats(false);
        }
      } catch (error) {
        console.error("Failed to load community details:", error);
        toast.error(
          "You do not have permission to manage this community or it does not exist.",
        );
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
  const [existingMemberUserIds, setExistingMemberUserIds] = useState<string[]>([]);

  // Fetch all existing community member user IDs when Add Member modal is open
  useEffect(() => {
    if (isAddMemberOpen) {
      const loadAllMemberIds = async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const res = await listCommunityMembers(token, communityId, {
            page: 1,
            take: 1000,
          });
          setExistingMemberUserIds(res.items.map((m) => m.userId));
        } catch (err) {
          console.error("Failed to load existing member IDs:", err);
        }
      };
      void loadAllMemberIds();
    }
  }, [isAddMemberOpen, getToken, communityId]);

  const [selectedMemberForTask, setSelectedMemberForTask] = useState<
    string | null
  >(null);
  const [selectedMemberForDetails, setSelectedMemberForDetails] =
    useState<Member | null>(null);

  const mappedTasksForSheet = useMemo(() => {
    return tasks.map((t) => ({
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
      priority: (t.priority === "HIGH"
        ? "High"
        : t.priority === "LOW"
          ? "Low"
          : "Medium") as "High" | "Medium" | "Low",
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

  const isOwner = loggedInUserId === communityOwnerId;
  const isAdmin = currentUserMember?.accessControlRole === "ADMIN";
  const isModerator = currentUserMember?.accessControlRole === "MODERATOR";
  const isEligibleToModify = isOwner || isAdmin || isModerator;

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((val: string) => {
    setRole(val);
    setPage(1);
  }, []);

  // State Mutators
  const handleInviteMembers = async (
    selectedUsers: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    }[],
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

      setPage(1);
      void fetchMembers(1, search, role, sortDirection);

      const updatedTypes = await getUniqueMemberTypes(token, communityId);
      setCustomMemberTypes(updatedTypes);
      setAvailableRoles(updatedTypes.length > 0 ? updatedTypes : defaultRoles);

      const names = selectedUsers
        .map(
          (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
        )
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

      void fetchMembers(page, search, role, sortDirection);

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
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );

      setSelectedMemberForDetails((prev) =>
        prev && prev.id === memberId ? { ...prev, role: newRole } : prev,
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

  const handleUpdateMemberAccess = async (
    memberId: string,
    newAccess: string,
  ) => {
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
        prev.map((m) => (m.id === memberId ? { ...m, accessControlRole } : m)),
      );

      setSelectedMemberForDetails((prev) =>
        prev && prev.id === memberId ? { ...prev, accessControlRole } : prev,
      );

      toast.success("Member access control updated successfully");
    } catch (err: any) {
      console.error("Failed to update member access:", err);
      toast.error(err.message || "Failed to update member access");
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    newRole: string,
    newAccess: string,
  ) => {
    try {
      const token = await getToken();
      if (!token) return;

      let accessControlRole = "READ_ONLY";
      if (newAccess === "Admin Access" || newAccess === "ADMIN") {
        accessControlRole = "ADMIN";
      } else if (newAccess === "Moderator" || newAccess === "MODERATOR") {
        accessControlRole = "MODERATOR";
      }

      const targetMember = members.find((m) => m.id === memberId);
      if (!targetMember) return;

      const isRoleChanged = targetMember.role !== newRole;
      const isAccessChanged =
        targetMember.accessControlRole !== accessControlRole;

      if (isRoleChanged) {
        await updateMemberType(token, communityId, memberId, newRole);
      }
      if (isAccessChanged) {
        await updateMemberAccess(token, communityId, memberId, accessControlRole);
      }

      if (isRoleChanged || isAccessChanged) {
        void fetchMembers(page, search, role, sortDirection);

        const updatedTypes = await getUniqueMemberTypes(token, communityId);
        setCustomMemberTypes(updatedTypes);
        setAvailableRoles(
          updatedTypes.length > 0 ? updatedTypes : defaultRoles,
        );

        setSelectedMemberForDetails((prev) =>
          prev && prev.id === memberId
            ? { ...prev, role: newRole, accessControlRole }
            : prev,
        );

        toast.success("Member updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to update member:", err);
      toast.error(err.message || "Failed to update member");
      throw err;
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      const updated = await updateTaskStatus(token, communityId, id, {
        status: nextStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(
        nextStatus === "COMPLETED"
          ? `Completed task: "${task.title}"`
          : `Reopened task: "${task.title}"`,
      );
    } catch (err: any) {
      console.error("Failed to toggle task:", err);
      toast.error(err.message || "Failed to toggle task");
    }
  };

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
            stats={stats}
            isLoading={isLoadingStats}
            isError={statsError}
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
            onEditMember={(m) => {
              setSelectedMemberForEdit(m);
              setIsEditMemberOpen(true);
            }}
            isEligibleToModify={isEligibleToModify}
            communityOwnerId={communityOwnerId}
            currentUserMember={currentUserMember || undefined}
            page={page}
            totalPages={totalPages}
            totalMembers={totalMembers}
            onPageChange={setPage}
            searchQuery={search}
            onSearchChange={handleSearchChange}
            activeTab={role}
            onTabChange={handleRoleChange}
            sortDirection={sortDirection}
            onSortChange={setSortDirection}
            isLoading={isLoadingMembers}
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
          existingMemberUserIds={existingMemberUserIds}
        />

        {/* Edit Member Dialog Modal */}
        <EditMemberModal
          isOpen={isEditMemberOpen}
          onClose={() => {
            setIsEditMemberOpen(false);
            setSelectedMemberForEdit(null);
          }}
          member={selectedMemberForEdit}
          onUpdateMember={handleUpdateMember}
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
          currentUserMember={currentUserMember || undefined}
          onUpdateRole={handleUpdateMemberType}
          onUpdateAccess={handleUpdateMemberAccess}
        />
      </div>
    </div>
  );
}
