"use client";

import React, { useState } from "react";
import ManageHeader from "./_components/ManageHeader";
import CommunityStats from "./_components/CommunityStats";
import MembersDirectory from "./_components/MembersDirectory";
import MeetScheduler from "./_components/MeetScheduler";
import TaskTracker from "./_components/TaskTracker";
import AddMemberTypeModal from "./_components/AddMemberTypeModal";
import AddMemberModal from "./_components/AddMemberModal";
import AddMemberRoleModal from "./_components/AddMemberRoleModal";
import MemberDetailsSheet from "./_components/MemberDetailsSheet";
import { toast } from "sonner";

import type {
  CommunityMember as Member,
  CommunityTask as Task,
  CommunityMeet as Meet,
} from "@oppskills/types";

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Ananya Sharma",
    email: "ananya.sharma@brightwave.io",
    role: "Community Admin",
    avatarUrl: "/avatars/ananya.png",
    lastAssignedDate: "21-04-2026",
  },
  {
    id: "2",
    name: "Rohit Verma",
    email: "rohit.verma@brightwave.io",
    role: "Community Admin",
    avatarUrl: "/avatars/rohit.png",
    lastAssignedDate: "21-04-2026",
  },
  {
    id: "3",
    name: "Suhani Mehta",
    email: "suhani.mehta@brightwave.io",
    role: "Media Lead",
    avatarUrl: "/avatars/suhani.png",
    lastAssignedDate: "21-04-2026",
  },
  {
    id: "4",
    name: "Amitabh Singh",
    email: "amitabh.singh@brightwave.io",
    role: "Content Writer",
    avatarUrl: "/avatars/amitabh.png",
    lastAssignedDate: "21-04-2026",
  },
  {
    id: "5",
    name: "Neha Kapoor",
    email: "neha.kapoor@brightwave.io",
    role: "Alumini - 2024",
    avatarUrl: "/avatars/neha.png",
    lastAssignedDate: "21-03-2026",
  },
  {
    id: "6",
    name: "Neha Kapoor",
    email: "neha.kapoor@brightwave.io",
    role: "Alumini - 2025",
    avatarUrl: "/avatars/neha2.png",
    lastAssignedDate: "21-03-2026",
  },
  {
    id: "7",
    name: "Karan Malhotra",
    email: "karan.malhotra@brightwave.io",
    role: "Circle",
    avatarUrl: "/avatars/karan.png",
    lastAssignedDate: "21-03-2026",
  },
];

const initialTasks: Task[] = [
  {
    id: "1",
    text: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato crust Hawaiian stuffed sausage. Burnt steak party extra style stuffed.",
    tag: "Ideathon, E-Summit",
    completed: false,
    assignedTo: "Ananya Sharma",
    dueDate: "21 Mar 2026",
    priority: "High",
  },
  {
    id: "2",
    text: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato...",
    tag: "Ideathon, E-Summit",
    completed: false,
    assignedTo: "Rohit Verma",
    dueDate: "21 Mar 2026",
    priority: "Low",
  },
  {
    id: "3",
    text: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato...",
    tag: "Ideathon, E-Summit",
    completed: false,
    assignedTo: "Suhani Mehta",
    dueDate: "21 Mar 2026",
    priority: "Medium",
  },
];

const initialMeets: Meet[] = [
  {
    id: "1",
    title: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato crust Hawaiian stuffed sausage. Burnt steak party extra style stuffed.",
    date: "21 Mar 2026",
    time: "9:00 AM",
    attendees: 12,
    link: "https://oppskills.meet/weekly-sync",
    targetGroup: "Core Members",
    type: "Urgent",
    attendance: "Present",
  },
  {
    id: "2",
    title: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato...",
    date: "21 Mar 2026",
    time: "9:00 AM",
    attendees: 12,
    link: "https://oppskills.meet/weekly-sync",
    targetGroup: "Core Members",
    type: "Recurring",
    attendance: "Absent",
  },
  {
    id: "3",
    title: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato...",
    date: "21 Mar 2026",
    time: "9:00 AM",
    attendees: 12,
    link: "https://oppskills.meet/weekly-sync",
    targetGroup: "Core Members",
    type: "Feedback",
    attendance: "Scheduled",
  },
  {
    id: "4",
    title: "Website Development",
    description:
      "Pizza ipsum dolor meat lovers buffalo. Marinara white mozzarella black lovers large. Philly tomato...",
    date: "21 Mar 2026",
    time: "9:00 AM",
    attendees: 12,
    link: "https://oppskills.meet/weekly-sync",
    targetGroup: "Core Members",
    type: "Important",
    attendance: "Scheduled",
  },
];

