import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getCommunityPosts,
  getCommunityPost,
  getPostComments,
  getCommentReplies,
  getUserFeed,
  createCommunityPost,
  deleteCommunityPost,
  toggleCommunityPostLike,
  createPostComment,
  toggleCommentLike,
  createRepost,
  undoRepost,
  getGlobalFeedPosts,
} from "@/lib/api/communityPostApi";
import type {
  CreateCommunityPostDto,
  CreateCommunityPostCommentDto,
  CreateCommunityPostRepostDto,
  CommunityPostCommentListResponse,
  CommunityPostDetailResponse,
} from "@oppskills/types";
import { useCallback } from "react";
import { useOptimisticToggleLike } from "@/hooks/ui/useOptimisticToggleLike";

function updatePostInCache(queryClient: any, postId: string, updater: (post: any) => any) {
  // Update detail queries
  queryClient.getQueriesData({ queryKey: ["community-post"] }).forEach(([key]: any) => {
    if (key.includes(postId)) {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData) return oldData;
        return updater(oldData);
      });
    }
  });

  // Update lists
  const prefixes = [
    ["community-posts"],
    ["global-feed-posts"],
    ["community-user-feed"]
  ];
  prefixes.forEach((prefix) => {
    queryClient.getQueriesData({ queryKey: prefix }).forEach(([key]: any) => {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => {
            if (!page || !page.items) return page;
            return {
              ...page,
              items: page.items.map((item: any) => {
                if (item.id === postId) {
                  return updater(item);
                }
                return item;
              }),
            };
          }),
        };
      });
    });
  });
}

async function cancelAndSnapshotQueries(queryClient: any, postId: string) {
  const affectedQueries: [any, any][] = [];

  queryClient.getQueriesData({ queryKey: ["community-post"] }).forEach(([key]: any) => {
    if (key.includes(postId)) {
      affectedQueries.push([key, queryClient.getQueryData(key)]);
    }
  });

  const prefixes = [
    ["community-posts"],
    ["global-feed-posts"],
    ["community-user-feed"]
  ];
  prefixes.forEach((prefix) => {
    queryClient.getQueriesData({ queryKey: prefix }).forEach(([key]: any) => {
      affectedQueries.push([key, queryClient.getQueryData(key)]);
    });
  });

  for (const [key] of affectedQueries) {
    await queryClient.cancelQueries({ queryKey: key });
  }

  return affectedQueries;
}

export function useCommunityPosts(
  handle: string,
  options?: { enabled?: boolean; take?: number },
) {
  const { getToken, isSignedIn } = useAuth();
  const take = options?.take ?? 10;

  return useInfiniteQuery({
    queryKey: ["community-posts", handle, take, isSignedIn] as const,
    queryFn: async ({ pageParam }) => {
      const token = isSignedIn ? await getToken() : undefined;
      return getCommunityPosts(
        handle,
        { cursor: pageParam as string | undefined, take },
        token ?? undefined,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: options?.enabled !== false && !!handle,
  });
}

export function useCommunityPost(
  handle: string,
  postId: string,
  options?: { enabled?: boolean },
) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["community-post", handle, postId, isSignedIn] as const,
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : undefined;
      return getCommunityPost(handle, postId, token ?? undefined);
    },
    enabled: options?.enabled !== false && !!handle && !!postId,
  });
}

export function usePostComments(
  handle: string,
  postId: string,
  options?: { enabled?: boolean; take?: number },
) {
  const { getToken, isSignedIn } = useAuth();
  const take = options?.take ?? 20;

  return useInfiniteQuery({
    queryKey: [
      "community-post-comments",
      handle,
      postId,
      take,
      isSignedIn,
    ] as const,
    queryFn: async ({ pageParam }) => {
      const token = isSignedIn ? await getToken() : undefined;
      return getPostComments(
        handle,
        postId,
        { cursor: pageParam as string | undefined, take },
        token ?? undefined,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: options?.enabled !== false && !!handle && !!postId,
  });
}

export function useCommentReplies(
  handle: string,
  postId: string,
  commentId: string,
  options?: { enabled?: boolean; take?: number },
) {
  const { getToken, isSignedIn } = useAuth();
  const take = options?.take ?? 5;

  return useInfiniteQuery({
    queryKey: [
      "community-comment-replies",
      handle,
      postId,
      commentId,
      take,
      isSignedIn,
    ] as const,
    queryFn: async ({ pageParam }) => {
      const token = isSignedIn ? await getToken() : undefined;
      return getCommentReplies(
        handle,
        postId,
        commentId,
        { cursor: pageParam as string | undefined, take },
        token ?? undefined,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: options?.enabled !== false && !!handle && !!postId && !!commentId,
  });
}

export function useUserFeed(
  handle: string,
  userId: string,
  options?: { enabled?: boolean; take?: number },
) {
  const { getToken, isSignedIn } = useAuth();
  const take = options?.take ?? 10;

  return useInfiniteQuery({
    queryKey: [
      "community-user-feed",
      handle,
      userId,
      take,
      isSignedIn,
    ] as const,
    queryFn: async ({ pageParam }) => {
      const token = isSignedIn ? await getToken() : undefined;
      return getUserFeed(
        handle,
        userId,
        { cursor: pageParam as string | undefined, take },
        token ?? undefined,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: options?.enabled !== false && !!handle && !!userId,
  });
}

export function useCreateCommunityPost(communityId: string, handle: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommunityPostDto) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      return createCommunityPost(token, communityId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
    },
  });
}

export function useDeleteCommunityPost(communityId: string, handle: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      return deleteCommunityPost(token, communityId, postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
    },
  });
}

export function useToggleCommunityPostLike(
  communityId: string,
  handle: string,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to like posts.");
      return toggleCommunityPostLike(token, communityId, postId);
    },
    onMutate: async (postId) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => {
        const isLiked = !post.isLikedByMe;
        return {
          ...post,
          isLikedByMe: isLiked,
          likeCount: post.likeCount + (isLiked ? 1 : -1),
        };
      });
      return { previousQueriesData: prevData };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, postId) => {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" && query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useCreatePostComment(
  communityId: string,
  handle: string,
  postId: string,
) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommunityPostCommentDto) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to comment.");
      return createPostComment(token, communityId, postId, data);
    },
    onMutate: async (data) => {
      const postKey = ["community-post", handle, postId, isSignedIn] as const;
      await queryClient.cancelQueries({ queryKey: postKey });

      const previousPost =
        queryClient.getQueryData<CommunityPostDetailResponse>(postKey);

      if (previousPost) {
        queryClient.setQueryData<CommunityPostDetailResponse>(postKey, {
          ...previousPost,
          commentCount: previousPost.commentCount + 1,
        });
      }

      // Optimistically update lists
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));

      if (data.parentId) {
        queryClient.setQueriesData<
          InfiniteData<CommunityPostCommentListResponse>
        >({ queryKey: ["community-post-comments", handle, postId] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === data.parentId
                  ? { ...item, replyCount: item.replyCount + 1 }
                  : item,
              ),
            })),
          };
        });
      }

      return { previousPost };
    },
    onError: (_err, _data, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(
          ["community-post", handle, postId, isSignedIn],
          context.previousPost,
        );
      }
      // Trigger list update on rollback
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }));
    },
    onSuccess: (_comment, data) => {
      queryClient.invalidateQueries({
        queryKey: ["community-post-comments", handle, postId],
      });
      if (data.parentId) {
        queryClient.invalidateQueries({
          queryKey: [
            "community-comment-replies",
            handle,
            postId,
            data.parentId,
          ],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["community-post", handle, postId],
      });
      queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
      queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useDebouncedCommentLike(
  communityId: string,
  handle: string,
  postId: string,
  commentId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const { getToken } = useAuth();

  const sync = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("Sign in to like comments.");
    return toggleCommentLike(token, communityId, postId, commentId);
  }, [getToken, communityId, postId, commentId]);

  return useOptimisticToggleLike({
    initialLiked,
    initialCount,
    onSync: sync,
    debounceMs: 400,
    resetKey: commentId,
  });
}

