"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Users,
  Check,
  UserPlus,
  Search,
  MessageSquare,
  ThumbsUp,
  Image as ImageIcon,
  Send,
  Loader2,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import PostCard from "@/app/community/[slug]/_components/PostCard";
import { CommunityCard } from "@/components/common/CommunityCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Post } from "@/app/community/[slug]/_components/types";
import type { CommunityPostCommentItem } from "@oppskills/types";

// Mock Communities Data
const MOCK_COMMUNITIES = [
  {
    href: "/community/nextjs-pioneers",
    title: "Next.js Pioneers",
    genre: "Tech",
    memberCount: 1250,
    bannerUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=600",
    avatarUrl: null,
    handle: "nextjs-pioneers"
  },
  {
    href: "/community/ai-builders",
    title: "AI Builders Club",
    genre: "Artificial Intelligence",
    memberCount: 4500,
    bannerUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600",
    avatarUrl: null,
    handle: "ai-builders"
  },
  {
    href: "/community/framer-wizards",
    title: "Framer Motion Wizards",
    genre: "UI Design",
    memberCount: 850,
    bannerUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600",
    avatarUrl: null,
    handle: "framer-wizards"
  },
  {
    href: "/community/solidity-devs",
    title: "Solidity Devs",
    genre: "Web3",
    memberCount: 2200,
    bannerUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600",
    avatarUrl: null,
    handle: "solidity-devs"
  }
];

// Mock Active Members (Follow Suggestions)
const MOCK_ACTIVE_MEMBERS = [
  {
    id: "member-1",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    role: "Full Stack @ Google",
    skills: ["React", "Next.js", "Go"],
    isFollowing: false
  },
  {
    id: "member-2",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    role: "AI Researcher @ Stanford",
    skills: ["PyTorch", "ML", "Python"],
    isFollowing: false
  },
  {
    id: "member-3",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    role: "UI/UX Designer @ Figma",
    skills: ["Design", "Framer", "Tailwind"],
    isFollowing: false
  },
  {
    id: "member-4",
    name: "Rohan Mehta",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    role: "Web3 Architect",
    skills: ["Solidity", "Rust", "DeFi"],
    isFollowing: false
  }
];

// Initial Mock Posts Data
const INITIAL_MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    authorName: "Sarah Jenkins",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    followersCount: 14500,
    timeframe: "2 hours ago",
    content: "Next.js 16 is looking absolutely mind-blowing! The new Turbopack compilation updates speed up local hot-module replacement by another 40%. Here's a quick benchmark showing build times comparing Next.js 15 Webpack vs Next.js 16 Turbopack in a large monorepo. Who else is migrating? 🚀",
    likes: 342,
    commentsCount: 3,
    reposts: 18,
    communityHandle: "nextjs-pioneers",
    isLiked: false,
    isReposted: false,
    images: ["https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=600"]
  },
  {
    id: "post-2",
    authorName: "Alex Rivera",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    followersCount: 8900,
    timeframe: "5 hours ago",
    content: "Just published a new guide on implementing advanced Retrieval-Augmented Generation (RAG) with local small language models (SLMs) like Llama-3-8B. The trick is to optimize vector search indexing and use dynamic context window compression to keep latencies under 200ms. Check it out and let me know your thoughts! 🤖",
    likes: 521,
    commentsCount: 2,
    reposts: 45,
    communityHandle: "ai-builders",
    isLiked: true,
    isReposted: false,
    images: []
  },
  {
    id: "post-3",
    authorName: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    followersCount: 24000,
    timeframe: "1 day ago",
    content: "Working on a new dashboard interface using glassmorphism and subtle micro-animations. Here is a preview of the workspace switcher animation built using Framer Motion. Smooth transitions make the interface feel so premium and responsive! ✨",
    likes: 789,
    commentsCount: 2,
    reposts: 92,
    communityHandle: "framer-wizards",
    isLiked: false,
    isReposted: true,
    images: ["https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600"]
  },
  {
    id: "post-4",
    authorName: "Rohan Mehta",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    followersCount: 3100,
    timeframe: "2 days ago",
    content: "Audit your Solidity smart contracts carefully! A common vulnerability is the reentrancy attack on withdrawal functions. Always make sure to use the Checks-Effects-Interactions pattern or inherit OpenZeppelin's ReentrancyGuard. Keep your protocols secure! 🔒",
    likes: 120,
    commentsCount: 1,
    reposts: 5,
    communityHandle: "solidity-devs",
    isLiked: false,
    isReposted: false,
    images: []
  }
];

