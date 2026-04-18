"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Pause,
  Play,
  Rocket,
  Trash2,
  Ban,
  ArrowLeft,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  useHackathonBySlug,
  getHackathonBySlugQueryKey,
} from "@/hooks/useHackathonBySlug";
import { getApiErrorMessage } from "@/lib/utils";
import {
  submitHackathonForApproval,
  updateHackathonStatus,
  updateHackathonRegistrationPaused,
  deleteHackathon,
} from "@/lib/api/hackathonApi";
import Link from "next/link";

// Type for hackathon data with approval fields
interface HackathonData {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvalSubmittedAt?: string | null;
  approvalApprovedAt?: string | null;
  approvalRejectedAt?: string | null;
  approvalNote?: string | null;
  isRegistrationPaused?: boolean;
}

function getApprovalBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
  }
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

export default function OpportunitySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: hackathonData, isLoading, error } = useHackathonBySlug(slug);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Cast hackathon data
  const hackathon = hackathonData as HackathonData | null | undefined;

  // Publish (sets lifecycle to PUBLISHED; admin approval tracked separately)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !hackathon) throw new Error("Not authenticated");
      return submitHackathonForApproval(token, hackathon.id);
    },
    onSuccess: (data: unknown) => {
      const row = data as { approvalStatus?: string } | null | undefined;
      if (row?.approvalStatus === "APPROVED") {
        toast.success(
          "Your opportunity is published again. Admin approval stays in place.",
        );
      } else {
        toast.success(
          "Published. Your opportunity is visible as published; admin approval is pending before registrations open.",
        );
      }
      queryClient.invalidateQueries({
        queryKey: getHackathonBySlugQueryKey(slug),
      });
    },
    onError: (error: Error) => {
      toast.error(getApiErrorMessage(error, "Failed to publish"));
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: HackathonData["status"]) => {
      const token = await getToken();
      if (!token || !hackathon) throw new Error("Not authenticated");
      return updateHackathonStatus(token, hackathon.id, { status: newStatus });
    },
    onSuccess: () => {
      toast.success("Opportunity status updated!");
      queryClient.invalidateQueries({
        queryKey: getHackathonBySlugQueryKey(slug),
      });
    },
    onError: (error: Error) => {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    },
  });

  // Toggle registration pause mutation
  const toggleRegistrationPauseMutation = useMutation({
    mutationFn: async (isPaused: boolean) => {
      const token = await getToken();
      if (!token || !hackathon) throw new Error("Not authenticated");
      return updateHackathonRegistrationPaused(token, hackathon.id, {
        isRegistrationPaused: isPaused,
      });
    },
    onSuccess: () => {
      toast.success("Registration settings updated!");
      queryClient.invalidateQueries({
        queryKey: getHackathonBySlugQueryKey(slug),
      });
    },
    onError: (error: Error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update registration settings"),
      );
    },
  });

  // Delete hackathon mutation
  const deleteHackathonMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !hackathon) throw new Error("Not authenticated");
      return deleteHackathon(token, hackathon.id);
    },
    onSuccess: () => {
      toast.success("Opportunity deleted successfully!");
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete opportunity"));
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (deleteConfirmation !== hackathon?.name) {
      toast.error(
        "Please type the opportunity name correctly to confirm deletion",
      );
      return;
    }
    setIsDeleting(true);
    deleteHackathonMutation.mutate(undefined, {
      onSettled: () => {
        // Reset isDeleting if not navigating away (i.e., on error)
        if (!deleteHackathonMutation.isSuccess) {
          setIsDeleting(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">
          {error ? "Failed to load opportunity" : "Opportunity not found"}
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const isLive =
    hackathon.status === "PUBLISHED" && hackathon.approvalStatus === "APPROVED";
  const canPublish =
    hackathon.status === "DRAFT" || hackathon.approvalStatus === "REJECTED";
  const isPendingApproval = hackathon.approvalStatus === "PENDING";
  const isTerminal =
    hackathon.status === "COMPLETED" || hackathon.status === "CANCELLED";

  return (
    <div className="flex justify-center w-full min-h-screen">
      <div className="w-full max-w-4xl bg-background p-4 sm:p-6 flex flex-col gap-6">
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
              {hackathon.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Opportunity Settings
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
            <CardDescription>
              Current lifecycle and approval status of your opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Lifecycle:
                </span>
                {getStatusBadge(hackathon.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approval:</span>
                {getApprovalBadge(hackathon.approvalStatus)}
              </div>
            </div>

            {hackathon.approvalNote &&
              hackathon.approvalStatus === "REJECTED" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800">
                    Rejection Note:
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {hackathon.approvalNote}
                  </p>
                </div>
              )}

            {isLive && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Your opportunity is live and visible to the public!
                </p>
              </div>
            )}

            {isPendingApproval && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Published — awaiting admin approval. Registrations stay closed
                  until an admin approves. You will be notified when reviewed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-lg">Publishing & Approval</CardTitle>
            <CardDescription>
              Publish controls visibility (Draft vs Published). Admin approval
              is separate and only needed once; moving back to draft does not
              undo approval. After rejection, use Publish again to re-submit for
              review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canPublish && (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {publishMutation.isPending
                  ? "Publishing..."
                  : hackathon.approvalStatus === "REJECTED"
                    ? "Publish again"
                    : "Publish opportunity"}
              </Button>
            )}

            {isPendingApproval && (
              <p className="text-sm text-muted-foreground">
                Published — waiting for an admin to approve. Registrations open
                after approval.
              </p>
            )}

            {isLive && (
              <p className="text-sm text-muted-foreground">
                Your opportunity is live and accepting registrations.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Registration Control */}
        {(hackathon.status === "PUBLISHED" ||
          hackathon.status === "ONGOING") && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-lg">Registration Control</CardTitle>
                <CardDescription>
                  Pause registrations while keeping the opportunity publicly
                  visible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pause-registrations" className="text-base">
                      Pause Registrations
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {hackathon.isRegistrationPaused
                        ? "Registrations are currently paused"
                        : "Registrations are open"}
                    </p>
                  </div>
                  <Switch
                    id="pause-registrations"
                    checked={hackathon.isRegistrationPaused ?? false}
                    onCheckedChange={(checked) =>
                      toggleRegistrationPauseMutation.mutate(checked)
                    }
                    disabled={toggleRegistrationPauseMutation.isPending}
                  />
                </div>

                {hackathon.isRegistrationPaused && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                    <Pause className="w-4 h-4 text-yellow-700" />
                    <p className="text-sm text-yellow-800">
                      New registrations are blocked. Toggle off to resume.
                    </p>
                  </div>
                )}

                {!hackathon.isRegistrationPaused && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-700" />
                    <p className="text-sm text-green-800">
                      Registrations are open and accepting participants.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Status Actions */}
        {!isTerminal && (
          <Card className="py-6">
            <CardHeader>
              <CardTitle className="text-lg">Opportunity Actions</CardTitle>
              <CardDescription>
                Change the lifecycle status of your opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {(hackathon.status === "PUBLISHED" ||
                hackathon.status === "ONGOING") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Move to Draft
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Move to Draft?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will unpublish your opportunity and move it back to
                          draft status. The opportunity will no longer be visible
                          to the public. Admin approval (if you already have it)
                          is kept, so you will not need a new review when you
                          publish again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Published</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateStatusMutation.mutate("DRAFT")}
                        >
                          Move to Draft
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

              {hackathon.status === "PUBLISHED" &&
                hackathon.approvalStatus === "APPROVED" && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate("ONGOING")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Opportunity (Go Live)
                  </Button>
                )}

              {hackathon.status === "ONGOING" && (
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
                    Cancel Opportunity
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Opportunity?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the opportunity as cancelled. Participants
                      will be notified. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Opportunity</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateStatusMutation.mutate("CANCELLED")}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Cancel Opportunity
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions. Please be careful.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Opportunity
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Opportunity?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action is permanent and cannot be undone. All
                      opportunity data, registrations, and associated content
                      will be permanently deleted.
                    </p>
                    <div>
                      <Label htmlFor="confirm-delete" className="text-sm mb-2">
                        Type <strong>{hackathon.name}</strong> to confirm:
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={hackathon.name}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={
                      deleteConfirmation !== hackathon.name ||
                      isDeleting ||
                      deleteHackathonMutation.isPending
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteHackathonMutation.isPending
                      ? "Deleting..."
                      : "Delete Permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <p className="text-xs text-muted-foreground">
              This will permanently delete &quot;{hackathon.name}&quot; and all
              associated data.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/hackathon/${slug}/edit-hackathon`}
              className="text-primary-500 hover:underline text-sm"
            >
              Edit Hackathon Details
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/hackathon/${slug}/manage-roles`}
              className="text-primary-500 hover:underline text-sm"
            >
              Manage Team
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/hackathon/${slug}/manage-registration`}
              className="text-primary-500 hover:underline text-sm"
            >
              View Registrations
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/opportunities/${slug}`}
              className="text-primary-500 hover:underline text-sm"
              target="_blank"
            >
              View Public Page
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
