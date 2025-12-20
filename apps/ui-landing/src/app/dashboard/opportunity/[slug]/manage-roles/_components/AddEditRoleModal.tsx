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
import { useState, useEffect } from "react";
import { Loader2, CheckIcon, ChevronsUpDownIcon, UserIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { searchUsers, type UserSearchResult } from "@/lib/api/usersApi";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleType: "Manager" | "Evaluator";
  onAdd: (email: string) => Promise<void>;
  isLoading?: boolean;
}

function formatUserLabel(user: UserSearchResult): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.email.split("@")[0];
}

export default function AddRoleModal({
  open,
  onOpenChange,
  roleType,
  onAdd,
  isLoading = false,
}: AddRoleModalProps) {
  const { getToken } = useAuth();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = await getToken();
        if (token && !controller.signal.aborted) {
          const results = await searchUsers(token, trimmedQuery);
          if (!controller.signal.aborted) {
            setSearchResults(results);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error searching users:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchQuery, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError("Please select a user.");
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

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setComboboxOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {roleType}</DialogTitle>
          <DialogDescription>
            Search and select a user to add as a {roleType.toLowerCase()}. The
            user must already have an account in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select User</label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                  disabled={isLoading}
                  type="button"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      {selectedUser.imageUrl ? (
                        <Image
                          src={selectedUser.imageUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Search for a user...
                    </span>
                  )}
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by email..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    {isSearching && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                      <CommandEmpty>No users found.</CommandEmpty>
                    )}
                    {!isSearching && searchQuery.length < 2 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Type at least 2 characters to search...
                      </div>
                    )}
                    {!isSearching && searchResults.length > 0 && (
                      <CommandGroup>
                        {searchResults.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.email}
                            onSelect={() => handleSelectUser(user)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <CheckIcon
                              className={cn(
                                "h-4 w-4",
                                selectedUser?.id === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.imageUrl ? (
                              <Image
                                src={user.imageUrl}
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-medium truncate">
                                {formatUserLabel(user)}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#A020F0] hover:bg-[#8e1cd6]"
              disabled={isLoading || !selectedUser}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${roleType}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
