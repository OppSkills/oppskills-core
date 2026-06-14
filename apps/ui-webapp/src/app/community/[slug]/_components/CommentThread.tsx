"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp } from "lucide-react";
import type { CommunityPostCommentItem } from "@oppskills/types";
import { cn } from "@/lib/utils";
import {
  useCommentReplies,
  useCreatePostComment,
  useDebouncedCommentLike,
} from "@/hooks/community/useCommunityPosts";
import CommentComposer from "./CommentComposer";
import { formatAuthorName, getAuthorInitials } from "./communityUtils";

interface CommentThreadProps {
  comment: CommunityPostCommentItem;
  handle: string;
  communityId: string;
  postId: string;
}

function CommentLikeButton({
  isLiked,
  likeCount,
  onToggle,
}: {
  isLiked: boolean;
  likeCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 transition-colors",
        isLiked ? "text-[#5D3EBB]" : "text-neutral-400 hover:text-[#5D3EBB]",
      )}
    >
      <ThumbsUp
        className={cn("w-3.5 h-3.5", isLiked ? "fill-[#5D3EBB]" : "")}
      />
      Liked ({likeCount})
    </button>
  );
}

function ReplyItem({
  reply,
  communityId,
  handle,
  postId,
}: {
  reply: CommunityPostCommentItem;
  handle: string;
  communityId: string;
  postId: string;
}) {
  const { isLiked, likeCount, toggle } = useDebouncedCommentLike(
    communityId,
    handle,
    postId,
    reply.id,
    reply.isLikedByMe ?? false,
    reply.likeCount,
  );

  return (
    <div className="flex items-start gap-2.5 pl-2">
      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
        {reply.author.imageUrl ? (
          <Image
            src={reply.author.imageUrl}
            alt={formatAuthorName(reply.author)}
            fill
            className="object-cover"
            sizes="28px"
          />
        ) : (
          getAuthorInitials(reply.author)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-extrabold text-neutral-800 text-xs">
            {formatAuthorName(reply.author)}
          </span>
          <span className="text-[10px] text-neutral-400 font-bold">
            {formatDistanceToNow(new Date(reply.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed font-semibold mt-0.5">
          {reply.content}
        </p>
        <div className="mt-1 text-xs font-bold">
          <CommentLikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onToggle={toggle}
          />
        </div>
      </div>
    </div>
  );
}

export default function CommentThread({
  comment,
  handle,
  communityId,
  postId,
}: CommentThreadProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { isLiked, likeCount, toggle } = useDebouncedCommentLike(
    communityId,
    handle,
    postId,
    comment.id,
    comment.isLikedByMe ?? false,
    comment.likeCount,
  );
  const replyMutation = useCreatePostComment(communityId, handle, postId);

  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReplies(handle, postId, comment.id, {
    enabled: comment.replyCount > 0,
    take: 5,
  });

  const replies = repliesData?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {comment.author.imageUrl ? (
            <Image
              src={comment.author.imageUrl}
              alt={formatAuthorName(comment.author)}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            getAuthorInitials(comment.author)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-extrabold text-neutral-800 text-sm">
              {formatAuthorName(comment.author)}
            </span>
            <span className="text-[10px] text-neutral-400 font-bold">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-neutral-600 text-sm leading-relaxed font-semibold mt-0.5">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-neutral-400">
            <CommentLikeButton
              isLiked={isLiked}
              likeCount={likeCount}
              onToggle={toggle}
            />
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowReplyBox((v) => !v)}
              className="hover:text-neutral-600 transition-colors"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {showReplyBox && (
        <div className="ml-11">
          <CommentComposer
            placeholder="Write a reply..."
            onSubmit={async (content) => {
              await replyMutation.mutateAsync({
                content,
                parentId: comment.id,
              });
              setShowReplyBox(false);
            }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-11 flex flex-col gap-3 border-l-2 border-neutral-100 pl-3">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              handle={handle}
              communityId={communityId}
              postId={postId}
            />
          ))}
          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs font-bold text-[#5D3EBB] hover:underline w-fit"
            >
              {isFetchingNextPage
                ? "Loading replies..."
                : `Show more replies (${comment.replyCount - replies.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
