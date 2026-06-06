"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Trash2, Share } from "lucide-react";
import { Post } from "./types";
import ImageLightbox from "./ImageLightbox";
import PostContent from "./PostContent";
import PostEngagementBar from "./PostEngagementBar";
import PostImagesGrid from "./PostImagesGrid";
import QuotedPostCard from "./QuotedPostCard";

interface PostCardProps {
  post: Post;
  communityHandle: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (postId: string) => void;
  canManage?: boolean;
}

export default function PostCard({
  post,
  communityHandle,
  onLike,
  onDelete,
  onRepost,
  onShare,
  canManage = false,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const formatK = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return count.toString();
  };

  const commentHref = `/community/${communityHandle}/posts/${post.id}`;

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-5 shadow-xs relative">
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-100 bg-neutral-900 flex items-center justify-center font-bold text-white text-lg select-none">
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
          <div className="flex flex-col gap-0.5">
            <span className="font-extrabold text-neutral-800 text-sm sm:text-base leading-none">
              {post.authorName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold">
              <span>{formatK(post.followersCount)} Followers</span>
              <span>•</span>
              <span>{post.timeframe}</span>
            </div>
          </div>
        </div>

        <div className="relative">
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

      <PostEngagementBar
        postId={post.id}
        likes={post.likes}
        commentsCount={post.commentsCount}
        reposts={post.reposts}
        isLiked={post.isLiked}
        isReposted={post.isReposted}
        onLike={() => onLike(post.id)}
        onRepost={() => onRepost(post.id)}
        onShare={() => onShare(post.id)}
        commentHref={commentHref}
      />

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
