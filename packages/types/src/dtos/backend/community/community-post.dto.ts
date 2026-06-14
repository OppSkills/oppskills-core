import type { CommunityIndustryValue } from "../../../enums/community-industry";

export type CommunityPostStatus = "PUBLISHED" | "DELETED";

export type CommunityPostKind = "ORIGINAL" | "REPOST" | "QUOTE_REPOST";

export interface CreateCommunityPostDto {
  content: string;
  imageUrls?: string[];
  skillIds?: string[];
}

export interface UpdateCommunityPostDto {
  content?: string;
  imageUrls?: string[];
}

export interface CommunityPostAuthorInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface CommunityPostCommunityInfo {
  id: string;
  name: string;
  handle: string;
  avatarImage: string | null;
  memberCount?: number;
}

export interface CommunityPostRepostedFromSummary {
  id: string;
  content: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  createdAt: string;
  author: CommunityPostAuthorInfo;
  community: CommunityPostCommunityInfo;
  skills?: string[];
}
export interface CommunityPostFeedItem {
  id: string;
  content: string;
  images: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  postKind: CommunityPostKind;
  repostedFrom?: CommunityPostRepostedFromSummary;
  isLikedByMe?: boolean;
  isRepostedByMe?: boolean;
  author: CommunityPostAuthorInfo;
  createdAt: string;
  community: CommunityPostCommunityInfo;
  skills?: string[];
}

export interface CommunityPostFeedResponse {
  items: CommunityPostFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommunityPostDetailResponse extends CommunityPostFeedItem {}

export interface ToggleCommunityPostLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface CreateCommunityPostRepostDto {
  caption?: string;
}

export interface CreateCommunityPostRepostResponse {
  repostPostId: string;
  repostCount: number;
}

export interface UndoCommunityPostRepostResponse {
  success: boolean;
  repostCount: number;
}

export interface PublicCommunityListItem {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  industry: CommunityIndustryValue;
  coverImage: string | null;
  avatarImage: string | null;
  memberCount: number;
  postCount: number;
  createdAt: string;
  myRole?: CommunityMyRole;
}

export interface PublicCommunityListResponse {
  items: PublicCommunityListItem[];
  total: number;
  totalPages: number;
  page: number;
}

export type CommunityMyRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "READ_ONLY"
  | "FOLLOWER"
  | null;

export interface PublicCommunityProfile {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  website: string | null;
  industry: CommunityIndustryValue;
  coverImage: string | null;
  avatarImage: string | null;
  memberCount: number;
  postCount: number;
  repostCount: number;
  createdAt: string;
  myRole: CommunityMyRole;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
  website?: string;
  coverImage?: string;
  avatarImage?: string;
}
