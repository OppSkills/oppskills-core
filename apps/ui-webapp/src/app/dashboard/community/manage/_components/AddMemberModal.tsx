"use client";

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { searchUsers } from "@/lib/api/usersApi";
import type { UserSearchResult } from "@/lib/api/usersApi";
import { X, Loader2 } from "lucide-react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember?: (
    selectedUsers: UserSearchResult[],
    role: string,
    accessControl: string,
  ) => void;
  availableRoles?: string[];
  existingMemberUserIds?: string[];
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  availableRoles = [
    "Community Admin",
    "Media Lead",
    "Content Writer",
    "Circle",
  ],
  existingMemberUserIds = [],
}: AddMemberModalProps) {
  const { getToken, userId } = useAuth();
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  const [role, setRole] = useState(availableRoles[0] || "Community Admin");
  const [customRole, setCustomRole] = useState("");
  const [accessControl, setAccessControl] = useState("Read Only");
  const [isSearching, setIsSearching] = useState(false);

  // Sync role default if availableRoles updates
  useEffect(() => {
    if (
      availableRoles.length > 0 &&
      !availableRoles.includes(role) &&
      role !== "custom"
    ) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  // Debounced user search effect
  useEffect(() => {
    let active = true;
    const query = emailQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = await getToken();
        if (!token) return;
        const results = await searchUsers(token, query);
        if (active) {
          // Exclude self (current logged-in user) and already community members from search results
          const filteredResults = results.filter(
            (u) => u.id !== userId && !existingMemberUserIds.includes(u.id),
          );
          setSearchResults(filteredResults);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [emailQuery, getToken]);

  const handleSelectUser = (user: UserSearchResult) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      toast.info("User already selected");
      return;
    }
    setSelectedUsers((prev) => [...prev, user]);
    setEmailQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      toast.error("Please search and select at least one member to add.");
      return;
    }

    const finalRole = role === "custom" ? customRole.trim() : role;
    if (!finalRole) {
      toast.error("Please select a role or enter a custom one.");
      return;
    }

    if (onAddMember) {
      onAddMember(selectedUsers, finalRole, accessControl);
    } else {
      const names = selectedUsers
        .map(
          (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
        )
        .join(", ");
      toast.success(
        `Successfully added "${names}" as "${finalRole}" with "${accessControl}"!`,
      );
    }

    // Reset Form & Close
    setEmailQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setRole(availableRoles[0] || "Community Admin");
    setCustomRole("");
    setAccessControl("Read Only");
    onClose();
  };

  // Footer submit button
  const footerElement = (
    <Button
      onClick={handleSubmit}
      className="bg-[#271B40] hover:bg-[#423072] active:scale-97 text-white font-bold px-8 py-5 rounded-full text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      Add Member
    </Button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Member"
      footer={footerElement}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        {/* Member Search Input */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Member Email
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by email..."
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="w-full h-12 pl-5 pr-10 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-neutral-100 overflow-hidden">
              {searchResults.map((user) => {
                const fullName =
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  "No Name";
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <img
                      src={user.imageUrl || "/avatars/user.png"}
                      alt={fullName}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/avatars/user.png";
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-neutral-800 truncate">
                        {fullName}
                      </span>
                      <span className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Users Badge/Pill Container */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-400 pl-1 select-none">
              Selected ({selectedUsers.length})
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
              {selectedUsers.map((user) => {
                const fullName =
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.email.split("@")[0];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-1.5 bg-[#F3F0FA] text-[#423072] pl-2 pr-3 py-1 rounded-full text-xs font-semibold border border-[#E3DCF5] hover:bg-[#EAE4F7] transition-all"
                  >
                    <img
                      src={user.imageUrl || "/avatars/user.png"}
                      alt={fullName}
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/avatars/user.png";
                      }}
                    />
                    <span className="max-w-[120px] truncate">{fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-[#835BD5] hover:text-[#5c3c9e] transition-colors ml-0.5 focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Member Role Select Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Member Role
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select member role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {availableRoles.map((roleOption) => (
                <SelectItem
                  key={roleOption}
                  value={roleOption}
                  className="rounded-lg font-medium cursor-pointer"
                >
                  {roleOption}
                </SelectItem>
              ))}
              <SelectItem
                value="custom"
                className="rounded-lg font-medium cursor-pointer text-[#835BD5] font-semibold"
              >
                Create Custom Type...
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {role === "custom" && (
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
              Custom Role Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Media Lead, content writer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base placeholder-neutral-450 font-medium bg-white"
            />
          </div>
        )}

        {/* Access Control Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-500 pl-1 select-none">
            Access Control
          </label>
          <Select value={accessControl} onValueChange={setAccessControl}>
            <SelectTrigger className="w-full h-12 px-5 border border-neutral-350 focus:border-[#835BD5] rounded-full text-base text-neutral-700 bg-white shadow-2xs font-medium focus:ring-0">
              <SelectValue placeholder="Select access control" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-md border-neutral-200">
              {["Admin Access", "Moderator", "Read Only", "Member"].map((level) => (
                <SelectItem
                  key={level}
                  value={level}
                  className="rounded-lg font-medium cursor-pointer"
                >
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </CustomModal>
  );
}
