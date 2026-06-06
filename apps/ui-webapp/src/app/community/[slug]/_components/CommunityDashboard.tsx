"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import CommunityHeader from "./CommunityHeader";
import AboutCard from "./AboutCard";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import EditDescriptionModal from "./EditDescriptionModal";
import RepostModal from "./RepostModal";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/common/ShareModal";
import { CommunityDetails, Post } from "./types";

import {
  followCommunity,
  getPublicCommunityByHandle,
  unfollowCommunity,
  updateCommunity,
} from "@/lib/api/communityApi";
import {
  useCommunityPosts,
  useCreateCommunityPost,
  useDeleteCommunityPost,
  useToggleCommunityPostLike,
  useRepostPost,
  useUndoRepost,
} from "@/hooks/useCommunityPosts";
import { stripHtmlPreview } from "./communityUtils";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

interface CommunityDashboardProps {
  handle: string;
}

function canManageCommunity(myRole: string | null | undefined): boolean {
  return myRole === "OWNER" || myRole === "ADMIN" || myRole === "MODERATOR";
}

export default function CommunityDashboard({
  handle,
}: CommunityDashboardProps) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRepostOpen, setIsRepostOpen] = useState(false);
  const [repostPostId, setRepostPostId] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["community-profile", handle, isSignedIn],
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : undefined;
      return getPublicCommunityByHandle(handle, token ?? undefined);
    },
    enabled: !!handle,
  });

  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityPosts(handle, { enabled: !!handle });

  const createPostMutation = useCreateCommunityPost(profile?.id ?? "", handle);
  const deletePostMutation = useDeleteCommunityPost(profile?.id ?? "", handle);
  const likeMutation = useToggleCommunityPostLike(profile?.id ?? "", handle);
  const repostMutation = useRepostPost(profile?.id ?? "", handle);
  const undoRepostMutation = useUndoRepost(profile?.id ?? "", handle);

  const canManage = canManageCommunity(profile?.myRole);
  const isFollowing = profile?.myRole === "READ_ONLY";

  const details: CommunityDetails | null = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name,
      handle: profile.handle,
      isVerified: false,
      followers: profile.memberCount,
      following: profile.postCount,
      bannerUrl: profile.coverImage,
      logoUrl: profile.avatarImage,
      website: profile.website,
      description: profile.description ?? "",
      aboutText: profile.description ?? "",
    };
  }, [profile]);

  const posts: Post[] = useMemo(() => {
    const items = postsData?.pages.flatMap((p) => p.items) ?? [];
    return items.map((item) => ({
      id: item.id,
      authorName: item.community.name,
      authorAvatar: item.community.avatarImage ?? "",
      followersCount: profile?.memberCount ?? 0,
      timeframe: formatDistanceToNow(new Date(item.createdAt), {
        addSuffix: true,
      }),
      content: item.content,
      images: item.images,
      likes: item.likeCount,
      commentsCount: item.commentCount,
      reposts: item.repostCount,
      postKind: item.postKind,
      repostedFrom: item.repostedFrom,
      isLiked: item.isLikedByMe ?? false,
      isReposted: item.isRepostedByMe ?? false,
      communityHandle: item.community.handle,
    }));
  }, [postsData, profile?.memberCount]);

  async function uploadImageFile(
    file: File,
    purpose: "COMMUNITY_COVER" | "COMMUNITY_AVATAR" | "COMMUNITY_POST_IMAGE",
  ): Promise<string | null> {
    const token = await getToken();
    if (!token) {
      toast.error("Please sign in to upload.");
      return null;
    }

    const presign = await presignImageUpload(token, {
      purpose,
      mimeType: file.type,
    });
    await uploadImageToS3PresignedPost({ presign, file });

    const publicUrl = presign.publicUrl.startsWith("http")
      ? presign.publicUrl
      : presign.publicUrl.startsWith("//")
        ? `https:${presign.publicUrl}`
        : `https://${presign.publicUrl}`;

    return publicUrl;
  }

  async function resolveImageUrls(images: string[]): Promise<string[]> {
    const urls: string[] = [];
    for (const img of images) {
      if (img.startsWith("http://") || img.startsWith("https://")) {
        urls.push(img);
        continue;
      }
      if (img.startsWith("blob:")) {
        try {
          const res = await fetch(img);
          const blob = await res.blob();
          const file = new File([blob], "post-image.jpg", {
            type: blob.type || "image/jpeg",
          });
          const uploaded = await uploadImageFile(file, "COMMUNITY_POST_IMAGE");
          if (uploaded) urls.push(uploaded);
        } catch {
          toast.error("Failed to upload an image.");
        }
      }
    }
    return urls;
  }

  const handleCreatePost = async (content: string, images: string[]) => {
    if (!profile) return;
    setIsUploadingImages(true);
    try {
      const imageUrls = await resolveImageUrls(images);
      await createPostMutation.mutateAsync({ content, imageUrls });
      toast.success("Post published!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create post.",
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    if (!isSignedIn) {
      toast.error("Sign in to follow this community.");
      return;
    }
    setIsFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Sign in to follow this community.");
        return;
      }
      await followCommunity(token, profile.id);
      await queryClient.invalidateQueries({
        queryKey: ["community-profile", handle],
      });
      toast.success(`You are now following ${profile.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setIsFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await unfollowCommunity(token, profile.id);
      await queryClient.invalidateQueries({
        queryKey: ["community-profile", handle],
      });
      toast.success(`You unfollowed ${profile.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unfollow.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isSignedIn) {
      toast.error("Sign in to like posts.");
      return;
    }
    try {
      await likeMutation.mutateAsync(postId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to like post.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostMutation.mutateAsync(postId);
      toast.success("Post deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete post.",
      );
    }
  };

  const handleSharePost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !details) return;
    setShareTitle(`${details.name}'s Post`);
    setShareDescription(stripHtmlPreview(post.content));
    setShareLink(
      `${typeof window !== "undefined" ? window.location.origin : ""}/community/${details.handle}/posts/${post.id}`,
    );
    setIsShareOpen(true);
  };

  const handleRepostPost = (postId: string) => {
    if (!isSignedIn) {
      toast.error("Sign in to repost.");
      return;
    }
    setRepostPostId(postId);
    setIsRepostOpen(true);
  };

  const repostTarget = repostPostId
    ? posts.find((p) => p.id === repostPostId)
    : null;

  const handleUpdateCommunity = async (updates: Partial<CommunityDetails>) => {
    if (!profile) return;
    const token = await getToken();
    if (!token) {
      toast.error("Please sign in to edit.");
      return;
    }
    try {
      await updateCommunity(token, profile.id, {
        description: updates.aboutText ?? updates.description,
        website:
          updates.website !== undefined
            ? updates.website || undefined
            : undefined,
        coverImage: updates.bannerUrl ?? undefined,
        avatarImage: updates.logoUrl ?? undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: ["community-profile", handle],
      });
      toast.success("Community updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const handleImageUpload = async (file: File, type: "cover" | "avatar") => {
    const purpose = type === "cover" ? "COMMUNITY_COVER" : "COMMUNITY_AVATAR";
    const url = await uploadImageFile(file, purpose);
    if (!url) return;
    if (type === "cover") {
      await handleUpdateCommunity({ bannerUrl: url });
    } else {
      await handleUpdateCommunity({ logoUrl: url });
    }
  };

  if (profileLoading) {
    return (
      <div className="w-full flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3EBB]" />
      </div>
    );
  }

  if (profileError || !details) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-bold text-neutral-700">
          Community not found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-500">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file, "cover");
          e.target.value = "";
        }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file, "avatar");
          e.target.value = "";
        }}
      />

      <div className="w-full flex flex-col gap-6">
        <CommunityHeader
          details={details}
          canManage={canManage}
          isFollowing={isFollowing}
          isFollowLoading={isFollowLoading}
          onEditCover={
            canManage ? () => coverInputRef.current?.click() : undefined
          }
          onEditAvatar={
            canManage ? () => avatarInputRef.current?.click() : undefined
          }
          onCreatePost={canManage ? () => setIsCreatingPost(true) : undefined}
          onFollow={canManage ? undefined : handleFollow}
          onUnfollow={canManage ? undefined : handleUnfollow}
        />

        <AboutCard
          details={details}
          onEditAbout={canManage ? () => setIsEditAboutOpen(true) : undefined}
        />

        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xl font-extrabold text-neutral-800 tracking-tight">
              Community Feed
            </h3>
            {isSignedIn && (
              <Link
                href={`/community/${handle}/activity`}
                className="text-sm font-bold text-[#5D3EBB] hover:underline"
              >
                My Activity
              </Link>
            )}
          </div>

          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#5D3EBB]" />
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col gap-6 w-full">
              {posts.map((post) => (
                <div key={post.id} id={`post-${post.id}`}>
                  <PostCard
                    post={post}
                    communityHandle={handle}
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                    onRepost={handleRepostPost}
                    onShare={handleSharePost}
                    canManage={canManage}
                  />
                </div>
              ))}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-full"
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more posts"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full bg-white border border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-neutral-400 text-lg font-bold">
                No posts yet.
              </span>
              <span className="text-neutral-500 text-sm">
                Be the first to create a post in this community!
              </span>
              {canManage && (
                <Button
                  onClick={() => setIsCreatingPost(true)}
                  className="mt-2 bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-6 rounded-full"
                >
                  Create Post
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
        onPublish={handleCreatePost}
      />

      <EditDescriptionModal
        isOpen={isEditAboutOpen}
        onClose={() => setIsEditAboutOpen(false)}
        details={details}
        onUpdate={handleUpdateCommunity}
      />

      <ShareModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={shareTitle}
        description={shareDescription}
        link={shareLink}
      />

      {repostPostId && (
        <RepostModal
          isOpen={isRepostOpen}
          onClose={() => {
            setIsRepostOpen(false);
            setRepostPostId(null);
          }}
          isReposted={repostTarget?.isReposted}
          onDirectRepost={async () => {
            await repostMutation.mutateAsync({ postId: repostPostId });
            toast.success("Reposted to your feed!");
          }}
          onQuoteRepost={async (caption) => {
            await repostMutation.mutateAsync({
              postId: repostPostId,
              data: { caption },
            });
            toast.success("Reposted with caption!");
          }}
          onUndoRepost={
            repostTarget?.isReposted
              ? async () => {
                  await undoRepostMutation.mutateAsync(repostPostId);
                  toast.success("Repost removed.");
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
