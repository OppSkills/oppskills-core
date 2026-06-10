"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Search, Users, Shield, Plus, Compass } from "lucide-react";
import { getMyCommunities, MyCommunityListItem } from "@/lib/api/communityApi";
import { CommunityCard } from "@/components/common/CommunityCard";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SkeletonCommunityGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="h-[280px] flex flex-col rounded-3xl border border-neutral-200/50 bg-white overflow-hidden animate-pulse"
      >
        <div className="h-[110px] bg-neutral-200 w-full" />
        <div className="pt-9 px-5 pb-5 flex flex-col flex-1 justify-between">
          <div className="flex flex-col gap-3">
            <div className="h-5 bg-neutral-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded w-1/4 animate-pulse" />
          </div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mt-auto animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export default function ProfileCommunitiesPage() {
  const { getToken, isLoaded } = useAuth();
  const [communities, setCommunities] = useState<
    ReadonlyArray<MyCommunityListItem>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchCommunities() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (token) {
          // Pass true to include followed communities
          const data = await getMyCommunities(token, true);
          setCommunities(data);
        }
      } catch (error) {
        console.error("Failed to load followed communities:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCommunities();
  }, [isLoaded, getToken]);

  const filteredCommunities = useMemo(() => {
    return communities.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.industry &&
          item.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.handle &&
          item.handle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "OWNER" && item.myRole === "OWNER") ||
        (roleFilter === "ADMIN" &&
          (item.myRole === "ADMIN" || item.myRole === "MODERATOR")) ||
        (roleFilter === "FOLLOWER" && item.myRole === "FOLLOWER");

      return matchesSearch && matchesRole;
    });
  }, [communities, searchQuery, roleFilter]);

  const counts = useMemo(() => {
    return {
      ALL: communities.length,
      OWNER: communities.filter((c) => c.myRole === "OWNER").length,
      ADMIN: communities.filter(
        (c) => c.myRole === "ADMIN" || c.myRole === "MODERATOR",
      ).length,
      FOLLOWER: communities.filter((c) => c.myRole === "FOLLOWER").length,
    };
  }, [communities]);

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="profile-communities"
      className="w-full flex flex-col gap-6"
      fallback={
        <div className="w-full flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="h-8 bg-neutral-200 rounded w-48 animate-pulse" />
            <div className="h-10 bg-neutral-200 rounded w-32 animate-pulse" />
          </div>
          <SkeletonCommunityGrid />
        </div>
      }
    >
      <div className="w-full flex flex-col gap-6 bg-white rounded-3xl p-6 md:p-8 border border-neutral-200/50 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-aeonicPro text-neutral-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              My Communities
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage and explore all the communities you follow, curate, or
              administer.
            </p>
          </div>
          <Link href="/community" prefetch={false}>
            <Button className="rounded-2xl flex items-center gap-2 font-semibold shadow-sm hover:shadow transition-all bg-primary-600 hover:bg-primary-700 text-white border-none">
              <Compass className="w-4 h-4" />
              Explore More
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-b border-neutral-200/60 pb-5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-2xl max-w-fit">
            {(["ALL", "OWNER", "ADMIN", "FOLLOWER"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === role
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 hover:bg-white/30"
                }`}
              >
                {role === "ALL" && `All (${counts.ALL})`}
                {role === "OWNER" && `Owned (${counts.OWNER})`}
                {role === "ADMIN" && `Administered (${counts.ADMIN})`}
                {role === "FOLLOWER" && `Following (${counts.FOLLOWER})`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Community Grid */}
        {filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCommunities.map((item) => (
              <CommunityCard
                key={item.id}
                href={`/community/${item.handle}`}
                title={item.name}
                genre={item.industry}
                memberCount={0}
                bannerUrl={item.coverImage}
                avatarUrl={item.avatarImage}
                roleBadge={item.myRole}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-neutral-100 rounded-3xl mt-4 min-h-[350px]">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800">
              No communities found
            </h3>
            <p className="text-neutral-500 text-sm mt-2 max-w-md">
              {searchQuery || roleFilter !== "ALL"
                ? "No communities match your current search queries or filter selections."
                : "You aren't associated with any communities yet. Try discovering new groups to join!"}
            </p>
            {(searchQuery || roleFilter !== "ALL") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                }}
                className="mt-4 rounded-2xl font-bold"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </BoneyardSkeleton>
  );
}
