"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Ban,
  ArrowLeft,
  Undo2,
  Play,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useFestivalBySlug,
  getFestivalBySlugQueryKey,
} from "@/hooks/festivals/useFestivalBySlug";
import { updateFestivalStatus, deleteFestival } from "@/lib/api/festivalApi";
import Link from "next/link";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";
import { Container } from "@/app/dashboard/_components/Container";

// Type for festival data
interface FestivalData {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvalNote?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline">Draft</Badge>;
    case "PUBLISHED":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Published</Badge>;
    case "ONGOING":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          Live / Ongoing
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="bg-gray-500 text-background">
          Completed
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getApprovalBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Pending Approval
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Rejected
        </Badge>
      );
    default:
      return null;
  }
}

export default function FestivalSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: festivalData, isLoading, error } = useFestivalBySlug(slug);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Cast festival data
  const festival = festivalData as FestivalData | null | undefined;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: FestivalData["status"]) => {
      const token = await getToken();
      if (!token || !festival) throw new Error("Not authenticated");
      return updateFestivalStatus(token, festival.id, newStatus);
    },
    onSuccess: () => {
      toast.success("Festival status updated!");
      queryClient.invalidateQueries({
        queryKey: getFestivalBySlugQueryKey(slug),
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    },
  });

  // Delete festival mutation
  const deleteFestivalMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !festival) throw new Error("Not authenticated");
      return deleteFestival(token, festival.id);
    },
    onSuccess: () => {
      toast.success("Festival deleted successfully!");
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete festival"));
    },
  });

  const handleDelete = () => {
    if (deleteConfirmation !== festival?.name) {
      toast.error(
        "Please type the festival name correctly to confirm deletion",
      );
      return;
    }
    setIsDeleting(true);
    deleteFestivalMutation.mutate();
  };

  if (!isLoading && (error || !festival)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">
          {error ? "Failed to load festival" : "Festival not found"}
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!festival) {
    return (
      <BoneyardSkeleton
        loading={isLoading}
        name="dashboard-festival-settings"
        className="flex min-h-screen w-full justify-center"
        fallback={<ProfileLikeFallback className="max-w-4xl py-8" />}
      >
        {null}
      </BoneyardSkeleton>
    );
  }

  const isTerminal =
    festival.status === "COMPLETED" || festival.status === "CANCELLED";

  const isPublishedAndApproved =
    festival.status === "PUBLISHED" && festival.approvalStatus === "APPROVED";
  const isPublishedPending =
    festival.status === "PUBLISHED" && festival.approvalStatus !== "APPROVED";
  const isDraft = festival.status === "DRAFT";

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="dashboard-festival-settings"
      className="flex min-h-screen w-full justify-center"
      fallback={<ProfileLikeFallback className="max-w-4xl py-8" />}
    >
      <div className="flex justify-center w-full min-h-screen">
        <div className="w-full bg-background p-4 sm:p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-2xl md:text-3xl">
                {festival.name}
              </h1>
              <p className="text-sm text-muted-foreground">Festival Settings</p>
            </div>
          </div>
          <Container
            heading="Status Overview"
            description="Current lifecycle status of your festival"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Lifecycle:
                </span>
                {getStatusBadge(festival.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approval:</span>
                {getApprovalBadge(festival.approvalStatus)}
              </div>
            </div>

            {/* 1. PUBLISHED + APPROVED */}
            {isPublishedAndApproved && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Your festival is live and visible to the public!
                </p>
              </div>
            )}

            {/* 2. PUBLISHED but not Approved */}
            {isPublishedPending && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your festival is awaiting admin approval. It is not yet
                  visible to the public.
                </p>
                {festival.approvalStatus === "REJECTED" &&
                  festival.approvalNote && (
                    <p className="text-sm text-red-600 mt-2 ml-6">
                      <strong>Rejection Note:</strong> {festival.approvalNote}
                    </p>
                  )}
              </div>
            )}

            {/* 3. DRAFT */}
            {isDraft && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your festival is in draft mode. Publish it to submit for
                  review.
                </p>
              </div>
            )}
          </Container>

          {/* Status Actions */}
          {!isTerminal && (
            <Container
              heading="Actions"
              description="Change the lifecycle status of your festival"
            >
              {festival.status === "DRAFT" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("PUBLISHED")}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {updateStatusMutation.isPending
                    ? "Publishing..."
                    : "Publish Festival"}
                </Button>
              )}

              {/* Revert to Draft (Only if PUBLISHED or ONGOING) */}
              {(festival.status === "PUBLISHED" ||
                festival.status === "ONGOING") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Revert to Draft
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revert to Draft?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will unpublish your festival and move it back to
                        draft status. The festival will no longer be visible to
                        the public. You can publish it again later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Published</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateStatusMutation.mutate("DRAFT")}
                      >
                        Revert to Draft
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Start Festival (Only if PUBLISHED) */}
              {festival.status === "PUBLISHED" && (
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate("ONGOING")}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Festival (Go Live)
                </Button>
              )}

              {/* Mark Completed (Only if ONGOING) */}
              {festival.status === "ONGOING" && (
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate("COMPLETED")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel Festival
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Festival?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the festival as cancelled. This action
                      cannot be undone easily.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Festival</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateStatusMutation.mutate("CANCELLED")}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Cancel Festival
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Container>
          )}

          {/* Danger Zone */}
          <Container
            heading="Danger Zone"
            description="Irreversible actions. Please be careful."
            className="border-red-200"
          >
            <div className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Festival
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Festival?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This action is permanent and cannot be undone. All
                        festival data, associated events/hackathons links, and
                        content will be permanently deleted.
                      </p>
                      <div>
                        <Label
                          htmlFor="confirm-delete"
                          className="text-sm mb-2"
                        >
                          Type <strong>{festival.name}</strong> to confirm:
                        </Label>
                        <Input
                          id="confirm-delete"
                          value={deleteConfirmation}
                          onChange={(e) =>
                            setDeleteConfirmation(e.target.value)
                          }
                          placeholder={festival.name}
                          className="mt-2"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setDeleteConfirmation("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={
                        deleteConfirmation !== festival.name ||
                        isDeleting ||
                        deleteFestivalMutation.isPending
                      }
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteFestivalMutation.isPending
                        ? "Deleting..."
                        : "Delete Permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-xs text-muted-foreground">
                This will permanently delete &quot;{festival.name}&quot; and all
                associated data.
              </p>
            </div>
          </Container>

          {/* Quick Links */}
          <Container heading="Quick Links" className="py-6">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/festivals/${slug}/edit-festival`}
                className="text-primary-500 hover:underline text-sm"
              >
                Edit Festival Details
              </Link>
              <span className="text-muted-foreground">•</span>
              {/* Add more links if needed */}
              <Link
                href={`/festivals/${slug}`}
                className="text-primary-500 hover:underline text-sm"
                target="_blank"
              >
                View Public Page
              </Link>
            </div>
          </Container>
        </div>
      </div>
    </BoneyardSkeleton>
  );
}
