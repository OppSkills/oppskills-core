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
  Send,
  Trash2,
  Ban,
  ArrowLeft,
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
import { useEventBySlug, getEventBySlugQueryKey } from "@/hooks/useEventBySlug";
import {
  submitEventForApproval,
  updateEventStatus,
  updateEventRegistrationPaused,
  deleteEvent,
} from "@/lib/api/eventApi";
import Link from "next/link";

// Type for event data with approval fields
interface EventData {
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
        <Badge variant="secondary" className="bg-gray-500 text-white">
          Completed
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: eventData, isLoading, error } = useEventBySlug(slug);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Cast event data
  const event = eventData as EventData | null | undefined;

  // Submit for approval mutation
  const submitApprovalMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !event) throw new Error("Not authenticated");
      return submitEventForApproval(token, event.id);
    },
    onSuccess: () => {
      toast.success("Event submitted for approval!");
      queryClient.invalidateQueries({ queryKey: getEventBySlugQueryKey(slug) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit for approval");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: EventData["status"]) => {
      const token = await getToken();
      if (!token || !event) throw new Error("Not authenticated");
      return updateEventStatus(token, event.id, { status: newStatus });
    },
    onSuccess: () => {
      toast.success("Event status updated!");
      queryClient.invalidateQueries({ queryKey: getEventBySlugQueryKey(slug) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Toggle registration pause mutation
  const toggleRegistrationPauseMutation = useMutation({
    mutationFn: async (isPaused: boolean) => {
      const token = await getToken();
      if (!token || !event) throw new Error("Not authenticated");
      return updateEventRegistrationPaused(token, event.id, {
        isRegistrationPaused: isPaused,
      });
    },
    onSuccess: () => {
      toast.success("Registration settings updated!");
      queryClient.invalidateQueries({ queryKey: getEventBySlugQueryKey(slug) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update registration settings");
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !event) throw new Error("Not authenticated");
      return deleteEvent(token, event.id);
    },
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const handleDelete = () => {
    if (deleteConfirmation !== event?.name) {
      toast.error("Please type the event name correctly to confirm deletion");
      return;
    }
    setIsDeleting(true);
    deleteEventMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">
          {error ? "Failed to load event" : "Event not found"}
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const isLive =
    event.status === "PUBLISHED" && event.approvalStatus === "APPROVED";
  const canSubmitForApproval =
    event.status === "DRAFT" || event.approvalStatus === "REJECTED";
  const isPendingApproval = event.approvalStatus === "PENDING";
  const isTerminal =
    event.status === "COMPLETED" || event.status === "CANCELLED";

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
            <h1 className="font-semibold text-2xl md:text-3xl">{event.name}</h1>
            <p className="text-sm text-muted-foreground">Event Settings</p>
          </div>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
            <CardDescription>
              Current lifecycle and approval status of your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Lifecycle:
                </span>
                {getStatusBadge(event.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approval:</span>
                {getApprovalBadge(event.approvalStatus)}
              </div>
            </div>

            {event.approvalNote && event.approvalStatus === "REJECTED" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">
                  Rejection Note:
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {event.approvalNote}
                </p>
              </div>
            )}

            {isLive && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Your event is live and visible to the public!
                </p>
              </div>
            )}

            {isPendingApproval && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Your event is pending admin approval. You will be notified
                  once reviewed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Publishing & Approval</CardTitle>
            <CardDescription>
              Submit your event for review to make it publicly visible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSubmitForApproval && (
              <Button
                onClick={() => submitApprovalMutation.mutate()}
                disabled={submitApprovalMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitApprovalMutation.isPending
                  ? "Submitting..."
                  : "Submit for Approval"}
              </Button>
            )}

            {isPendingApproval && (
              <p className="text-sm text-muted-foreground">
                Your event is currently under review. Please wait for admin
                approval.
              </p>
            )}

            {isLive && (
              <p className="text-sm text-muted-foreground">
                Your event is live and accepting registrations.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Registration Control */}
        {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration Control</CardTitle>
              <CardDescription>
                Pause registrations while keeping the event publicly visible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pause-registrations" className="text-base">
                    Pause Registrations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {event.isRegistrationPaused
                      ? "Registrations are currently paused"
                      : "Registrations are open"}
                  </p>
                </div>
                <Switch
                  id="pause-registrations"
                  checked={event.isRegistrationPaused ?? false}
                  onCheckedChange={(checked) =>
                    toggleRegistrationPauseMutation.mutate(checked)
                  }
                  disabled={toggleRegistrationPauseMutation.isPending}
                />
              </div>

              {event.isRegistrationPaused && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                  <Pause className="w-4 h-4 text-yellow-700" />
                  <p className="text-sm text-yellow-800">
                    New registrations are blocked. Toggle off to resume.
                  </p>
                </div>
              )}

              {!event.isRegistrationPaused && (
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Actions</CardTitle>
              <CardDescription>
                Change the lifecycle status of your event
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {event.status === "PUBLISHED" &&
                event.approvalStatus === "APPROVED" && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate("ONGOING")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Event (Go Live)
                  </Button>
                )}

              {event.status === "ONGOING" && (
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
                    Cancel Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Event?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the event as cancelled. Participants will
                      be notified. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Event</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateStatusMutation.mutate("CANCELLED")}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Cancel Event
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
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action is permanent and cannot be undone. All event
                      data, registrations, and associated content will be
                      permanently deleted.
                    </p>
                    <div>
                      <Label htmlFor="confirm-delete" className="text-sm mb-2">
                        Type <strong>{event.name}</strong> to confirm:
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={event.name}
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
                      deleteConfirmation !== event.name ||
                      isDeleting ||
                      deleteEventMutation.isPending
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteEventMutation.isPending
                      ? "Deleting..."
                      : "Delete Permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <p className="text-xs text-muted-foreground">
              This will permanently delete &quot;{event.name}&quot; and all
              associated data.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/events/${slug}/edit-event`}
              className="text-primary-500 hover:underline text-sm"
            >
              Edit Event Details
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/events/${slug}/manage-roles`}
              className="text-primary-500 hover:underline text-sm"
            >
              Manage Team
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/events/${slug}/manage-registration`}
              className="text-primary-500 hover:underline text-sm"
            >
              View Registrations
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/events/${slug}`}
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
