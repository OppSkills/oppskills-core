import type { CommunityPostKind, CommunityPostRepostedFromSummary } from "@oppskills/types";

export interface CommunityDetails {
  name: string;
  handle: string;
  isVerified: boolean;
  followers: number;
  following: number;
  bannerUrl: string | null;
  logoUrl: string | null;
  website: string | null;
  description: string;
  aboutText: string;
}

export interface Follower {
  id: string;
  name: string;
  avatar: string;
  followersCount: number;
  timeframe: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  followersCount: number;
  timeframe: string;
  content: string;
  images?: string[];
  likes: number;
  commentsCount: number;
  reposts: number;
  postKind?: CommunityPostKind;
  repostedFrom?: CommunityPostRepostedFromSummary;
  isLiked?: boolean;
  isReposted?: boolean;
  communityHandle?: string;
}
