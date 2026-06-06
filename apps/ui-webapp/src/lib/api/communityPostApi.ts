import type {
  CommunityPostFeedResponse,
  CommunityPostDetailResponse,
  CommunityPostCommentListResponse,
  CreateCommunityPostDto,
  CreateCommunityPostCommentDto,
  CreateCommunityPostRepostDto,
  CreateCommunityPostRepostResponse,
  ToggleCommunityPostLikeResponse,
  ToggleCommunityPostCommentLikeResponse,
  UpdateCommunityPostDto,
  CommunityPostFeedItem,
  CommunityPostCommentItem,
  UndoCommunityPostRepostResponse,
} from "@oppskills/types";
import { buildAuthHeaders, createApiClient } from "./apiClient";

const PUBLIC_API = createApiClient("/communities/public");
const AUTH_API = createApiClient("/communities");

export async function getCommunityPosts(
  handle: string,
  params: { cursor?: string; take?: number } = {},
  token?: string,
): Promise<CommunityPostFeedResponse> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await PUBLIC_API.get(`/${handle}/posts`, { params, headers });
  return res.data as CommunityPostFeedResponse;
}

export async function getCommunityPost(
  handle: string,
  postId: string,
  token?: string,
): Promise<CommunityPostDetailResponse> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await PUBLIC_API.get(`/${handle}/posts/${postId}`, { headers });
  return res.data as CommunityPostDetailResponse;
}

export async function getPostComments(
  handle: string,
  postId: string,
  params: { cursor?: string; take?: number } = {},
  token?: string,
): Promise<CommunityPostCommentListResponse> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await PUBLIC_API.get(`/${handle}/posts/${postId}/comments`, {
    params,
    headers,
  });
  return res.data as CommunityPostCommentListResponse;
}

export async function getCommentReplies(
  handle: string,
  postId: string,
  commentId: string,
  params: { cursor?: string; take?: number } = {},
  token?: string,
): Promise<CommunityPostCommentListResponse> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await PUBLIC_API.get(
    `/${handle}/posts/${postId}/comments/${commentId}/replies`,
    { params, headers },
  );
  return res.data as CommunityPostCommentListResponse;
}

export async function getUserFeed(
  handle: string,
  userId: string,
  params: { cursor?: string; take?: number } = {},
  token?: string,
): Promise<CommunityPostFeedResponse> {
  const headers = token ? buildAuthHeaders(token) : undefined;
  const res = await PUBLIC_API.get(`/${handle}/users/${userId}/feed`, {
    params,
    headers,
  });
  return res.data as CommunityPostFeedResponse;
}

export async function createCommunityPost(
  token: string,
  communityId: string,
  data: CreateCommunityPostDto,
): Promise<CommunityPostFeedItem> {
  const res = await AUTH_API.post(`/${communityId}/posts`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as CommunityPostFeedItem;
}

export async function updateCommunityPost(
  token: string,
  communityId: string,
  postId: string,
  data: UpdateCommunityPostDto,
): Promise<CommunityPostFeedItem> {
  const res = await AUTH_API.patch(`/${communityId}/posts/${postId}`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as CommunityPostFeedItem;
}

export async function deleteCommunityPost(
  token: string,
  communityId: string,
  postId: string,
): Promise<{ success: boolean }> {
  const res = await AUTH_API.delete(`/${communityId}/posts/${postId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as { success: boolean };
}

export async function toggleCommunityPostLike(
  token: string,
  communityId: string,
  postId: string,
): Promise<ToggleCommunityPostLikeResponse> {
  const res = await AUTH_API.post(
    `/${communityId}/posts/${postId}/like`,
    {},
    { headers: buildAuthHeaders(token) },
  );
  return res.data as ToggleCommunityPostLikeResponse;
}

export async function createPostComment(
  token: string,
  communityId: string,
  postId: string,
  data: CreateCommunityPostCommentDto,
): Promise<CommunityPostCommentItem> {
  const res = await AUTH_API.post(
    `/${communityId}/posts/${postId}/comments`,
    data,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as CommunityPostCommentItem;
}

export async function deletePostComment(
  token: string,
  communityId: string,
  postId: string,
  commentId: string,
): Promise<{ success: boolean }> {
  const res = await AUTH_API.delete(
    `/${communityId}/posts/${postId}/comments/${commentId}`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as { success: boolean };
}

export async function toggleCommentLike(
  token: string,
  communityId: string,
  postId: string,
  commentId: string,
): Promise<ToggleCommunityPostCommentLikeResponse> {
  const res = await AUTH_API.post(
    `/${communityId}/posts/${postId}/comments/${commentId}/like`,
    {},
    { headers: buildAuthHeaders(token) },
  );
  return res.data as ToggleCommunityPostCommentLikeResponse;
}

export async function createRepost(
  token: string,
  communityId: string,
  postId: string,
  data: CreateCommunityPostRepostDto = {},
): Promise<CreateCommunityPostRepostResponse> {
  const res = await AUTH_API.post(
    `/${communityId}/posts/${postId}/repost`,
    data,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as CreateCommunityPostRepostResponse;
}

export async function undoRepost(
  token: string,
  communityId: string,
  postId: string,
): Promise<UndoCommunityPostRepostResponse> {
  const res = await AUTH_API.delete(
    `/${communityId}/posts/${postId}/repost`,
    { headers: buildAuthHeaders(token) },
  );
  return res.data as UndoCommunityPostRepostResponse;
}
