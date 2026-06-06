"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Trash2,
  CheckSquare,
  Info,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Pagination from "@/components/common/Pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import type { CommunityMember as Member } from "@oppskills/types";

interface MembersDirectoryProps {
  onAssignTask?: (memberName: string) => void;
  customTabs?: string[];
  onViewDetails?: (member: any) => void;
  members?: Member[];
  onDeleteMember?: (id: string, name: string) => void;
  onEditMember?: (member: Member) => void;
  onChangeRole?: (id: string, newRole: string) => void;
  isEligibleToModify?: boolean;
  communityOwnerId?: string;
  currentUserMember?: Member;
  page?: number;
  totalPages?: number;
  totalMembers?: number;
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  activeTab?: string;
  onTabChange?: (val: string) => void;
  sortDirection?: "asc" | "desc" | null;
  onSortChange?: (dir: "asc" | "desc" | null) => void;
  isLoading?: boolean;
}

const EMPTY_TABS: string[] = [];

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
  members = [],
  onDeleteMember,
  onEditMember,
  isEligibleToModify = false,
  communityOwnerId = "",
  currentUserMember,
  page = 1,
  totalPages = 1,
  totalMembers = 0,
  onPageChange,
  searchQuery = "",
  onSearchChange,
  activeTab = "All Members",
  onTabChange,
  sortDirection = null,
  onSortChange,
  isLoading = false,
}: MembersDirectoryProps) {
  const getMemberHierarchyRank = (m: Member) => {
    if (m.userId === communityOwnerId) return 4; // OWNER
    if (m.accessControlRole === "ADMIN") return 3;
    if (m.accessControlRole === "MODERATOR") return 2;
    return 1; // READ_ONLY or fallback
  };

  const canEditMember = (targetMember: Member) => {
    if (!currentUserMember) return false;
    if (!isEligibleToModify) return false;

    const isCurrentUserOwner = currentUserMember.userId === communityOwnerId;
    const isTargetCurrentUser =
      targetMember.userId === currentUserMember.userId;

    if (isCurrentUserOwner) return true;
    if (isTargetCurrentUser) return false;

    const currentUserRank = getMemberHierarchyRank(currentUserMember);
    const targetUserRank = getMemberHierarchyRank(targetMember);

    return currentUserRank > targetUserRank;
  };

  const canDeleteMember = (targetMember: Member) => {
    if (!currentUserMember) return false;
    if (!isEligibleToModify) return false;

    const isTargetOwner = targetMember.userId === communityOwnerId;
    if (isTargetOwner) return false;

    const isCurrentUserOwner = currentUserMember.userId === communityOwnerId;
    const isTargetCurrentUser =
      targetMember.userId === currentUserMember.userId;

    if (isCurrentUserOwner) return true;
    if (isTargetCurrentUser) return false;

    const currentUserRank = getMemberHierarchyRank(currentUserMember);
    const targetUserRank = getMemberHierarchyRank(targetMember);

    return currentUserRank > targetUserRank;
  };

  // Debounced search input
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Combine default tabs with dynamic custom tabs
  const tabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [
      {
        label: "All Members",
        showCount: true,
        totalCount: totalMembers,
        hasInfo: false,
      },
    ];

    const custom: TabItem[] = customTabs.map((label) => ({
      label,
      showCount: false,
      hasInfo: true,
    }));

    return [...base, ...custom];
  }, [customTabs, totalMembers]);

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

  // Toggle selection for all rows on the current page
  const handleToggleAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (onDeleteMember) {
      onDeleteMember(id, name);
    } else {
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
      toast.success(`Bulk removed ${selectedIds.size} members`);
    }
    setSelectedIds(new Set());
  };

  const toggleSort = () => {
    const nextDir =
      sortDirection === "asc"
        ? "desc"
        : sortDirection === "desc"
          ? null
          : "asc";
    onSortChange?.(nextDir);
  };

  // Get elegant badge styles based on member role
  const getRoleBadgeStyles = (role: string) => {
    if (role.startsWith("Alumini")) {
      return "bg-[#FCE4EC] text-[#C2185B] border border-[#F8BBD0]/30";
    }
    if (role === "Circle") {
      return "bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB]/30";
    }
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
                onClick={() => onTabChange?.(tab.label)}
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
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
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
                  <th className="py-4 px-4 text-center w-14 border-r border-neutral-100">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={
                          members.length > 0 &&
                          selectedIds.size === members.length
                        }
                        onChange={handleToggleAll}
                        className="w-5 h-5 rounded-md border-2 border-neutral-400 focus:ring-0 text-[#835BD5] cursor-pointer accent-[#835BD5]"
                      />
                    </div>
                  </th>
                )}

                {/* S.No Column */}
                <th className="py-4 px-5 text-center w-20 whitespace-nowrap border-r border-neutral-100 font-semibold">
                  S. No.
                </th>

                {/* Member Details Column */}
                <th
                  onClick={toggleSort}
                  className="py-4 px-6 border-r border-neutral-100 font-semibold cursor-pointer hover:bg-[#2e204e] transition-colors"
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
                <th className="py-4 px-6 border-r border-neutral-100 font-semibold">
                  <div className="flex items-center gap-2">
                    Member Role
                    <span className="text-neutral-400 flex flex-col text-[10px]">
                      <ChevronUp className="w-3 h-3 -mb-1" />
                      <ChevronDown className="w-3 h-3" />
                    </span>
                  </div>
                </th>

                {/* Tasks Column */}
                <th className="py-4 px-6 border-r border-neutral-100 font-semibold text-center w-52">
                  Task
                </th>

                {/* Actions Column */}
                {isEligibleToModify && (
                  <th className="py-4 px-4 font-semibold text-center w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isEligibleToModify ? 6 : 4}
                    className="py-16 text-center text-neutral-450 font-semibold"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-5 w-5 border-2 border-t-transparent border-[#835BD5] animate-spin rounded-full" />
                      Loading members...
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
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
                members.map((member, index) => {
                  const isChecked = selectedIds.has(member.id);
                  const isCurrentUser =
                    currentUserMember && member.userId === currentUserMember.userId;
                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? "bg-purple-50/40 hover:bg-purple-50/60"
                          : isChecked
                            ? "bg-[#F3EEFF]/20 hover:bg-neutral-50/50"
                            : "hover:bg-neutral-50/50"
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
                      <td className="py-4 px-5 text-center whitespace-nowrap border-r border-neutral-100 text-sm font-semibold text-neutral-700">
                        {(page - 1) * 20 + index + 1}
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
                            <span className="font-semibold text-neutral-800 text-sm leading-tight truncate flex items-center gap-1.5">
                              {member.name}
                              {isCurrentUser && (
                                <span className="bg-[#835BD5]/10 text-[#835BD5] text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none shrink-0">
                                  You
                                </span>
                              )}
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
                            <span className="text-xs text-neutral-500 font-medium select-none">
                              No Actions
                            </span>
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

                      {/* Actions Column */}
                      {isEligibleToModify && (
                        <td className="py-4 px-4 text-center">
                          {canEditMember(member) || canDeleteMember(member) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 rounded-lg text-neutral-400 hover:text-[#835BD5] hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="w-5 h-5 stroke-1.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-white border border-neutral-200 shadow-lg rounded-xl p-1.5 z-50">
                                {canEditMember(member) && (
                                  <DropdownMenuItem
                                    onClick={() => onEditMember?.(member)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer focus:bg-neutral-50 outline-hidden"
                                  >
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                    Edit Role & Access
                                  </DropdownMenuItem>
                                )}
                                {canDeleteMember(member) && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMember(member.id, member.name)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer focus:bg-red-50 outline-hidden"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                    Remove Member
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-neutral-400 font-semibold select-none bg-neutral-100 px-2 py-1 rounded-md">
                              Locked
                            </span>
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

      {/* Pagination component */}
      {!isLoading && totalPages > 1 && (
        <div className="w-full flex justify-end">
          <Pagination
            curPage={page}
            totalPages={totalPages}
            perPage={20}
            setPerPage={() => {}}
            onPageChange={(p) => onPageChange?.(p)}
          />
        </div>
      )}
    </div>
  );
}

