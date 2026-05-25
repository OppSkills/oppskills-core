"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { initialCommunityDetails, mockFollowers, mockPosts } from "./mockData";
import { Post, NestedComment } from "./types";
import CommunityHeader from "./CommunityHeader";
import AboutCard from "./AboutCard";
import FollowersSidebar from "./FollowersSidebar";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/common/ShareModal";

export default function CommunityDashboard() {
  const [details, setDetails] = useState(initialCommunityDetails);
  const [followers] = useState(mockFollowers);
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  // New post modal states
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [attachImage, setAttachImage] = useState(false);

  // Share modal states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareDescription, setShareDescription] = useState("");

  const handleSharePost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setShareTitle(`${details.name}'s Post`);
    setShareDescription(post.content.substring(0, 100) + "...");
    setShareLink(`https://oppskills.com/c/${details.handle}/post/${post.id}`);
    setIsShareOpen(true);
  };

  // Handlers for post interactions
  const handleLikePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      }),
    );
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    toast.success("Post deleted successfully.");
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment: NestedComment = {
      id: `comment-${Date.now()}`,
      authorName: details.name,
      authorAvatar: details.logoUrl || "/logos/anthropic.png",
      followersCount: details.followers,
      timeframe: "Just now",
      content,
      likes: 0,
      isLiked: false,
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [newComment, ...post.comments],
          };
        }
        return post;
      }),
    );
    toast.success("Comment added.");
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map((comment) => {
              if (comment.id === commentId) {
                const isLiked = !comment.isLiked;
                return {
                  ...comment,
                  isLiked,
                  likes: isLiked ? comment.likes + 1 : comment.likes - 1,
                };
              }
              return comment;
            }),
          };
        }
        return post;
      }),
    );
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toast.error("Please enter some content for your post.");
      return;
    }

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: details.name,
      authorAvatar: details.logoUrl || "/logos/anthropic.png",
      followersCount: details.followers,
      timeframe: "Just now",
      content: newPostContent,
      images: attachImage
        ? [
            "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
          ]
        : [],
      likes: 0,
      commentsCount: 0,
      reposts: 0,
      shares: 0,
      isLiked: false,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setAttachImage(false);
    setIsCreatingPost(false);
    toast.success("Post created successfully!");
  };

  const handleMockUpload = () => {
    // Generate beautiful random colors or Unsplash banner/logo
    const rand = Math.floor(Math.random() * 1000);
    setDetails((prev) => ({
      ...prev,
      bannerUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80&rand=${rand}`,
      logoUrl: `https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=200&h=200&fit=crop&rand=${rand}`,
    }));
    toast.success("Banner and Logo updated from media library!");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* 2-Column Responsive Layout */}
      <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
        {/* Left main column: header, about, feed */}
        <div className="w-full lg:w-[68%] flex flex-col gap-6">
          <CommunityHeader
            details={details}
            onEditHeader={handleMockUpload}
            onCreatePost={() => setIsCreatingPost(true)}
          />

          <AboutCard
            details={details}
            onEditAbout={() =>
              toast.info("Mock feature: Community About editing form.")
            }
          />

          {/* Posts Feed section */}
          <div className="flex flex-col gap-5 w-full">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xl font-extrabold text-neutral-800 tracking-tight">
                Community Feed
              </h3>
            </div>

            {posts.length > 0 ? (
              <div className="flex flex-col gap-6 w-full">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                    onAddComment={handleAddComment}
                    onToggleCommentLike={handleToggleCommentLike}
                    onShare={handleSharePost}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full bg-white border border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <span className="text-neutral-400 text-lg font-bold">
                  No posts yet.
                </span>
                <span className="text-neutral-500 text-sm">
                  Be the first to create a post in this community!
                </span>
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="mt-2 bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-6 rounded-full"
                >
                  Create Post
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: Recent Followers */}
        <div className="w-full lg:w-[32%] sticky lg:top-8">
          <FollowersSidebar followers={followers} />
        </div>
      </div>

      {/* Floating Create Post Modal */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsCreatingPost(false)}
          />

          <div className="bg-white rounded-3xl w-full max-w-xl p-6 border border-neutral-100 shadow-2xl relative z-10 flex flex-col gap-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-extrabold text-neutral-800 tracking-tight">
                Create New Post
              </h3>
              <button
                onClick={() => setIsCreatingPost(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePostSubmit}
              className="flex flex-col gap-4"
            >
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What would you like to broadcast to your community?"
                className="w-full min-h-32 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:border-[#5D3EBB]/60 text-neutral-700 font-semibold placeholder-neutral-400 resize-none transition-all"
              />

              {/* Attach Image option */}
              <div className="flex items-center justify-between border-t border-b border-neutral-100 py-3">
                <button
                  type="button"
                  onClick={() => setAttachImage(!attachImage)}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-all px-3 py-1.5 rounded-full ${
                    attachImage
                      ? "text-[#5D3EBB] bg-[#E6E0FA]/40 shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <ImageIcon className="w-4.5 h-4.5" />
                  <span>{attachImage ? "Image Attached" : "Attach Image"}</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingPost(false)}
                  className="rounded-full font-semibold border-neutral-300 px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-6 rounded-full shadow-md transition-all duration-300"
                >
                  Publish Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ShareModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={shareTitle}
        description={shareDescription}
        link={shareLink}
      />
    </div>
  );
}
