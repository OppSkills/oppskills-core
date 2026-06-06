"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getPublicCommunityByHandle } from "@/lib/api/communityApi";
import { useUserFeed } from "@/hooks/useCommunityPosts";
import PostContent from "../_components/PostContent";
import QuotedPostCard from "../_components/QuotedPostCard";
import { formatAuthorName, getAuthorInitials } from "../_components/communityUtils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CommunityActivityPage() {
  const params = useParams();
  const handle = params.slug as string;
  const { userId, isSignedIn, getToken } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["community-profile", handle, isSignedIn],
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : undefined;
      return getPublicCommunityByHandle(handle, token ?? undefined);
    },
    enabled: !!handle && ready,
  });

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useUserFeed(handle, userId ?? "", {
    enabled: !!userId && !!handle && ready,
  });

  const items = feedData?.pages.flatMap((p) => p.items) ?? [];

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3EBB]" />
      </div>
    );
  }

  if (!isSignedIn || !userId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-bold text-neutral-700">Sign in to view your activity.</p>
        <Link href={`/community/${handle}`} className="text-[#5D3EBB] font-semibold mt-2 inline-block">
          Back to community
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <Link
        href={`/community/${handle}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#5D3EBB] w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {profile?.name ?? handle}
      </Link>

      <h1 className="text-2xl font-extrabold text-neutral-800">My Activity</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#5D3EBB]" />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.postKind === "ORIGINAL"
                  ? `/community/${handle}/posts/${item.id}`
                  : item.repostedFrom
                    ? `/community/${handle}/posts/${item.repostedFrom.id}`
                    : `#`
              }
              className="block bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs hover:border-[#5D3EBB]/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                  {item.author.imageUrl ? (
                    <Image
                      src={item.author.imageUrl}
                      alt={formatAuthorName(item.author)}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    getAuthorInitials(item.author)
                  )}
                </div>
                <div>
                  <p className="font-bold text-neutral-800 text-sm">
                    {item.postKind === "REPOST" && "You reposted · "}
                    {item.postKind === "QUOTE_REPOST" && "You reposted with caption · "}
                    {formatAuthorName(item.author)}
                  </p>
                  <p className="text-xs text-neutral-400 font-semibold">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {item.postKind === "QUOTE_REPOST" && item.content && (
                <PostContent content={item.content} />
              )}
              {item.repostedFrom && (
                <QuotedPostCard post={item.repostedFrom} communityHandle={handle} />
              )}
              {item.postKind === "ORIGINAL" && (
                <>
                  <PostContent content={item.content} />
                  {item.images[0] && (
                    <div className="relative w-full h-40 mt-3 rounded-xl overflow-hidden">
                      <Image src={item.images[0]} alt="" fill className="object-cover" />
                    </div>
                  )}
                </>
              )}
            </Link>
          ))}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-full"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-neutral-500 font-semibold text-center py-12">
          No activity yet. Create a post or repost something!
        </p>
      )}
    </div>
  );
}