// Mock Comments Data keyed by Post ID
const INITIAL_MOCK_COMMENTS: Record<string, CommunityPostCommentItem[]> = {
  "post-1": [
    {
      id: "comment-1-1",
      postId: "post-1",
      parentId: null,
      content: "Absolutely! The Turbopack dev speeds are a game changer. Can't wait to migrate our teams.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likeCount: 12,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-1", firstName: "Marcus", lastName: "Aurelius", imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" }
    },
    {
      id: "comment-1-2",
      postId: "post-1",
      parentId: null,
      content: "Is there any backward compatibility issues with older custom webpack configs?",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likeCount: 4,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-2", firstName: "Chloe", lastName: "Sutton", imageUrl: null }
    },
    {
      id: "comment-1-3",
      postId: "post-1",
      parentId: null,
      content: "Yeah, we had to refactor a couple of plugins but overall it's super smooth.",
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      likeCount: 8,
      isLikedByMe: true,
      replyCount: 0,
      author: { id: "user-3", firstName: "Devon", lastName: "Lane", imageUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" }
    }
  ],
  "post-2": [
    {
      id: "comment-2-1",
      postId: "post-2",
      parentId: null,
      content: "Amazing writeup Alex. Love the vectors indexing deep dive.",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      likeCount: 15,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-4", firstName: "Dianne", lastName: "Russell", imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" }
    },
    {
      id: "comment-2-2",
      postId: "post-2",
      parentId: null,
      content: "Which database did you choose for storing embeddings? Chroma or pgvector?",
      createdAt: new Date(Date.now() - 28800000).toISOString(),
      likeCount: 6,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-5", firstName: "Guy", lastName: "Hawkins", imageUrl: null }
    }
  ],
  "post-3": [
    {
      id: "comment-3-1",
      postId: "post-3",
      parentId: null,
      content: "Framer Motion transitions are always so satisfying. Top tier design work!",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likeCount: 20,
      isLikedByMe: true,
      replyCount: 0,
      author: { id: "user-6", firstName: "Kristin", lastName: "Watson", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" }
    },
    {
      id: "comment-3-2",
      postId: "post-3",
      parentId: null,
      content: "Can you share the springs configurations you used?",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likeCount: 3,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-7", firstName: "Cody", lastName: "Fisher", imageUrl: null }
    }
  ],
  "post-4": [
    {
      id: "comment-4-1",
      postId: "post-4",
      parentId: null,
      content: "Solid advice. Reentrancy is still one of the biggest reasons for hacks.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      likeCount: 9,
      isLikedByMe: false,
      replyCount: 0,
      author: { id: "user-8", firstName: "Jane", lastName: "Cooper", imageUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=100" }
    }
  ]
};

export default function FeedsPage() {
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useUser();

  // Local States
  const [posts, setPosts] = useState<Post[]>(INITIAL_MOCK_POSTS);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityPostCommentItem[]>>(INITIAL_MOCK_COMMENTS);
  const [activeMembers, setActiveMembers] = useState(MOCK_ACTIVE_MEMBERS);
  
  // Composer state
  const [newPostText, setNewPostText] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("nextjs-pioneers");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Seed TanStack Query Cache with mock comments on mount/user state change
  useEffect(() => {
    posts.forEach((post) => {
      const comments = commentsMap[post.id] || [];
      const commentsData = {
        pages: [
          {
            items: comments,
            hasMore: false,
            nextCursor: undefined,
          },
        ],
        pageParams: [undefined],
      };

      // Set for both true & false states of isSignedIn to prevent caching issues
      queryClient.setQueryData(
        ["community-post-comments", post.communityHandle || "general", post.id, 5, true],
        commentsData
      );
      queryClient.setQueryData(
        ["community-post-comments", post.communityHandle || "general", post.id, 5, false],
        commentsData
      );
    });
  }, [posts, commentsMap, queryClient, isSignedIn]);

  // Handlers
  const handleLike = (postId: string) => {
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

  const handleDelete = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    toast.success("Post deleted successfully");
  };

  const handleRepost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isReposted = !post.isReposted;
          return {
            ...post,
            isReposted,
            reposts: isReposted ? post.reposts + 1 : post.reposts - 1,
          };
        }
        return post;
      })
    );
    toast.success("Post reposted");
  };

  const handleShare = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const url = `${window.location.origin}/community/${post.communityHandle}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  const handleComment = async (postId: string, content: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newCommentItem: CommunityPostCommentItem = {
      id: `comment-${postId}-${Date.now()}`,
      postId,
      parentId: null,
      content,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLikedByMe: false,
      replyCount: 0,
      author: {
        id: user?.id || "anonymous",
        firstName: user?.firstName || "Community",
        lastName: user?.lastName || "Member",
        imageUrl: user?.imageUrl || null,
      },
    };

    // Update local comments map
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [newCommentItem, ...(prev[postId] || [])],
    }));

    // Update posts counts
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
          };
        }
        return p;
      })
    );

    toast.success("Comment added!");
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text) return;

    setIsSubmittingPost(true);

    setTimeout(() => {
      const newPostId = `post-${Date.now()}`;
      const comm = MOCK_COMMUNITIES.find((c) => c.handle === selectedCommunity);

      const newPost: Post = {
        id: newPostId,
        authorName: user?.fullName || "Anonymous Student",
        authorAvatar: user?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        followersCount: 1,
        timeframe: "Just now",
        content: text,
        likes: 0,
        commentsCount: 0,
        reposts: 0,
        communityHandle: selectedCommunity,
        isLiked: false,
        isReposted: false,
        images: []
      };

      setPosts([newPost, ...posts]);
      setCommentsMap((prev) => ({
        ...prev,
        [newPostId]: [],
      }));

      setNewPostText("");
      setIsSubmittingPost(false);
      toast.success(`Posted in ${comm?.title || "Community"}!`);
    }, 800);
  };

  const handleFollowToggle = (memberId: string) => {
    setActiveMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const isFollowing = !m.isFollowing;
          if (isFollowing) {
            toast.success(`Following ${m.name}`);
          }
          return {
            ...m,
            isFollowing,
          };
        }
        return m;
      })
    );
  };

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
              Explore ongoing discussions, technical questions, project updates, and events directly from your favorite student communities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* ── LEFT COLUMN: TRENDING COMMUNITIES (3 Cols) ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="flex items-center gap-2 px-1">
                <TrendingUp className="w-5 h-5 text-[#5D3EBB]" />
                <h2 className="font-aeonicPro text-lg font-bold text-neutral-800 tracking-tight">
                  Trending Communities
                </h2>
              </div>
              <div className="flex flex-col gap-5">
                {MOCK_COMMUNITIES.map((c) => (
                  <CommunityCard
                    key={c.handle}
                    href={c.href}
                    title={c.title}
                    genre={c.genre}
                    memberCount={c.memberCount}
                    bannerUrl={c.bannerUrl}
                    avatarUrl={c.avatarUrl}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── CENTER COLUMN: FEED & COMPOSER (6 Cols) ── */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            
            {/* Functional Post Composer Box */}
            <div className="w-full bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex gap-3 items-start">
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
                  <Textarea
                    placeholder="Share something with your communities..."
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    className="w-full min-h-[80px] bg-neutral-50/50 border-neutral-200 focus:bg-white rounded-2xl p-4 text-sm font-semibold placeholder-neutral-400 focus:border-[#5D3EBB]/60 focus:ring-0 resize-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-neutral-100 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold whitespace-nowrap">Post in:</span>
                  <Select
                    value={selectedCommunity}
                    onValueChange={setSelectedCommunity}
                  >
                    <SelectTrigger className="w-[180px] bg-neutral-50 border-neutral-200 text-xs font-semibold rounded-xl text-neutral-700 h-9">
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      {MOCK_COMMUNITIES.map((c) => (
                        <SelectItem
                          key={c.handle}
                          value={c.handle}
                          className="text-xs font-semibold text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 cursor-pointer"
                        >
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmittingPost || !newPostText.trim()}
                  className="rounded-full bg-[#2E1E66] hover:bg-[#1E1146] text-white px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 h-9"
                >
                  {isSubmittingPost ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="flex flex-col gap-6">
              <AnimatePresence initial={false}>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostCard
                      post={post}
                      communityHandle={post.communityHandle || "general"}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onRepost={handleRepost}
                      onShare={handleShare}
                      onComment={handleComment}
                      canManage={post.authorName === user?.fullName || post.id.startsWith("post-")}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT COLUMN: ACTIVE MEMBERS SUGGESTIONS (3 Cols) ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="flex items-center gap-2 px-1">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="font-aeonicPro text-lg font-bold text-neutral-800 tracking-tight">
                  Suggested Members
                </h2>
              </div>

              <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                {activeMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 group border-b border-neutral-100/60 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-100 shrink-0 select-none bg-neutral-900 flex items-center justify-center font-bold text-white text-sm">
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-neutral-800 text-sm truncate leading-none">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-bold truncate mt-1">
                          {m.role}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.skills.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollowToggle(m.id)}
                      className={`
                        p-1.5 rounded-full shrink-0 transition-all cursor-pointer border
                        ${
                          m.isFollowing
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            : "bg-primary-50 border-primary-200 text-[#5D3EBB] hover:bg-primary-100"
                        }
                      `}
                      title={m.isFollowing ? "Following" : "Follow"}
                    >
                      {m.isFollowing ? (
                        <Check className="w-4 h-4 stroke-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 stroke-2" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Info / Showcase Card */}
              <div className="bg-gradient-to-br from-[#1E1146] to-[#2E1E66] text-white rounded-3xl p-6 shadow-md relative overflow-hidden select-none">
                <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex flex-col gap-3 relative z-10">
                  <Award className="w-8 h-8 text-amber-300 fill-amber-300" />
                  <h3 className="font-aeonicPro text-lg font-bold tracking-tight">
                    OppSkills Leaderboard
                  </h3>
                  <p className="text-xs text-white/80 font-semibold leading-relaxed">
                    Earn points by posting tutorials, helping others resolve code issues, or organizing community meets. Join a community today!
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
    </div>
  );
}
