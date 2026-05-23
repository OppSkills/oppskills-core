"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useMemo } from "react";
import { Loader2, UserIcon } from "lucide-react";
import {
  CheckRead,
  AltArrowDown,
  Magnifer,
  UserCircle,
} from "@solar-icons/react";
import { looksLikeCompleteEmail, useUserSearch } from "@/hooks/useUserSearch";
import { type UserSearchResult } from "@/lib/api/usersApi";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleType: "Manager" | "Evaluator";
  onAdd: (email: string) => Promise<void>;
  isLoading?: boolean;
  ownerId?: string;
}

function formatUserLabel(user: UserSearchResult): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.firstName || user.lastName || user.email.split("@")[0];
}

export function AddRoleModal({
  open,
  onOpenChange,
  roleType,
  onAdd,
  isLoading = false,
  ownerId,
}: AddRoleModalProps) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const userSearchQuery = useUserSearch(searchQuery, comboboxOpen, {
    requireCompleteEmail: true,
  });

  const searchResults = useMemo(() => {
    const results = userSearchQuery.data ?? [];
    if (ownerId) {
      return results.filter((user) => user.id !== ownerId);
    }
    return results;
  }, [userSearchQuery.data, ownerId]);

  const isSearching = userSearchQuery.isFetching;

  useEffect(() => {
    if (open) {
      setSelectedUser(null);
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError("Please select a user to proceed.");
      return;
    }

    try {
      await onAdd(selectedUser.email);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add role. Please try again.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary-600 p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-900/20 rounded-full blur-3xl" />

          <DialogHeader className="relative z-10 space-y-2">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-sm border border-white/30">
              <UserCircle className="w-7 h-7 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black poppins leading-tight">
              Assign {roleType}
            </DialogTitle>
            <DialogDescription className="text-primary-100 text-lg opacity-90 max-w-[320px] leading-relaxed">
              Add a team member to help manage your platform and control
              permissions.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white">
          <div className="space-y-4">
            <label className="text-neutral-900 font-bold text-lg flex items-center gap-2">
              Search by Email
              <span className="text-primary-600 text-xs px-2 py-0.5 bg-primary-50 rounded-full">
                Required
              </span>
            </label>

            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all outline-none text-left",
                    comboboxOpen
                      ? "border-primary-600 bg-primary-50/30"
                      : "border-neutral-100 bg-neutral-50 hover:border-primary-200",
                    error && "border-red-200 bg-red-50/30",
                  )}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {selectedUser ? (
                      <div className="flex items-center gap-3">
                        {selectedUser.imageUrl ? (
                          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                            <Image
                              src={selectedUser.imageUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <UserIcon className="h-4 w-4 text-primary-600" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-neutral-900 font-bold text-sm truncate">
                            {formatUserLabel(selectedUser)}
                          </span>
                          <span className="text-neutral-500 text-xs truncate">
                            {selectedUser.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-neutral-400">
                        <Magnifer className="w-5 h-5" />
                        <span className="text-base">Search for a user...</span>
                      </div>
                    )}
                  </div>
                  <AltArrowDown
                    className={cn(
                      "w-5 h-5 text-neutral-400 transition-transform duration-200",
                      comboboxOpen && "rotate-180",
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[436px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden mt-2"
                align="start"
              >
                <Command className="border-none" shouldFilter={false}>
                  <div className="p-3 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                    <Magnifer className="w-4 h-4 text-neutral-400" />
                    <CommandInput
                      placeholder="Enter full email (e.g. name@domain.com)"
                      className="border-none focus:ring-0 h-10 text-sm w-full bg-transparent p-0"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                  </div>
                  <CommandList className="max-h-[300px] overflow-y-auto no-scrollbar">
                    {isSearching && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <span className="text-sm text-neutral-500 font-medium italic">
                          Searching users...
                        </span>
                      </div>
                    )}
                    {!isSearching &&
                      looksLikeCompleteEmail(searchQuery) &&
                      searchResults.length === 0 && (
                        <div className="py-10 text-center flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                            <Magnifer className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 px-4">
                            <p className="text-neutral-900 font-bold">
                              No Users Found
                            </p>
                            <p className="text-neutral-500 text-xs">
                              We couldn't find any account with that email
                              address.
                            </p>
                          </div>
                        </div>
                      )}
                    {!isSearching &&
                      searchQuery.trim().length > 0 &&
                      !looksLikeCompleteEmail(searchQuery) && (
                        <div className="px-6 py-10 text-center space-y-2">
                          <div className="text-primary-600 font-bold bg-primary-50 py-2 rounded-xl text-xs inline-block px-4">
                            Complete Email Required
                          </div>
                          <p className="text-neutral-500 text-sm leading-relaxed">
                            Please enter the person's full email address to find
                            them in our system.
                          </p>
                        </div>
                      )}
                    {!isSearching && searchQuery.trim().length === 0 && (
                      <div className="py-10 text-center px-6 space-y-2">
                        <p className="text-neutral-400 text-sm">
                          Start typing an email to search for team members.
                        </p>
                      </div>
                    )}
                    {!isSearching && searchResults.length > 0 && (
                      <CommandGroup className="p-2">
                        {searchResults.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.email}
                            onSelect={() => {
                              setSelectedUser(user);
                              setComboboxOpen(false);
                            }}
                            className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-primary-50 group transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              {user.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                                  <UserIcon className="h-4 w-4 text-neutral-400" />
                                </div>
                              )}
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-neutral-900 text-sm group-hover:text-primary-700 transition-colors">
                                  {formatUserLabel(user)}
                                </span>
                                <span className="text-xs text-neutral-500 truncate">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                            {selectedUser?.id === user.id && (
                              <CheckRead className="h-5 w-5 text-primary-600 shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-2xl text-neutral-600 font-bold text-lg hover:bg-neutral-50 transition-colors bg-white border border-neutral-100 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="flex-[1.5] px-6 py-4 rounded-2xl bg-primary-600 text-white font-black text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20 disabled:opacity-50 disabled:shadow-none sm:order-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <span>Assign {roleType}</span>
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
