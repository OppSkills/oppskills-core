"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, TrendingUp, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

import PostCard from "@/app/community/[slug]/_components/PostCard";
import { CommunityCard } from "@/components/common/CommunityCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareModal } from "@/components/common/ShareModal";
import RepostModal from "@/app/community/[slug]/_components/RepostModal";
import CreatePostModal from "@/app/community/[slug]/_components/CreatePostModal";
import { usePublishing } from "@/hooks/community/usePublishing";
import PublishingProgressBanner from "@/app/community/[slug]/_components/PublishingProgressBanner";

import {
  useTrendingCommunities,
  usePostableCommunities,
  useFollowCommunity,
  useUnfollowCommunity,
} from "@/hooks/community/useCommunities";
import {
  useGlobalFeedPosts,
  useCreatePostGeneral,
  useDeletePostGeneral,
  useTogglePostLikeGeneral,
  useRepostPostGeneral,
  useUndoRepostGeneral,
  useCreateFeedPostCommentGeneral,
} from "@/hooks/community/useCommunityPosts";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

// Extracted stripHtmlPreview helper for ShareModal preview
function stripHtmlPreview(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export default function FeedsPage() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // Async token state for trending communities and postable communities queries
  const [tokenState, setTokenState] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((tk) => setTokenState(tk ?? undefined));
    } else {
      setTokenState(undefined);
    }
  }, [isSignedIn, getToken]);

  // Query Hooks
  const { data: trendingCommunities, isLoading: isLoadingTrending } =
    useTrendingCommunities(tokenState, 5);

  const { data: postableCommunities } = usePostableCommunities(tokenState);

  const {
    data: globalFeedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingFeed,
  } = useGlobalFeedPosts({ take: 10 });

  // Mutations
  const followMutation = useFollowCommunity();
  const unfollowMutation = useUnfollowCommunity();
  const createPostMutation = useCreatePostGeneral();
  const deletePostMutation = useDeletePostGeneral();
  const likeMutation = useTogglePostLikeGeneral();
  const repostMutation = useRepostPostGeneral();
  const undoRepostMutation = useUndoRepostGeneral();
  const commentMutation = useCreateFeedPostCommentGeneral();

  const { publishPost } = usePublishing();

  // Local state for modals & post actions
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Repost Modal state
  const [isRepostOpen, setIsRepostOpen] = useState(false);
  const [repostPostId, setRepostPostId] = useState<string | null>(null);

  // Share Modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareLink, setShareLink] = useState("");

  // Default target community selection
  useEffect(() => {
    if (
      postableCommunities &&
      postableCommunities.length > 0 &&
      !selectedCommunityId
    ) {
      setSelectedCommunityId(postableCommunities[0].id);
    }
  }, [postableCommunities, selectedCommunityId]);

  // Infinite Scroll Trigger Ref
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 },
    );
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Image Upload Helpers
  async function uploadImageFile(
    file: File,
    purpose: "COMMUNITY_POST_IMAGE",
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

  // Event Handlers
  const handleFollowClick = async (
    e: React.MouseEvent,
    communityId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast.error("Please sign in to follow communities.");
      return;
    }
    try {
      await followMutation.mutateAsync(communityId);
      toast.success("Following community!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow.");
    }
  };

  const handleCreatePost = (
    content: string,
    images: string[],
    skillIds?: string[],
  ) => {
    if (!selectedCommunityId) {
      toast.error("No target community selected.");
      return;
    }
    const targetComm = postableCommunities?.find(
      (c) => c.id === selectedCommunityId,
    );
    const targetHandle = targetComm?.handle || "";

    publishPost({
      communityId: selectedCommunityId,
      communityHandle: targetHandle,
      content,
      images,
      skillIds,
    });
    setIsCreatingPost(false);
  };

  // Map backend global feed items to frontend Post structure
  const mappedPosts = useMemo(() => {
    if (!globalFeedData) return [];
    return globalFeedData.pages.flatMap((page) =>
      page.items.map((item) => ({
        id: item.id,
        authorName: item.community.name,
        authorAvatar: item.community.avatarImage || "",
        followersCount: 0,
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
        communityId: item.community.id,
        authorId: item.author.id,
        skills: item.skills,
      })),
    );
  }, [globalFeedData]);

  const handleLike = async (postId: string) => {
    if (!isSignedIn) {
      toast.error("Sign in to like posts.");
      return;
    }
    const post = mappedPosts.find((p) => p.id === postId);
    if (!post) return;
    try {
      await likeMutation.mutateAsync({
        communityId: post.communityId,
        postId,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to like post.");
    }
  };

  const handleDelete = async (postId: string) => {
    const post = mappedPosts.find((p) => p.id === postId);
    if (!post) return;
    try {
      await deletePostMutation.mutateAsync({
        communityId: post.communityId,
        postId,
      });
      toast.success("Post deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete post.",
      );
    }
  };

  const handleRepost = (postId: string) => {
    if (!isSignedIn) {
      toast.error("Sign in to repost.");
      return;
    }
    setRepostPostId(postId);
    setIsRepostOpen(true);
  };

  const repostTarget = repostPostId
    ? mappedPosts.find((p) => p.id === repostPostId)
    : null;

  const handleDirectRepost = async () => {
    if (!repostTarget) return;
    try {
      await repostMutation.mutateAsync({
        communityId: repostTarget.communityId,
        postId: repostTarget.id,
      });
      toast.success("Post reposted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to repost.");
    }
  };

  const handleQuoteRepost = async (caption: string) => {
    if (!repostTarget) return;
    try {
      await repostMutation.mutateAsync({
        communityId: repostTarget.communityId,
        postId: repostTarget.id,
        data: { caption },
      });
      toast.success("Quote reposted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to quote repost.",
      );
    }
  };

  const handleUndoRepost = async () => {
    if (!repostTarget) return;
    try {
      await undoRepostMutation.mutateAsync({
        communityId: repostTarget.communityId,
        postId: repostTarget.id,
      });
      toast.success("Repost removed.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to undo repost.",
      );
    }
  };

  const handleComment = async (postId: string, content: string) => {
    const post = mappedPosts.find((p) => p.id === postId);
    if (!post) return;
    try {
      await commentMutation.mutateAsync({
        communityId: post.communityId,
        postId,
        content,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add comment.",
      );
      throw err;
    }
  };

  const handleShare = (postId: string) => {
    const post = mappedPosts.find((p) => p.id === postId);
    if (!post) return;
    setShareTitle("Share Post");
    setShareDescription(stripHtmlPreview(post.content));
    setShareLink(
      `${window.location.origin}/community/${post.communityHandle}/posts/${post.id}`,
    );
    setIsShareOpen(true);
  };

  // Show posting option only if signed in and has at least one postable community
  const hasPostingAccess =
    isSignedIn && postableCommunities && postableCommunities.length > 0;

  return (
    <div className="w-full min-h-screen bg-[#F6F8FA] text-neutral-900 pb-16">
      {/* Dynamic Welcome Header Banner */}
      <div className="relative w-full bg-gradient-to-r from-[#1E1146] via-[#2E1E66] to-[#5D3EBB] text-white py-12 md:py-16 overflow-hidden select-none">
        {/* Glow decoration */}
        <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[150%] bg-[#5D3EBB]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[130%] bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition-all text-xs font-semibold rounded-full max-w-fit border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Mixed Community Feed
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-aeonicPro tracking-tight">
              Discover OppSkills Hub
            </h1>
            <p className="text-white/80 text-sm md:text-base font-semibold leading-relaxed">
              Explore ongoing discussions, technical questions, project updates,
              and events directly from your favorite student communities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-12 gap-8">
          {/* ── LEFT COLUMN: TRENDING COMMUNITIES (3 Cols) ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div
              className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 flex flex-col gap-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex items-center gap-2 px-1">
                <TrendingUp className="w-5 h-5 text-[#5D3EBB]" />
                <h2 className="font-aeonicPro text-lg font-bold text-neutral-800 tracking-tight">
                  Trending Communities
                </h2>
              </div>
              <div className="flex flex-col gap-5">
                {isLoadingTrending ? (
                  // Loading Skeleton for Trending
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-full h-[280px] bg-white rounded-3xl border border-neutral-200/50 p-4 flex flex-col gap-3 animate-pulse"
                    >
                      <div className="h-[110px] w-full bg-neutral-200 rounded-2xl" />
                      <div className="w-12 h-12 bg-neutral-200 rounded-xl -mt-8 ml-2 border-2 border-white" />
                      <div className="h-4 w-3/4 bg-neutral-200 rounded mt-2" />
                      <div className="h-3 w-1/2 bg-neutral-200 rounded" />
                    </div>
                  ))
                ) : trendingCommunities && trendingCommunities.length > 0 ? (
                  trendingCommunities.map((c) => {
                    const isFollowed =
                      c.myRole !== null && c.myRole !== undefined;
                    return (
                      <div key={c.handle} className="relative group p-1">
                        <CommunityCard
                          href={`/community/${c.handle}`}
                          title={c.name}
                          genre={c.industry}
                          memberCount={c.memberCount}
                          bannerUrl={c.coverImage}
                          avatarUrl={c.avatarImage}
                          roleBadge={c.myRole as any}
                        />
                        {/* Follow overlay button shown if not already followed */}
                        {!isFollowed && (
                          <div className="absolute bottom-4 right-4 z-30">
                            <Button
                              size="sm"
                              className="rounded-full bg-[#5D3EBB] hover:bg-[#4c329c] text-white font-bold text-xs px-4 py-1 h-8 shadow-sm transition-all"
                              onClick={(e) => handleFollowClick(e, c.id)}
                              disabled={followMutation.isPending}
                            >
                              Follow
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-400 font-semibold pl-1">
                    No trending communities found.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── CENTER COLUMN: FEED & COMPOSER (6 Cols) ── */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            {/* Functional Post Composer Box - Shown if user has write access to >= 1 community */}
            {hasPostingAccess && (
              <div className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
                <div
                  className="flex gap-3 items-start cursor-pointer"
                  onClick={() => setIsCreatingPost(true)}
                >
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-neutral-100 bg-neutral-900 flex items-center justify-center font-bold text-white text-lg shrink-0">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      "U"
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="w-full min-h-[44px] bg-neutral-50/50 border border-neutral-200 hover:bg-neutral-50 rounded-2xl p-3 text-sm font-semibold text-neutral-400 flex items-center transition-all">
                      Share something with your communities...
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-100 flex-wrap gap-3">
                  {postableCommunities && postableCommunities.length > 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 font-bold whitespace-nowrap">
                        Post in:
                      </span>
                      <Select
                        value={selectedCommunityId}
                        onValueChange={setSelectedCommunityId}
                      >
                        <SelectTrigger className="w-[180px] bg-neutral-50 border-neutral-200 text-xs font-semibold rounded-xl text-neutral-700 h-9">
                          <SelectValue placeholder="Select community" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-neutral-200">
                          {postableCommunities.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="text-xs font-semibold text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 cursor-pointer"
                            >
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : postableCommunities &&
                    postableCommunities.length === 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 font-bold">
                        Posting in:
                      </span>
                      <span className="text-xs text-[#5D3EBB] font-bold">
                        {postableCommunities[0].name}
                      </span>
                    </div>
                  ) : null}

                  <Button
                    onClick={() => setIsCreatingPost(true)}
                    className="rounded-full bg-[#2E1E66] hover:bg-[#1E1146] text-white px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 h-9"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Write Post</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="flex flex-col gap-6">
              <PublishingProgressBanner
                showAll={true}
                onEditDraft={(draft) => {
                  localStorage.setItem(
                    "community_post_draft",
                    JSON.stringify(draft),
                  );
                  setIsCreatingPost(true);
                }}
              />
              {isLoadingFeed ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 flex flex-col gap-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-1/4" />
                        <div className="h-3 bg-neutral-200 rounded w-1/6" />
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="h-4 bg-neutral-200 rounded" />
                      <div className="h-4 bg-neutral-200 rounded w-5/6" />
                    </div>
                  </div>
                ))
              ) : mappedPosts.length > 0 ? (
                <>
                  <AnimatePresence initial={false}>
                    {mappedPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PostCard
                          post={post}
                          communityHandle={post.communityHandle}
                          communityId={post.communityId}
                          onLike={handleLike}
                          onDelete={handleDelete}
                          onRepost={handleRepost}
                          onShare={handleShare}
                          onComment={handleComment}
                          canManage={isSignedIn && post.authorId === user?.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Infinite scroll loader trigger */}
                  <div ref={loaderRef} className="flex justify-center py-4">
                    {isFetchingNextPage ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#5D3EBB]" />
                    ) : hasNextPage ? (
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        className="rounded-full"
                      >
                        Load more posts
                      </Button>
                    ) : (
                      <span className="text-xs text-neutral-400 font-semibold">
                        You have caught up with all communities! 🎉
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full bg-white border border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="text-neutral-400 text-lg font-bold">
                    No posts yet.
                  </span>
                  <span className="text-neutral-500 text-sm">
                    Follow trending communities to start seeing posts in your
                    feed!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: QUICK INFO (3 Cols) ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Quick Info / Showcase Card */}
              <div className="bg-gradient-to-br from-[#1E1146] to-[#2E1E66] text-white rounded-3xl p-6 shadow-md relative overflow-hidden select-none">
                <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex flex-col gap-3 relative z-10">
                  <Award className="w-8 h-8 text-amber-300 fill-amber-300" />
                  <h3 className="font-aeonicPro text-lg font-bold tracking-tight">
                    OppSkills Leaderboard
                  </h3>
                  <p className="text-xs text-white/80 font-semibold leading-relaxed">
                    Earn points by posting tutorials, helping others resolve
                    code issues, or organizing community meets. Join a community
                    today!
                  </p>
                  <Link
                    href="/community"
                    className="mt-2 text-xs font-extrabold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 w-fit transition-all"
                  >
                    Browse Communities →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Modals */}
      {isCreatingPost && (
        <CreatePostModal
          isOpen={isCreatingPost}
          onClose={() => setIsCreatingPost(false)}
          onPublish={handleCreatePost}
        />
      )}

      {isRepostOpen && (
        <RepostModal
          isOpen={isRepostOpen}
          onClose={() => {
            setIsRepostOpen(false);
            setRepostPostId(null);
          }}
          isReposted={repostTarget?.isReposted}
          onDirectRepost={handleDirectRepost}
          onQuoteRepost={handleQuoteRepost}
          onUndoRepost={handleUndoRepost}
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