export default function ManageCommunityPage() {
  const [isMeetSchedulerOpen, setIsMeetSchedulerOpen] = useState(false);
  const [isTaskTrackerOpen, setIsTaskTrackerOpen] = useState(false);
  const [isAddMemberTypeOpen, setIsAddMemberTypeOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

  const [selectedMemberForTask, setSelectedMemberForTask] = useState<
    string | null
  >(null);
  const [selectedMemberForDetails, setSelectedMemberForDetails] =
    useState<Member | null>(null);

  // Shared Dynamic State Pools
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [customMemberTypes, setCustomMemberTypes] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    "Community Admin",
    "Media Lead",
    "Content Writer",
    "Alumini - 2024",
    "Alumini - 2025",
    "Circle",
  ]);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [meets, setMeets] = useState<Meet[]>(initialMeets);

  const handleAssignTask = (memberName: string) => {
    setSelectedMemberForTask(memberName);
    setIsTaskTrackerOpen(true);
  };

  const handleCloseTaskTracker = () => {
    setIsTaskTrackerOpen(false);
    setSelectedMemberForTask(null);
  };

  // State Mutators
  const handleCreateMemberType = (name: string, accentColor: string) => {
    setCustomMemberTypes((prev) => [...prev, name]);
    toast.success(`Successfully added custom member type "${name}"!`);
  };

  const handleCreateRole = (roleName: string, roleType: string) => {
    setAvailableRoles((prev) => {
      if (prev.includes(roleName)) return prev;
      return [...prev, roleName];
    });
    toast.success(`Successfully created community role "${roleName}"!`);
  };

  const handleInviteMember = (email: string, roleName: string) => {
    const usernamePart = email.split("@")[0];
    const displayName = usernamePart
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const newMember: Member = {
      id: String(members.length + 1),
      name: displayName,
      email: email,
      role: roleName,
      avatarUrl: `/avatars/user.png`, // Generic default fallback
      lastAssignedDate: new Date()
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-"),
    };

    setMembers((prev) => [...prev, newMember]);
    toast.success(`Successfully invited "${displayName}" as "${roleName}"!`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(`Removed ${name} from community`);
  };

  const handleAddTask = (
    text: string,
    tag: string,
    assignedToName?: string,
    dueDate?: string,
    priority?: "High" | "Medium" | "Low",
    description?: string,
  ) => {
    const newTask: Task = {
      id: String(tasks.length + 1),
      text,
      tag,
      completed: false,
      assignedTo: assignedToName || selectedMemberForTask || undefined,
      dueDate: dueDate || "28 May 2026",
      priority: priority || "Medium",
      description: description || "Dedicated community milestone deliverable.",
    };
    setTasks((prev) => [...prev, newTask]);
    toast.success(`Added new task: "${text}"`);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            toast.success(`Completed task: "${t.text}"`);
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      }),
    );
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (taskToDelete) {
      toast.success(`Deleted task: "${taskToDelete.text}"`);
    }
  };

  const handleScheduleMeet = (
    title: string,
    dateStr: string,
    timeStr: string,
    targetGroup: string,
    meetType: "Urgent" | "Recurring" | "Feedback" | "Important",
    description: string,
  ) => {
    const newMeet: Meet = {
      id: String(meets.length + 1),
      title,
      date: new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: timeStr,
      attendees: targetGroup === "Core Members" ? 12 : 543,
      link: `https://oppskills.meet/${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      targetGroup,
      type: meetType,
      description,
      attendance: "Scheduled",
    };
    setMeets((prev) => [newMeet, ...prev]);
    toast.success(`Successfully scheduled "${title}"!`);
  };

  // Dynamic calculations relative to core stats
  const totalCommunitySize = 12300 + (members.length - 7);
  const coreTeamCount =
    12 +
    (members.filter((m) =>
      ["Community Admin", "Media Lead", "Content Writer"].includes(m.role),
    ).length -
      4);

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA] pb-12">
      <div className="w-full p-4 lg:p-6 flex flex-col gap-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <ManageHeader
          onAddMember={() => setIsAddMemberOpen(true)}
          onAddRole={() => setIsAddRoleOpen(true)}
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
            onAddMemberType={() => setIsAddMemberTypeOpen(true)}
            onViewDetails={setSelectedMemberForDetails}
            customTabs={customMemberTypes}
            members={members}
            onDeleteMember={handleDeleteMember}
          />
        </div>

        {/* Drawer Overlays */}
        <MeetScheduler
          isOpen={isMeetSchedulerOpen}
          onClose={() => setIsMeetSchedulerOpen(false)}
          meets={meets}
          onScheduleMeet={handleScheduleMeet}
        />
        <TaskTracker
          isOpen={isTaskTrackerOpen}
          onClose={handleCloseTaskTracker}
          memberName={selectedMemberForTask}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          members={members}
        />

        {/* Add Member Type Dialog Modal (Triggered by table '+' icon) */}
        <AddMemberTypeModal
          isOpen={isAddMemberTypeOpen}
          onClose={() => setIsAddMemberTypeOpen(false)}
          onAddType={handleCreateMemberType}
        />

        {/* Add Member Dialog Modal (Triggered by header 'Add Member' button) */}
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onAddMember={handleInviteMember}
          availableRoles={availableRoles}
        />

        {/* Add Member Role Dialog Modal (Triggered by header 'Add Member Role' button) */}
        <AddMemberRoleModal
          isOpen={isAddRoleOpen}
          onClose={() => setIsAddRoleOpen(false)}
          customRoleTypes={customMemberTypes}
          onAddRole={handleCreateRole}
        />

        {/* Member Details Sliding Side Sheet (Triggered by clicking any member in the table) */}
        <MemberDetailsSheet
          member={selectedMemberForDetails}
          onClose={() => setSelectedMemberForDetails(null)}
          tasks={tasks}
          meets={meets}
          onToggleTask={handleToggleTask}
        />
      </div>
    </div>
  );
}
