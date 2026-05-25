export interface CommunityDetails {
  name: string;
  handle: string;
  isVerified: boolean;
  followers: number;
  following: number;
  bannerUrl: string | null;
  logoUrl: string | null;
  description: string;
  aboutText: string;
  aboutBullets: string[];
  aboutSecondaryText: string;
}

export interface Follower {
  id: string;
  name: string;
  avatar: string;
  followersCount: number;
  timeframe: string;
}

export interface NestedComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  followersCount: number;
  timeframe: string;
  content: string;
  likes: number;
  isLiked?: boolean;
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
  shares: number;
  isLiked?: boolean;
  isReposted?: boolean;
  comments: NestedComment[];
}
