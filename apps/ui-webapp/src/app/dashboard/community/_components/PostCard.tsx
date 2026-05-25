"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Share2,
  Send,
  Trash2,
  Edit,
  Share,
} from "lucide-react";
import { Post } from "./types";
import { cn } from "@/lib/utils";
import ImageLightbox from "./ImageLightbox";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onShare: (postId: string) => void;
}

export default function PostCard({
  post,
  onLike,
  onDelete,
  onAddComment,
  onToggleCommentLike,
  onShare,
}: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText("");
  };

  const formatK = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}k`;
    }
    return count.toString();
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-5 shadow-xs relative">
      {/* Post Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          {/* Author Logo */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-100 bg-neutral-900 flex items-center justify-center font-bold text-white text-lg select-none">
            {post.authorAvatar && post.authorAvatar.startsWith("/") ? (
              <div className="w-full h-full flex items-center justify-center font-serif bg-neutral-900 text-white">
                AI
              </div>
            ) : post.authorAvatar ? (
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

        {/* More Actions Dropdown */}
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
              <div className="absolute right-0 mt-2 w-44 bg-white border border-neutral-100 rounded-2xl shadow-xl z-40 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
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

      {/* Post Content Description */}
      <p className="text-neutral-700 text-sm sm:text-base leading-relaxed font-medium">
        {post.content}
      </p>

      {/* Post Images Grid / Multi-Image display */}
      {post.images && post.images.length > 0 && (
        <div
          className={cn(
            "w-full rounded-2xl overflow-hidden shadow-2xs border border-neutral-100",
            post.images.length > 1
              ? "grid grid-cols-2 gap-2"
              : "relative h-64 sm:h-96",
          )}
        >
          {post.images.map((img, index) => (
            <div
              key={index}
              onClick={() => handleImageClick(index)}
              className={cn(
                "relative w-full h-full cursor-zoom-in hover:opacity-95 transition-opacity",
                post.images!.length > 1 ? "h-44 sm:h-64" : "",
              )}
            >
              <Image
                src={img}
                alt={`Post Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Engagement Actions bar */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 select-none">
        <button
          onClick={() => onLike(post.id)}
          className={cn(
            "flex items-center gap-2 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-90 px-3 py-1.5 rounded-full",
            post.isLiked
              ? "text-[#5D3EBB] bg-[#E6E0FA]/40 shadow-xs"
              : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
          )}
        >
          <ThumbsUp
            className={cn("w-4 h-4", post.isLiked ? "fill-[#5D3EBB]" : "")}
          />
          <span>Liked ({post.likes})</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full transition-all",
            !showComments ? "opacity-60" : "",
          )}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment ({post.commentsCount})</span>
        </button>

        <button className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full active:scale-95 transition-all">
          <Repeat2 className="w-4 h-4" />
          <span>Repost ({post.reposts})</span>
        </button>

        <button
          onClick={() => onShare(post.id)}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share ({post.shares})</span>
        </button>
      </div>

      {/* Thread of Nested Comments */}
      {showComments && (
        <div className="flex flex-col gap-4 border-t border-neutral-100 pt-5">
          {/* Add Inline Comment entry */}
          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-3 w-full"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-200 bg-neutral-900 text-white font-serif flex items-center justify-center text-xs shrink-0 select-none">
              AI
            </div>
            <div className="relative flex-1 flex items-center bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200/80 focus-within:border-[#5D3EBB]/60 focus-within:bg-white rounded-full px-4 py-2 transition-all duration-300">
              <input
                type="text"
                placeholder="Type a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-neutral-700 font-semibold placeholder-neutral-400 pr-8"
              />
              <button
                type="submit"
                className="absolute right-2 text-neutral-400 hover:text-[#5D3EBB] p-1.5 rounded-full hover:bg-white/80 active:scale-90 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Comment Cards List */}
          {post.comments.length > 0 && (
            <div className="flex flex-col gap-4 pl-2 border-l-2 border-neutral-100">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    {/* Commenter Avatar */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-100 bg-neutral-900 flex items-center justify-center font-bold text-white text-xs shrink-0 select-none">
                      {comment.authorAvatar.startsWith("/") ? (
                        <div className="w-full h-full flex items-center justify-center font-serif bg-neutral-900 text-white text-[10px]">
                          AI
                        </div>
                      ) : (
                        <Image
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* Name & Time */}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-extrabold text-neutral-800 text-xs sm:text-sm">
                          {comment.authorName}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold">
                          <span>
                            {formatK(comment.followersCount)} Followers
                          </span>
                          <span>•</span>
                          <span>{comment.timeframe}</span>
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed font-semibold pr-2">
                        {comment.content}
                      </p>

                      {/* Comment actions */}
                      <div className="flex items-center gap-4 text-xs font-bold text-neutral-400 mt-1 select-none">
                        <button
                          onClick={() =>
                            onToggleCommentLike(post.id, comment.id)
                          }
                          className={cn(
                            "hover:text-[#5D3EBB] flex items-center gap-1 transition-colors",
                            comment.isLiked ? "text-[#5D3EBB]" : "",
                          )}
                        >
                          Liked ({comment.likes})
                        </button>
                        <span>•</span>
                        <button className="hover:text-neutral-600 transition-colors">
                          Reply (80)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
