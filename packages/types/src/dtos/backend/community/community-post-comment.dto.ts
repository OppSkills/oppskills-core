export type CommunityPostCommentStatus = 'PUBLISHED' | 'DELETED';

export interface CreateCommunityPostCommentDto {
  content: string;
  parentId?: string;
}

export interface CommunityPostCommentAuthor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface CommunityPostCommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  isLikedByMe?: boolean;
  author: CommunityPostCommentAuthor;
  createdAt: string;
}

export interface CommunityPostCommentListResponse {
  items: CommunityPostCommentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ToggleCommunityPostCommentLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface DeleteCommunityPostCommentResponse {
  success: boolean;
}
