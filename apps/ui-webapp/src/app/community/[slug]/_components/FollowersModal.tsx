"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import CustomModal from "./CustomModal";
import { usePublicCommunityMembers } from "@/hooks/community/useCommunities";
import { useDebounce } from "@/hooks/ui/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
}

export default function FollowersModal({
  isOpen,
  onClose,
  handle,
}: FollowersModalProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePublicCommunityMembers(
      handle,
      { search: debouncedSearch, take: 20 },
      { enabled: isOpen },
    );

  const followers = data?.pages.flatMap((p) => p.items) ?? [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Community Members"
      className="max-w-lg"
    >
      <div className="flex flex-col h-full gap-4 relative">
        {/* Sticky Search Field */}
        <div className="sticky top-0 bg-white pt-1 pb-3 z-20 border-b border-neutral-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search members by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-50/50 focus:bg-white border-neutral-200 focus:border-[#5D3EBB]/60 focus:ring-0 rounded-2xl text-sm font-semibold h-10 w-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Members List or Skeletons */}
        <div className="flex flex-col gap-3 py-1 overflow-y-auto">
          {isLoading ? (
            // Initial Loading Skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-white border border-neutral-100 rounded-2xl animate-pulse"
              >
                <Skeleton className="w-11 h-11 rounded-full bg-neutral-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <Skeleton className="h-4 w-32 rounded bg-neutral-200" />
                  <Skeleton className="h-3.5 w-48 rounded bg-neutral-200" />
                  <div className="flex gap-1.5 mt-1">
                    <Skeleton className="h-5 w-14 rounded-full bg-neutral-200" />
                    <Skeleton className="h-5 w-16 rounded-full bg-neutral-200" />
                  </div>
                </div>
              </div>
            ))
          ) : followers.length > 0 ? (
            <>
              {followers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start gap-3 bg-neutral-50/30 hover:bg-neutral-50 p-3 rounded-2xl border border-neutral-100/60 hover:border-neutral-200/80 transition-all duration-300 group"
                >
                  {/* User Profile Avatar */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-neutral-200 shadow-2xs group-hover:scale-105 transition-transform bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0 select-none">
                    {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>

                  {/* Member Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-neutral-800 text-sm truncate group-hover:text-[#5D3EBB] transition-colors leading-none">
                        {member.name}
                      </span>
                      {member.role === "OWNER" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6E0FA] text-[#5D3EBB] border border-[#5D3EBB]/20">
                          Owner
                        </span>
                      ) : member.role === "ADMIN" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Admin
                        </span>
                      ) : member.role === "MODERATOR" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Mod
                        </span>
                      ) : null}
                    </div>

                    {member.subtitle && (
                      <span className="text-xs text-neutral-400 font-bold truncate leading-relaxed">
                        {member.subtitle}
                      </span>
                    )}

                    {/* Skills & Interests Tags */}
                    {(member.skills.length > 0 ||
                      member.interests.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {member.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={`skill-${index}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.interests.slice(0, 2).map((interest, index) => (
                          <span
                            key={`interest-${index}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200/50"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More Pagination */}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-full text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs active:scale-95 transition-all duration-300 disabled:opacity-75 disabled:scale-100 cursor-pointer"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5D3EBB]" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load more members</span>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 flex flex-col gap-1 items-center">
              <span className="text-neutral-400 text-sm font-bold">
                No members found.
              </span>
              {search && (
                <span className="text-neutral-500 text-xs font-medium">
                  Try adjusting your search filters.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