export function useRepostPost(communityId: string, handle: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data?: CreateCommunityPostRepostDto;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to repost.");
      return createRepost(token, communityId, postId, data);
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        isRepostedByMe: true,
        repostCount: post.repostCount + 1,
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" && query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["community-user-feed", handle],
      });
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
    },
  });
}

export function useUndoRepost(communityId: string, handle: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to undo repost.");
      return undoRepost(token, communityId, postId);
    },
    onMutate: async (postId) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        isRepostedByMe: false,
        repostCount: Math.max(0, post.repostCount - 1),
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, postId) => {
      void queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" && query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["community-user-feed", handle],
      });
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
    },
  });
}

export function useCreateFeedPostComment(communityId: string, handle: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to comment.");
      return createPostComment(token, communityId, postId, { content });
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_comment, _error, { postId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["community-post-comments", handle, postId],
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" && query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["community-posts", handle] });
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useGlobalFeedPosts(options?: {
  enabled?: boolean;
  take?: number;
}) {
  const { getToken, isSignedIn } = useAuth();
  const take = options?.take ?? 10;

  return useInfiniteQuery({
    queryKey: ["global-feed-posts", take, isSignedIn] as const,
    queryFn: async ({ pageParam }) => {
      const token = isSignedIn ? await getToken() : undefined;
      return getGlobalFeedPosts(
        { cursor: pageParam as string | undefined, take },
        token ?? undefined,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: options?.enabled !== false,
  });
}

export function useCreatePostGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      data,
    }: {
      communityId: string;
      data: CreateCommunityPostDto;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      return createCommunityPost(token, communityId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}

export function useDeletePostGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      postId,
    }: {
      communityId: string;
      postId: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      return deleteCommunityPost(token, communityId, postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}

export function useTogglePostLikeGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      postId,
    }: {
      communityId: string;
      postId: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to like posts.");
      return toggleCommunityPostLike(token, communityId, postId);
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => {
        const isLiked = !post.isLikedByMe;
        return {
          ...post,
          isLikedByMe: isLiked,
          likeCount: post.likeCount + (isLiked ? 1 : -1),
        };
      });
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" &&
          query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useRepostPostGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      postId,
      data,
    }: {
      communityId: string;
      postId: string;
      data?: CreateCommunityPostRepostDto;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to repost.");
      return createRepost(token, communityId, postId, data);
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        isRepostedByMe: true,
        repostCount: post.repostCount + 1,
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" &&
          query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useUndoRepostGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      postId,
    }: {
      communityId: string;
      postId: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to undo repost.");
      return undoRepost(token, communityId, postId);
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        isRepostedByMe: false,
        repostCount: Math.max(0, post.repostCount - 1),
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_data, _error, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" &&
          query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}

export function useCreateFeedPostCommentGeneral() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      postId,
      content,
    }: {
      communityId: string;
      postId: string;
      content: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to comment.");
      return createPostComment(token, communityId, postId, { content });
    },
    onMutate: async ({ postId }) => {
      const prevData = await cancelAndSnapshotQueries(queryClient, postId);
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));
      return { previousQueriesData: prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([key, oldData]: any) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: (_comment, _error, { postId }) => {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post-comments" &&
          query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "community-post" &&
          query.queryKey.includes(postId),
      });
      void queryClient.invalidateQueries({ queryKey: ["global-feed-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["community-user-feed"] });
    },
  });
}
