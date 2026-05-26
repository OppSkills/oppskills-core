"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { initialCommunityDetails, mockFollowers, mockPosts } from "./mockData";
import { Post, NestedComment, CommunityDetails } from "./types";
import CommunityHeader from "./CommunityHeader";
import AboutCard from "./AboutCard";
import FollowersSidebar from "./FollowersSidebar";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/common/ShareModal";
import EditDescriptionModal from "./EditDescriptionModal";
import CreatePostModal from "./CreatePostModal";

export default function CommunityDashboard() {
  const [details, setDetails] = useState<CommunityDetails>(initialCommunityDetails);
  const [followers] = useState(mockFollowers);
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  // Modal control states
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

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
      })
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
      })
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
      })
    );
  };

  // Handler for opening the Edit Post dialog
  const handleEditPostTrigger = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setPostToEdit(post);
      setIsCreatePostOpen(true);
    }
  };

  // Handler for publishing a created or edited post
  const handlePublishPost = (content: string, imageUrls: string[]) => {
    if (postToEdit) {
      // Edit mode
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postToEdit.id
            ? { ...post, content, images: imageUrls }
            : post
        )
      );
      toast.success("Post updated successfully.");
    } else {
      // Create mode
      const newPost: Post = {
        id: `post-${Date.now()}`,
        authorName: details.name,
        authorAvatar: details.logoUrl || "/logos/anthropic.png",
        followersCount: details.followers,
        timeframe: "Just now",
        content,
        images: imageUrls,
        likes: 0,
        commentsCount: 0,
        reposts: 0,
        shares: 0,
        isLiked: false,
        comments: [],
      };
      setPosts([newPost, ...posts]);
      toast.success("Post published successfully.");
    }
    setPostToEdit(null);
  };

  // Handler for updating community details / descriptions
  const handleUpdateDetails = (updatedFields: Partial<CommunityDetails>) => {
    setDetails((prev) => ({
      ...prev,
      ...updatedFields,
    }));
    toast.success("Community description updated successfully.");
  };

  const handleMockUpload = () => {
    // Generate beautiful random colors or Unsplash banner/logo
    const rand = Math.floor(Math.random() * 1000);
    setDetails((prev) => ({
      ...prev,
      bannerUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80&rand=${rand}`,
      logoUrl: `https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=200&h=200&fit=crop&rand=${rand}`,
    }));
    toast.success("Banner and Logo updated from media library.");
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
            onCreatePost={() => {
              setPostToEdit(null);
              setIsCreatePostOpen(true);
            }}
          />

          <AboutCard
            details={details}
            onEditAbout={() => setIsDescriptionOpen(true)}
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
                    onEdit={handleEditPostTrigger}
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
                  onClick={() => {
                    setPostToEdit(null);
                    setIsCreatePostOpen(true);
                  }}
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

      {/* Unified Edit Tagline/About Description Modal */}
      {isDescriptionOpen && (
        <EditDescriptionModal
          isOpen={isDescriptionOpen}
          onClose={() => setIsDescriptionOpen(false)}
          details={details}
          onUpdate={handleUpdateDetails}
        />
      )}

      {/* Floating Create / Edit Post Modal */}
      {isCreatePostOpen && (
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => {
            setIsCreatePostOpen(false);
            setPostToEdit(null);
          }}
          postToEdit={postToEdit}
          onPublish={handlePublishPost}
        />
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

