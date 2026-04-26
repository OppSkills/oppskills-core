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
import { getApiErrorMessage } from "@/lib/utils";
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
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";

import { Container } from "@/app/dashboard/_components/Container";

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

  const publishMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !event) throw new Error("Not authenticated");
      return submitEventForApproval(token, event.id);
    },
    onSuccess: (data: unknown) => {
      const row = data as { approvalStatus?: string } | null | undefined;
      if (row?.approvalStatus === "APPROVED") {
        toast.success(
          "Your event is published again. Admin approval stays in place.",
        );
      } else {
        toast.success(
          "Published. Your event is visible as published; admin approval is pending before registrations open.",
        );
      }
      queryClient.invalidateQueries({ queryKey: getEventBySlugQueryKey(slug) });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to publish"));
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
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update status"));
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
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update registration settings"),
      );
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
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete event"));
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

  if (!isLoading && (error || !event)) {
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

  if (!event) {
    return (
      <BoneyardSkeleton
        loading={isLoading}
        name="dashboard-event-settings"
        className="flex min-h-screen w-full justify-center"
        fallback={<ProfileLikeFallback className="max-w-4xl py-8" />}
      >
        {null}
      </BoneyardSkeleton>
    );
  }

  const isLive =
    event.status === "PUBLISHED" && event.approvalStatus === "APPROVED";
  const canPublish =
    event.status === "DRAFT" || event.approvalStatus === "REJECTED";
  const isPendingApproval = event.approvalStatus === "PENDING";
  const isTerminal =
    event.status === "COMPLETED" || event.status === "CANCELLED";

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="dashboard-event-settings"
      className="flex min-h-screen w-full justify-center"
      fallback={<ProfileLikeFallback className="max-w-4xl py-8" />}
    >
      <div className="flex justify-center w-full min-h-screen">
        <div className="w-full max-w-4xl bg-background p-4 sm:p-6 flex flex-col gap-8">
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
              <h1 className="font-black text-2xl md:text-3xl poppins">{event.name}</h1>
              <p className="text-sm text-muted-foreground inter">Event Settings</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Status Overview */}
            <Container
              heading="Status Overview"
              description="Current lifecycle and approval status of your event"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500 font-medium">
                      Lifecycle:
                    </span>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500 font-medium">Approval:</span>
                    {getApprovalBadge(event.approvalStatus)}
                  </div>
                </div>

                {event.approvalNote && event.approvalStatus === "REJECTED" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-bold text-red-800">
                      Rejection Note:
                    </p>
                    <p className="text-sm text-red-700 mt-1 inter">
                      {event.approvalNote}
                    </p>
                  </div>
                )}

                {isLive && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800 flex items-center gap-2 inter font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Your event is live and visible to the public!
                    </p>
                  </div>
                )}

                {isPendingApproval && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800 flex items-center gap-2 inter font-medium">
                      <Clock className="w-4 h-4" />
                      Published — awaiting admin approval. Registrations stay closed
                      until an admin approves.
                    </p>
                  </div>
                )}
              </div>
            </Container>

            {/* Publishing */}
            <Container
              heading="Publishing & Approval"
              description="Control visibility and re-submit for review if rejected."
            >
              <div className="space-y-4">
                {canPublish && (
                  <Button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="w-full sm:w-auto rounded-full font-bold bg-primary-500 hover:bg-primary-600"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    {publishMutation.isPending
                      ? "Publishing..."
                      : event.approvalStatus === "REJECTED"
                        ? "Publish again"
                        : "Publish event"}
                  </Button>
                )}

                {isPendingApproval && (
                  <p className="text-sm text-neutral-500 inter">
                    Published — waiting for an admin to approve. Registrations open
                    after approval.
                  </p>
                )}

                {isLive && (
                  <p className="text-sm text-neutral-500 inter">
                    Your event is live and accepting registrations.
                  </p>
                )}
              </div>
            </Container>

            {/* Registration Control */}
            {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
              <Container
                heading="Registration Control"
                description="Pause registrations while keeping the event publicly visible"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-primary-50/20 p-4 rounded-xl border border-primary-100">
                    <div className="space-y-0.5">
                      <Label htmlFor="pause-registrations" className="text-base font-bold poppins">
                        Pause Registrations
                      </Label>
                      <p className="text-sm text-neutral-500 inter">
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
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
                      <Pause className="w-4 h-4 text-yellow-700" />
                      <p className="text-sm text-yellow-800 inter font-medium">
                        New registrations are blocked. Toggle off to resume.
                      </p>
                    </div>
                  )}

                  {!event.isRegistrationPaused && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-700" />
                      <p className="text-sm text-green-800 inter font-medium">
                        Registrations are open and accepting participants.
                      </p>
                    </div>
                  )}
                </div>
              </Container>
            )}

            {/* Status Actions */}
            {!isTerminal && (
              <Container
                heading="Event Actions"
                description="Change the lifecycle status of your event"
              >
                <div className="flex flex-wrap gap-3 pt-2">
                  {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-full font-bold border-primary-100 text-primary-600 hover:bg-primary-50"
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Move to Draft
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-primary-100">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="poppins font-black text-2xl">Move to Draft?</AlertDialogTitle>
                          <AlertDialogDescription className="inter">
                            This will unpublish your event and move it back to draft
                            status. The event will no longer be visible to the public.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Keep Published</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateStatusMutation.mutate("DRAFT")}
                            className="rounded-full bg-primary-500 hover:bg-primary-600"
                          >
                            Move to Draft
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {event.status === "PUBLISHED" &&
                    event.approvalStatus === "APPROVED" && (
                      <Button
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate("ONGOING")}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-full font-bold bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
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
                      className="rounded-full font-bold border-primary-100 text-primary-700 hover:bg-primary-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full font-bold text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Cancel Event
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-amber-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="poppins font-black text-2xl">Cancel Event?</AlertDialogTitle>
                        <AlertDialogDescription className="inter">
                          This will mark the event as cancelled. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Keep Event</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateStatusMutation.mutate("CANCELLED")}
                          className="rounded-full bg-amber-600 hover:bg-amber-700"
                        >
                          Cancel Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Container>
            )}

            {/* Danger Zone */}
            <Container
              heading="Danger Zone"
              description="Irreversible actions. Please be extremely careful."
              className="border-red-100"
            >
              <div className="space-y-4 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="rounded-full font-bold px-8">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-red-100">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="poppins font-black text-2xl text-red-600">Delete Event?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4 inter">
                        <p>
                          This action is permanent and cannot be undone. All
                          data will be permanently deleted.
                        </p>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <Label htmlFor="confirm-delete" className="text-sm font-bold text-red-800 mb-2 block">
                            Type <strong>{event.name}</strong> to confirm:
                          </Label>
                          <Input
                            id="confirm-delete"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder={event.name}
                            className="mt-2 bg-white rounded-xl border-red-200 focus:ring-red-500"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation("")} className="rounded-full">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                          deleteConfirmation !== event.name ||
                          isDeleting ||
                          deleteEventMutation.isPending
                        }
                        className="rounded-full bg-red-600 hover:bg-red-700 font-bold px-8"
                      >
                        {deleteEventMutation.isPending
                          ? "Deleting..."
                          : "Delete Permanently"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <p className="text-xs text-neutral-400 inter">
                  Deleting this event will permanently remove all associated records and data.
                </p>
              </div>
            </Container>

            {/* Quick Links */}
            <Container
              heading="Quick Links"
              description="Useful links for managing your event"
            >
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href={`/dashboard/events/${slug}/edit-event`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold inter text-sm"
                >
                  Edit Details
                </Link>
                <div className="w-1 h-1 bg-neutral-300 rounded-full my-auto" />
                <Link
                  href={`/dashboard/events/${slug}/manage-roles`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold inter text-sm"
                >
                  Manage Team
                </Link>
                <div className="w-1 h-1 bg-neutral-300 rounded-full my-auto" />
                <Link
                  href={`/dashboard/events/${slug}/manage-registration`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold inter text-sm"
                >
                  View Registrations
                </Link>
                <div className="w-1 h-1 bg-neutral-300 rounded-full my-auto" />
                <Link
                  href={`/events/${slug}`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold inter text-sm"
                  target="_blank"
                >
                  View Public Page
                </Link>
              </div>
            </Container>
          </div>
        </div>
      </div>
    </BoneyardSkeleton>
  );
}
