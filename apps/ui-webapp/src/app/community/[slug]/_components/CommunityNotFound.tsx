"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { AlertCircle, TrendingUp, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityCard } from "@/components/common/CommunityCard";
import {
  useTrendingCommunities,
  useFollowCommunity,
  useUnfollowCommunity,
} from "@/hooks/community/useCommunities";

interface CommunityNotFoundProps {
  handle: string;
}

export default function CommunityNotFound({ handle }: CommunityNotFoundProps) {
  const { isSignedIn, getToken } = useAuth();
  const [tokenState, setTokenState] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((tk) => setTokenState(tk ?? undefined));
    } else {
      setTokenState(undefined);
    }
  }, [isSignedIn, getToken]);

  const { data: trendingCommunities, isLoading: isLoadingTrending } =
    useTrendingCommunities(tokenState, 6);

  const followMutation = useFollowCommunity();
  const unfollowMutation = useUnfollowCommunity();

  const handleFollowClick = async (
    e: React.MouseEvent,
    communityId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast.error("Sign in to follow communities.");
      return;
    }
    try {
      await followMutation.mutateAsync(communityId);
      toast.success("Following community!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow.");
    }
  };

  const handleUnfollowClick = async (
    e: React.MouseEvent,
    communityId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    try {
      await unfollowMutation.mutateAsync(communityId);
      toast.success("Unfollowed community.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unfollow.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7]/40 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl flex flex-col gap-12 animate-in fade-in duration-500">
        {/* Not Found & Onboarding CTA Section */}
        <div className="w-full bg-white border border-neutral-200 rounded-3xl p-8 md:p-12 shadow-xs relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
          <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-[#5D3EBB]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Visual Icon Box */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[#E6E0FA] flex items-center justify-center text-[#5D3EBB] shrink-0 shadow-2xs">
            <Users className="w-10 h-10 md:w-12 md:h-12" />
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full max-w-fit mx-auto md:mx-0 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Community Not Found
            </span>
            <h1 className="text-3xl font-extrabold text-neutral-800 tracking-tight">
              @{handle.toLowerCase()} is up for grabs!
            </h1>
            <p className="text-neutral-500 text-sm md:text-base leading-relaxed max-w-xl">
              There is no community matching the handle{" "}
              <strong className="text-neutral-700">@{handle}</strong> on
              OppSkills. Be the pioneer and launch a community with this name
              today!
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
            <Link
              href={`/dashboard/community/create?handle=${encodeURIComponent(handle)}`}
              className="w-full"
            >
              <Button className="w-full bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-6 py-3 rounded-full text-sm h-11 flex items-center justify-center gap-2 shadow-xs transition-all duration-300 hover:scale-[1.02]">
                <Plus className="w-4 h-4" />
                Claim @{handle.toLowerCase()}
              </Button>
            </Link>
            <Link href="/feeds" className="w-full">
              <Button
                variant="outline"
                className="w-full border-neutral-300 text-neutral-600 font-bold px-6 py-3 rounded-full text-sm h-11 transition-all duration-300 hover:bg-neutral-50"
              >
                Explore Feed
              </Button>
            </Link>
          </div>
        </div>

        {/* Trending Communities Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
            <TrendingUp className="w-5 h-5 text-[#5D3EBB]" />
            <h2 className="text-xl font-extrabold text-neutral-800 tracking-tight">
              Explore Trending Communities
            </h2>
          </div>

          {isLoadingTrending ? (
            // Skeleton Loader (6 items grid)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-full h-[280px] bg-white rounded-3xl border border-neutral-200/50 p-4 flex flex-col gap-3"
                >
                  <div className="h-[110px] w-full bg-neutral-200 rounded-2xl" />
                  <div className="w-12 h-12 bg-neutral-200 rounded-xl -mt-8 ml-2 border-2 border-white" />
                  <div className="h-4 w-3/4 bg-neutral-200 rounded mt-2" />
                  <div className="h-3 w-1/2 bg-neutral-200 rounded" />
                </div>
              ))}
            </div>
          ) : trendingCommunities && trendingCommunities.length > 0 ? (
            // Grid of Community Cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCommunities.map((c) => {
                const isFollowed = c.myRole !== null && c.myRole !== undefined;
                return (
                  <div key={c.handle} className="relative group">
                    <CommunityCard
                      href={`/community/${c.handle}`}
                      title={c.name}
                      genre={c.industry}
                      memberCount={c.memberCount}
                      bannerUrl={c.coverImage}
                      avatarUrl={c.avatarImage}
                      roleBadge={c.myRole as any}
                    />

                    {/* Follow/Unfollow action button overlay */}
                    <div className="absolute bottom-4 right-4 z-30">
                      {isFollowed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full bg-white/95 border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-bold text-xs px-4 py-1 h-8 shadow-xs transition-all duration-300"
                          onClick={(e) => handleUnfollowClick(e, c.id)}
                          disabled={unfollowMutation.isPending}
                        >
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-full bg-[#5D3EBB] hover:bg-[#4c329c] text-white font-bold text-xs px-4 py-1 h-8 shadow-xs transition-all duration-300"
                          onClick={(e) => handleFollowClick(e, c.id)}
                          disabled={followMutation.isPending}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-white border border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-neutral-400 text-lg font-bold">
                No trending communities found.
              </span>
              <span className="text-neutral-500 text-sm">
                Check back later for trending communities!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
