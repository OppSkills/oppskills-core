"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  CheckSquare,
  Info,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { CommunityMember as Member } from "@oppskills/types";

interface MembersDirectoryProps {
  onAssignTask?: (memberName: string) => void;
  customTabs?: string[];
  onViewDetails?: (member: any) => void;
  members?: Member[];
  onDeleteMember?: (id: string, name: string) => void;
  onChangeRole?: (id: string, newRole: string) => void;
  isEligibleToModify?: boolean;
  communityOwnerId?: string;
  currentUserMember?: Member;
}

const EMPTY_TABS: string[] = [];

const initialMembers: Member[] = [];

interface TabItem {
  label: string;
  showCount: boolean;
  totalCount?: number;
  hasInfo: boolean;
}

export default function MembersDirectory({
  onAssignTask,
  customTabs = EMPTY_TABS,
  onViewDetails,
  members: propMembers,
  onDeleteMember,
  onChangeRole,
  isEligibleToModify = false,
  communityOwnerId = "",
  currentUserMember,
}: MembersDirectoryProps) {
  const [localMembers, setLocalMembers] = useState<Member[]>([]);
  const members = propMembers || localMembers;

  const canModifyMember = (targetMember: Member) => {
    if (!isEligibleToModify) return false;
    if (targetMember.userId === communityOwnerId) return false;
    if (targetMember.accessControlRole === "ADMIN") {
      const isCurrentOwner = currentUserMember?.userId === communityOwnerId;
      if (!isCurrentOwner) return false;
    }
    return true;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All Members");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort states
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  // Combine default tabs with dynamic custom tabs
  const tabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [
      {
        label: "All Members",
        showCount: true,
        totalCount: members.length,
        hasInfo: false,
      },
    ];

    const custom: TabItem[] = customTabs.map((label) => ({
      label,
      showCount: false,
      hasInfo: true,
    }));

    return [...base, ...custom];
  }, [customTabs, members.length]);

  // Filter members based on search and active tab
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());

      // Tab filter
      let matchesTab = true;
      if (activeTab !== "All Members") {
        matchesTab = member.role.toLowerCase() === activeTab.toLowerCase();
      }

      return matchesSearch && matchesTab;
    });
  }, [members, searchQuery, activeTab]);

  // Sort members alphabetically
  const sortedMembers = useMemo(() => {
    if (!sortDirection) return filteredMembers;
    return [...filteredMembers].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredMembers, sortDirection]);

  // Toggle selection for individual row
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle selection for all filtered rows
  const handleToggleAll = () => {
    if (selectedIds.size === sortedMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedMembers.map((m) => m.id)));
    }
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (onDeleteMember) {
      onDeleteMember(id, name);
    } else {
      setLocalMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success(`Removed ${name} from community`);
    }
  };

  const handleBulkDelete = () => {
    if (onDeleteMember) {
      selectedIds.forEach((id) => {
        const m = members.find((x) => x.id === id);
        if (m) {
          onDeleteMember(id, m.name);
        }
      });
    } else {
      setLocalMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      toast.success(`Bulk removed ${selectedIds.size} members`);
    }
    setSelectedIds(new Set());
  };

  const toggleSort = () => {
    setSortDirection((prev) =>
      prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
    );
  };

  // Get elegant badge styles based on member role
  const getRoleBadgeStyles = (role: string) => {
    if (role.startsWith("Alumini")) {
      return "bg-[#FCE4EC] text-[#C2185B] border border-[#F8BBD0]/30";
    }
    if (role === "Circle") {
      return "bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB]/30";
    }
    // Community Admin, Media Lead, Content Writer
    return "bg-[#FFEFA6] text-[#6A4E00] border border-[#FFF59D]/40";
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header Tabs Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label as any)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap pb-3 ${
                  isActive
                    ? "text-[#423072]"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <span>
                  {tab.label}
                  {tab.showCount && ` (${tab.totalCount})`}
                </span>

                {tab.hasInfo && (
                  <span className="text-neutral-400 hover:text-neutral-600">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#835BD5] animate-in fade-in slide-in-from-left-2 duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right side Rounded Search box */}
        <div className="relative w-full lg:w-80 self-stretch lg:self-auto mb-2 lg:mb-0">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-5 pr-11 py-2 border border-neutral-200 focus:border-[#835BD5] outline-none rounded-full text-sm bg-white shadow-2xs placeholder-neutral-400 font-medium"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
        </div>
      </div>

      {/* Bulk actions banner if any checkbox is checked */}
      {selectedIds.size > 0 && (
        <div className="w-full bg-[#F3EEFF] border border-[#C8AEFF]/30 p-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-[#423072] font-semibold text-sm">
            <span className="bg-[#423072] text-white px-2 py-0.5 rounded-full text-xs">
              {selectedIds.size}
            </span>
            Members Selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onAssignTask) {
                  onAssignTask(`${selectedIds.size} selected members`);
                }
              }}
              className="bg-[#271B40] hover:bg-[#423072] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs active:scale-97"
            >
              Assign Bulk Task
            </button>
            <button
              onClick={handleBulkDelete}
              className="border border-[#E92215]/20 hover:bg-[#E92215]/10 text-[#E92215] text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer active:scale-97"
            >
              Remove Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-500 hover:text-neutral-800 text-xs font-semibold px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom High Fidelity Member Table */}
      <div className="w-full overflow-hidden border border-neutral-150 rounded-3xl bg-white shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            {/* Table Header exactly matching the reference layout */}
            <thead>
              <tr className="bg-[#22163b] text-white text-sm font-aeonicPro select-none">
                {/* Select All Checkbox Column */}
                {isEligibleToModify && (
                  <th className="py-4 px-4 text-center w-14 border-r border-neutral-700/30">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={
                          sortedMembers.length > 0 &&
                          selectedIds.size === sortedMembers.length
                        }
                        onChange={handleToggleAll}
                        className="w-5 h-5 rounded-md border-2 border-neutral-400 focus:ring-0 text-[#835BD5] cursor-pointer accent-[#835BD5]"
                      />
                    </div>
                  </th>
                )}

                {/* S.No Column */}
                <th className="py-4 px-4 text-center w-16 border-r border-neutral-700/30 font-semibold">
                  S. No.
                </th>

                {/* Member Details Column */}
                <th
                  onClick={toggleSort}
                  className="py-4 px-6 border-r border-neutral-700/30 font-semibold cursor-pointer hover:bg-[#2e204e] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Member
                    <span className="text-neutral-400 flex flex-col text-[10px] gap-0">
                      <ChevronUp
                        className={`w-3 h-3 -mb-1 ${sortDirection === "asc" ? "text-white" : ""}`}
                      />
                      <ChevronDown
                        className={`w-3 h-3 ${sortDirection === "desc" ? "text-white" : ""}`}
                      />
                    </span>
                  </div>
                </th>

                {/* Member Role Column */}
                <th className="py-4 px-6 border-r border-neutral-700/30 font-semibold">
                  <div className="flex items-center gap-2">
                    Member Role
                    <span className="text-neutral-400 flex flex-col text-[10px]">
                      <ChevronUp className="w-3 h-3 -mb-1" />
                      <ChevronDown className="w-3 h-3" />
                    </span>
                  </div>
                </th>

                {/* Tasks Column */}
                <th className="py-4 px-6 border-r border-neutral-700/30 font-semibold text-center w-52">
                  Task
                </th>

                {/* Delete Column */}
                {isEligibleToModify && (
                  <th className="py-4 px-4 font-semibold text-center w-24">
                    Delete
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-neutral-100">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isEligibleToModify ? 6 : 4}
                    className="py-16 text-center text-neutral-400 font-semibold"
                  >
                    <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    No members match search criteria
                  </td>
                </tr>
              ) : (
                sortedMembers.map((member, index) => {
                  const isChecked = selectedIds.has(member.id);
                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-neutral-50/50 transition-colors ${
                        isChecked ? "bg-[#F3EEFF]/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      {isEligibleToModify && (
                        <td className="py-4 px-4 text-center border-r border-neutral-100">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRow(member.id)}
                              className="w-5 h-5 rounded-md border-2 border-neutral-300 text-[#835BD5] focus:ring-0 cursor-pointer accent-[#835BD5]"
                            />
                          </div>
                        </td>
                      )}

                      {/* Serial Number */}
                      <td className="py-4 px-4 text-center border-r border-neutral-100 text-sm font-semibold text-neutral-700">
                        {index + 1}
                      </td>

                      {/* Member Info (Avatar, Name, Email) */}
                      <td
                        onClick={() => onViewDetails?.(member)}
                        className="py-4 px-6 border-r border-neutral-100 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <Avatar className="w-11 h-11 border border-neutral-100 shrink-0">
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                            <AvatarFallback className="bg-primary-100 text-primary-700 font-bold text-sm">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-neutral-800 text-sm leading-tight truncate">
                              {member.name}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium truncate mt-0.5">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Custom Pastel Role Badge */}
                      <td className="py-4 px-6 border-r border-neutral-100">
                        <div className="flex flex-col gap-1">
                          <div
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold text-center w-fit select-none ${getRoleBadgeStyles(
                              member.role,
                            )}`}
                          >
                            {member.role}
                          </div>
                          {member.accessControlRole && (
                            <span className="text-[10px] text-neutral-500 font-medium pl-1">
                              Access: {member.accessControlRole}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Task Coordinator Actions */}
                      <td className="py-4 px-6 border-r border-neutral-100">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {isEligibleToModify ? (
                            <button
                              onClick={() => {
                                if (onAssignTask) {
                                  onAssignTask(member.name);
                                }
                              }}
                              className="flex items-center gap-2 bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition-all cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
                              Assign Task
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-500 font-medium select-none">No Actions</span>
                          )}

                          <button
                            onClick={() => {
                              toast.info(
                                `Task assignment history open for ${member.name}`,
                              );
                            }}
                            className="text-[#5c6bc0] hover:text-[#3f51b5] underline font-medium text-xs text-center cursor-pointer transition-colors block mt-0.5 select-none"
                          >
                            Last assigned on {member.lastAssignedDate}
                          </button>
                        </div>
                      </td>

                      {/* Red Trash Delete Action */}
                      {isEligibleToModify && (
                        <td className="py-4 px-4 text-center">
                          {canModifyMember(member) ? (
                            <button
                              onClick={() =>
                                handleDeleteMember(member.id, member.name)
                              }
                              className="p-2 rounded-lg text-neutral-400 hover:text-[#E92215] hover:bg-[#E92215]/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-5 h-5 stroke-1.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400 font-semibold select-none">Locked</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
