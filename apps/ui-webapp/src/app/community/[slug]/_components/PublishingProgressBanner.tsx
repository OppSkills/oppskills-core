"use client";

import React from "react";
import { usePublishing, PublishingPost } from "@/hooks/community/usePublishing";
import {
  Loader2,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublishingProgressBannerProps {
  currentCommunityHandle?: string;
  // If true, shows posts for all communities. If false, shows posts matching currentCommunityHandle.
  showAll?: boolean;
  onEditDraft?: (draft: {
    content: string;
    images: string[];
    skillIds?: string[];
  }) => void;
}

export default function PublishingProgressBanner({
  currentCommunityHandle,
  showAll = false,
  onEditDraft,
}: PublishingProgressBannerProps) {
  const { publishingPosts, retryPublish, cancelPublish } = usePublishing();

  // Filter posts based on scope
  const visiblePosts = publishingPosts.filter((post) => {
    if (showAll) return true;
    return post.communityHandle === currentCommunityHandle;
  });

  if (visiblePosts.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3.5 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      {visiblePosts.map((post) => {
        const isFailed = post.status === "failed";
        const isSuccess = post.status === "success";
        const isUploading =
          post.status === "uploading" ||
          post.status === "preparing" ||
          post.status === "creating";

        // Status text
        let statusText = "Preparing publication...";
        if (post.status === "uploading") {
          statusText = `Uploading images (${post.progress}%)...`;
        } else if (post.status === "creating") {
          statusText = "Creating post on OppSkills...";
        } else if (isSuccess) {
          statusText = "Published successfully! 🎉";
        } else if (isFailed) {
          statusText = post.error || "Publishing failed. Please retry.";
        }

        const handleEdit = () => {
          if (onEditDraft) {
            onEditDraft({
              content: post.content,
              images: post.images,
              skillIds: post.skillIds,
            });
            cancelPublish(post.id);
          }
        };

        return (
          <div
            key={post.id}
            className={`w-full bg-white rounded-3xl border p-4 sm:p-5 flex flex-col gap-3 shadow-xs relative transition-all duration-300 ${
              isFailed
                ? "border-red-200 bg-red-50/10"
                : isSuccess
                  ? "border-green-200 bg-green-50/10"
                  : "border-neutral-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {isUploading && (
                    <Loader2 className="w-5 h-5 animate-spin text-[#5D3EBB]" />
                  )}
                  {isSuccess && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                  )}
                  {isFailed && (
                    <AlertCircle className="w-5 h-5 text-red-500 fill-red-50" />
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {isUploading
                        ? "Publishing in background"
                        : isSuccess
                          ? "Success"
                          : "Failed to publish"}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs font-semibold text-neutral-500">
                      in r/{post.communityHandle}
                    </span>
                  </div>

                  <p
                    className={`text-sm font-semibold truncate max-w-md ${
                      isFailed ? "text-red-700" : "text-neutral-700"
                    }`}
                  >
                    {statusText}
                  </p>

                  {post.content && (
                    <p className="text-xs text-neutral-400 font-semibold truncate max-w-sm mt-0.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {post.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {isFailed && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryPublish(post.id)}
                      className="rounded-full border-red-200 text-red-700 hover:bg-red-50/50 hover:text-red-800 text-xs font-extrabold h-8 px-3.5 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </Button>
                    {onEditDraft && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="rounded-full border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-extrabold h-8 px-3.5"
                      >
                        Edit
                      </Button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => cancelPublish(post.id)}
                  disabled={isUploading}
                  className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar (only during uploading/creating) */}
            {isUploading && (
              <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-[#5D3EBB] to-[#2E1E66] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${post.progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
