"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import { createCommunityPost } from "@/lib/api/communityPostApi";

export interface PublishingPost {
  id: string;
  communityId: string;
  communityHandle: string;
  content: string;
  images: string[];
  skillIds?: string[];
  progress: number;
  status: "preparing" | "uploading" | "creating" | "success" | "failed";
  error?: string;
}

interface PublishingContextType {
  publishingPosts: PublishingPost[];
  publishPost: (postData: {
    communityId: string;
    communityHandle: string;
    content: string;
    images: string[];
    skillIds?: string[];
  }) => void;
  retryPublish: (id: string) => void;
  cancelPublish: (id: string) => void;
}

const PublishingContext = createContext<PublishingContextType | undefined>(
  undefined,
);

const LOCAL_STORAGE_KEY = "oppskills_publishing_posts";

export function PublishingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [publishingPosts, setPublishingPosts] = useState<PublishingPost[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const publishingPostsRef = useRef<PublishingPost[]>(publishingPosts);
  useEffect(() => {
    publishingPostsRef.current = publishingPosts;
  }, [publishingPosts]);

  // Load drafts on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PublishingPost[];
        // Any post that was left in an active state when session was closed should be treated as failed
        const sanitized = parsed.map((post) => {
          const isPending =
            post.status === "uploading" ||
            post.status === "creating" ||
            post.status === "preparing";
          return {
            ...post,
            status: isPending ? ("failed" as const) : post.status,
            error: isPending
              ? "Publish interrupted by page reload."
              : post.error,
            images: post.images.filter((img) => !img.startsWith("blob:")),
          };
        });
        setPublishingPosts(sanitized);
      }
    } catch (e) {
      console.error("Failed to load publishing posts from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save drafts when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(publishingPosts));
    } catch (e) {
      console.error("Failed to save publishing posts to localStorage:", e);
    }
  }, [publishingPosts, isLoaded]);

  const updatePostStatus = useCallback(
    (
      id: string,
      updates: Partial<
        Omit<PublishingPost, "id" | "communityId" | "communityHandle">
      >,
    ) => {
      setPublishingPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, ...updates } : post)),
      );
    },
    [],
  );

  const removePost = useCallback((id: string) => {
    setPublishingPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  const runPublish = useCallback(
    async (post: PublishingPost) => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in to publish.");

        if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;

        updatePostStatus(post.id, { status: "uploading", progress: 10 });
        const uploadedUrls: string[] = [];

        // Upload images one by one
        for (let i = 0; i < post.images.length; i++) {
          if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;

          const img = post.images[i];
          let url = img;

          if (img.startsWith("blob:")) {
            const res = await fetch(img);
            if (!publishingPostsRef.current.some((p) => p.id === post.id))
              return;

            const blob = await res.blob();
            const file = new File([blob], "post-image.jpg", {
              type: blob.type || "image/jpeg",
            });

            if (!publishingPostsRef.current.some((p) => p.id === post.id))
              return;

            // Get presign url
            const presign = await presignImageUpload(token, {
              purpose: "COMMUNITY_POST_IMAGE",
              mimeType: file.type,
            });

            if (!publishingPostsRef.current.some((p) => p.id === post.id))
              return;

            // Upload
            await uploadImageToS3PresignedPost({ presign, file });

            if (!publishingPostsRef.current.some((p) => p.id === post.id))
              return;

            if (!presign?.publicUrl) {
              throw new Error("Failed to generate S3 upload URL.");
            }
            url = presign.publicUrl.startsWith("http")
              ? presign.publicUrl
              : presign.publicUrl.startsWith("//")
                ? `https:${presign.publicUrl}`
                : `https://${presign.publicUrl}`;
          }

          uploadedUrls.push(url);

          if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;

          // Update progress (from 10% to 80% based on image uploads)
          const percent = Math.round(10 + ((i + 1) / post.images.length) * 70);
          updatePostStatus(post.id, { progress: percent });
        }

        if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;

        // Post creation request
        updatePostStatus(post.id, { status: "creating", progress: 85 });
        await createCommunityPost(token, post.communityId, {
          content: post.content,
          imageUrls: uploadedUrls,
          skillIds: post.skillIds,
        });

        if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;

        // Done!
        updatePostStatus(post.id, { status: "success", progress: 100 });
        toast.success("Post published successfully!");

        // Revoke all blob URLs now that post is successfully created
        post.images.forEach((img) => {
          if (img.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(img);
            } catch (e) {
              console.error("Failed to revoke object URL:", e);
            }
          }
        });

        // Invalidate React Query Cache so it displays
        void queryClient.invalidateQueries({
          queryKey: ["community-posts", post.communityHandle],
        });
        void queryClient.invalidateQueries({
          queryKey: ["global-feed-posts"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["community-user-feed", post.communityHandle],
        });

        // Remove from UI after a small delay
        setTimeout(() => {
          if (!publishingPostsRef.current.some((p) => p.id === post.id)) return;
          removePost(post.id);
        }, 3000);
      } catch (err: unknown) {
        if (!publishingPostsRef.current.some((p) => p.id === post.id)) {
          return;
        }
        console.error("Background publishing failed:", err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to publish post. Please check your internet connection.";
        updatePostStatus(post.id, { status: "failed", error: errorMsg });
      }
    },
    [getToken, queryClient, removePost, updatePostStatus],
  );

  const publishPost = useCallback(
    (postData: {
      communityId: string;
      communityHandle: string;
      content: string;
      images: string[];
      skillIds?: string[];
    }) => {
      const tempId = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newPost: PublishingPost = {
        id: tempId,
        communityId: postData.communityId,
        communityHandle: postData.communityHandle,
        content: postData.content,
        images: postData.images,
        skillIds: postData.skillIds,
        progress: 0,
        status: "preparing",
      };

      setPublishingPosts((prev) => [...prev, newPost]);
      void runPublish(newPost);
    },
    [runPublish],
  );

  const retryPublish = useCallback(
    (id: string) => {
      const post = publishingPosts.find((p) => p.id === id);
      if (!post) return;

      const resetPost = {
        ...post,
        status: "preparing" as const,
        progress: 0,
        error: undefined,
      };

      setPublishingPosts((prev) =>
        prev.map((p) => (p.id === id ? resetPost : p)),
      );
      void runPublish(resetPost);
    },
    [publishingPosts, runPublish],
  );

  const cancelPublish = useCallback(
    (id: string) => {
      const post = publishingPosts.find((p) => p.id === id);
      if (post) {
        post.images.forEach((img) => {
          if (img.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(img);
            } catch (e) {
              console.error("Failed to revoke object URL:", e);
            }
          }
        });
      }
      removePost(id);
    },
    [publishingPosts, removePost],
  );

  return (
    <PublishingContext.Provider
      value={{ publishingPosts, publishPost, retryPublish, cancelPublish }}
    >
      {children}
    </PublishingContext.Provider>
  );
}

export function usePublishing() {
  const context = useContext(PublishingContext);
  if (!context) {
    throw new Error("usePublishing must be used within a PublishingProvider");
  }
  return context;
}
