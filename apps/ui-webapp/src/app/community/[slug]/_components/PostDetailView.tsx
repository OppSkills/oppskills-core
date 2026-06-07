"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import type { CommunityPostFeedItem } from "@oppskills/types";
import PostContent from "./PostContent";
import PostEngagementBar from "./PostEngagementBar";
import QuotedPostCard from "./QuotedPostCard";
import CommentComposer from "./CommentComposer";
import CommentThread from "./CommentThread";
import RepostModal from "./RepostModal";
import { ShareModal } from "@/components/common/ShareModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSafeToken } from "@/lib/auth-utils";
import { queuePostImpression } from "@/hooks/usePostImpression";
import {
  useCommunityPost,
  usePostComments,
  useCreatePostComment,
  useToggleCommunityPostLike,
  useRepostPost,
  useUndoRepost,
} from "@/hooks/useCommunityPosts";
import {
  formatAuthorName,
  getAuthorInitials,
  stripHtmlPreview,
  getDisplayUrl,
} from "./communityUtils";

interface PostDetailViewProps {
  handle: string;
  postId: string;
  communityId: string;
}

function PostBody({
  post,
  communityHandle,
}: {
  post: CommunityPostFeedItem;
  communityHandle: string;
}) {
  return (
    <>
      {post.postKind === "REPOST" && (
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
          Reposted
        </p>
      )}
      {post.postKind === "QUOTE_REPOST" && post.content && (
        <PostContent content={post.content} />
      )}
      {post.repostedFrom && (
        <QuotedPostCard
          post={post.repostedFrom}
          communityHandle={communityHandle}
        />
      )}
      {post.postKind === "ORIGINAL" && <PostContent content={post.content} />}
      {post.images.length > 0 && post.postKind !== "REPOST" && (
        <div
          className={cn(
            "w-full rounded-2xl overflow-hidden border border-neutral-100",
            post.images.length > 1
              ? "grid grid-cols-2 gap-2"
              : "relative h-64 sm:h-96",
          )}
        >
          {post.images.map((img, index) => (
            <div
              key={index}
              className={cn(
                "relative w-full",
                post.images.length > 1 ? "h-44 sm:h-64" : "h-64 sm:h-96",
              )}
            >
              <Image
                src={getDisplayUrl(img)}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function PostDetailView({
  handle,
  postId,
  communityId,
}: PostDetailViewProps) {
  const { isSignedIn, getToken } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRepostOpen, setIsRepostOpen] = useState(false);

  const { data: post, isLoading, error } = useCommunityPost(handle, postId);
  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: commentsLoading,
  } = usePostComments(handle, postId);

  const likeMutation = useToggleCommunityPostLike(communityId, handle);
  const commentMutation = useCreatePostComment(communityId, handle, postId);
  const repostMutation = useRepostPost(communityId, handle);
  const undoRepostMutation = useUndoRepost(communityId, handle);

  const comments = commentsData?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (post && isSignedIn && !trackedRef.current) {
      trackedRef.current = true;
      queuePostImpression(post.id, () => getSafeToken(getToken));
    }
  }, [post, isSignedIn, getToken]);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/community/${handle}/posts/${postId}`
      : `/community/${handle}/posts/${postId}`;

  const handleLike = async () => {
    if (!isSignedIn) {
      toast.error("Sign in to like posts.");
      return;
    }
    try {
      await likeMutation.mutateAsync(postId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to like.");
    }
  };

  const handleRepost = () => {
    if (!isSignedIn) {
      toast.error("Sign in to repost.");
      return;
    }
    setIsRepostOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3EBB]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-neutral-700">Post not found.</p>
        <Link
          href={`/community/${handle}`}
          className="text-[#5D3EBB] font-semibold mt-2 inline-block"
        >
          Back to community
        </Link>
      </div>
    );
  }

  const authorName = formatAuthorName(post.author);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        href={`/community/${handle}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#5D3EBB] w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {post.community.name}
      </Link>

      <article className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white font-bold shrink-0">
            {post.author.imageUrl ? (
              <Image
                src={post.author.imageUrl}
                alt={authorName}
                fill
                className="object-cover"
              />
            ) : (
              getAuthorInitials(post.author)
            )}
          </div>
          <div>
            <p className="font-extrabold text-neutral-800">{authorName}</p>
            <p className="text-xs text-neutral-400 font-bold">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        <PostBody post={post} communityHandle={handle} />

        <PostEngagementBar
          postId={post.id}
          likes={post.likeCount}
          commentsCount={post.commentCount}
          reposts={post.repostCount}
          isLiked={post.isLikedByMe}
          isReposted={post.isRepostedByMe}
          onLike={handleLike}
          onRepost={handleRepost}
          onShare={() => setIsShareOpen(true)}
        />
      </article>

      <section className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <h2 className="text-lg font-extrabold text-neutral-800">
          Comments ({post.commentCount})
        </h2>

        {isSignedIn ? (
          <CommentComposer
            onSubmit={async (content) => {
              await commentMutation.mutateAsync({ content });
            }}
          />
        ) : (
          <p className="text-sm text-neutral-500 font-semibold">
            Sign in to leave a comment.
          </p>
        )}

        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#5D3EBB]" />
          </div>
        ) : comments.length > 0 ? (
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                handle={handle}
                communityId={communityId}
                postId={postId}
              />
            ))}
            <div ref={loadMoreRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#5D3EBB]" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 font-semibold text-center py-6">
            No comments yet. Be the first to comment!
          </p>
        )}
      </section>

      <RepostModal
        isOpen={isRepostOpen}
        onClose={() => setIsRepostOpen(false)}
        isReposted={post.isRepostedByMe}
        onDirectRepost={async () => {
          await repostMutation.mutateAsync({ postId });
          toast.success("Reposted to your feed!");
        }}
        onQuoteRepost={async (caption) => {
          await repostMutation.mutateAsync({ postId, data: { caption } });
          toast.success("Reposted with caption!");
        }}
        onUndoRepost={
          post.isRepostedByMe
            ? async () => {
                await undoRepostMutation.mutateAsync(postId);
                toast.success("Repost removed.");
              }
            : undefined
        }
      />

      <ShareModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={`${post.community.name}'s Post`}
        description={stripHtmlPreview(post.content)}
        link={shareLink}
      />
    </div>
  );
}
