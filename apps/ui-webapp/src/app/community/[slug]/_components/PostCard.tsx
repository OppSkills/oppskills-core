"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Share, Send, Loader2 } from "lucide-react";
import { Post } from "./types";
import ImageLightbox from "./ImageLightbox";
import PostContent from "./PostContent";
import PostEngagementBar from "./PostEngagementBar";
import PostImagesGrid from "./PostImagesGrid";
import QuotedPostCard from "./QuotedPostCard";
import { usePostImpression } from "@/hooks/usePostImpression";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  communityHandle: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (postId: string) => void;
  onComment?: (postId: string, content: string) => Promise<void>;
  canManage?: boolean;
}

export default function PostCard({
  post,
  communityHandle,
  onLike,
  onDelete,
  onRepost,
  onShare,
  onComment,
  canManage = false,
}: PostCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const impressionRef = usePostImpression(post.id);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const formatK = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return count.toString();
  };

  const postHref = `/community/${communityHandle}/posts/${post.id}`;

  const handleCommentClick = () => {
    setShowCommentBox(true);
    // Focus input after state update
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      if (onComment) {
        await onComment(post.id, trimmed);
      }
      setCommentText("");
      setShowCommentBox(false);
      // Navigate to post detail to see the new comment
      router.push(postHref);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div
      ref={impressionRef}
      className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-5 shadow-xs relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-100 bg-neutral-900 flex items-center justify-center font-bold text-white text-lg select-none shrink-0">
            {post.authorAvatar ? (
              <Image
                src={post.authorAvatar}
                alt={post.authorName}
                fill
                className="object-cover"
              />
            ) : (
              "AI"
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-extrabold text-neutral-800 text-sm sm:text-base leading-none truncate">
              {post.authorName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold">
              <span className="whitespace-nowrap">{formatK(post.followersCount)} Followers</span>
              <span>•</span>
              <span className="whitespace-nowrap">{post.timeframe}</span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 p-2 rounded-full transition-all duration-300"
            title="More Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-neutral-100 rounded-2xl shadow-xl z-40 py-2 overflow-hidden">
                {canManage && (
                  <button
                    onClick={() => {
                      onDelete(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    onShare(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Share className="w-4 h-4" /> Share
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {post.postKind === "QUOTE_REPOST" && post.content && (
        <PostContent content={post.content} />
      )}
      {post.repostedFrom && (
        <QuotedPostCard
          post={post.repostedFrom}
          communityHandle={communityHandle}
        />
      )}
      {(!post.postKind || post.postKind === "ORIGINAL") && (
        <PostContent content={post.content} />
      )}

      {post.images && post.images.length > 0 && post.postKind !== "REPOST" && (
        <PostImagesGrid images={post.images} onImageClick={handleImageClick} />
      )}

      {/* Engagement Bar */}
      <PostEngagementBar
        postId={post.id}
        likes={post.likes}
        commentsCount={post.commentsCount}
        reposts={post.reposts}
        isLiked={post.isLiked}
        isReposted={post.isReposted}
        onLike={() => onLike(post.id)}
        onRepost={() => onRepost(post.id)}
        onComment={handleCommentClick}
      />

      {/* Inline Comment Composer */}
      {showCommentBox && (
        <form
          onSubmit={handleCommentSubmit}
          className="flex items-start gap-2 pt-1 border-t border-neutral-100 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="relative flex-1 flex items-center bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200/80 focus-within:border-[#5D3EBB]/60 focus-within:bg-white rounded-2xl px-4 py-2.5 transition-all duration-300">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={isSubmittingComment}
              rows={2}
              className="w-full bg-transparent outline-none text-sm text-neutral-700 font-semibold placeholder-neutral-400 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  void handleCommentSubmit(e as unknown as React.FormEvent);
                }
                if (e.key === "Escape") {
                  setShowCommentBox(false);
                  setCommentText("");
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="rounded-full bg-[#2E1E66] hover:bg-[#1E1146] text-white shrink-0 h-9 w-9 p-0"
              title="Submit comment (Ctrl+Enter)"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowCommentBox(false);
                setCommentText("");
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600 font-semibold text-center"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={post.images || []}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
