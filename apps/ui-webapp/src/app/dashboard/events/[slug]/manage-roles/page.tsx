"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  ManageRolesLayout,
  type RoleUser,
} from "@/app/dashboard/_components/roles/ManageRolesLayout";
import { AddRoleModal } from "@/app/dashboard/_components/roles/AddRoleModal";
import { useEventBySlug } from "@/hooks/useEventBySlug";
import {
  useEventRoles,
  useAddEventRoleMutation,
  useRemoveEventRoleMutation,
} from "@/hooks/useEventRoles";
import type { EventUserRoleValue } from "@oppskills/types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Type guard to safely extract event with id
function isEventWithId(value: unknown): value is { id: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "id" in value && typeof (value as { id: unknown }).id === "string";
}

// Helper to extract error message safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export default function ManageRolesPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;

  const [activeTab, setActiveTab] = useState<"Manager" | "Evaluator">(
    "Manager",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query for event data
  const eventQuery = useEventBySlug(slug);

  // Derive eventId safely using type guard
  const eventId = isEventWithId(eventQuery.data) ? eventQuery.data.id : null;

  // Query for roles
  const rolesQuery = useEventRoles(eventId);

  // Mutations for add/remove roles
  const addMutation = useAddEventRoleMutation(eventId);
  const removeMutation = useRemoveEventRoleMutation(eventId);

  const handleAddRole = async (email: string) => {
    const role: EventUserRoleValue =
      activeTab === "Manager" ? "MANAGER" : "EVALUATOR";

    try {
      const result = await addMutation.mutateAsync({ email, role });

      if (result.alreadyExists) {
        toast.info(result.message);
      } else {
        toast.success(result.message);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      throw err;
    }
  };

  const handleDeleteClick = async (
    user: RoleUser,
    role: "Manager" | "Evaluator",
  ) => {
    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;
    if (
      !confirm(
        `Are you sure you want to remove ${displayName} as a ${role.toLowerCase()}?`,
      )
    ) {
      return;
    }

    const roleValue: EventUserRoleValue =
      role === "Manager" ? "MANAGER" : "EVALUATOR";

    try {
      const result = await removeMutation.mutateAsync({
        email: user.email,
        role: roleValue,
      });
      toast.success(result.message);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
    }
  };

  const handleRetry = () => {
    if (eventQuery.error) eventQuery.refetch();
    if (rolesQuery.error) rolesQuery.refetch();
  };

  // Derive roles data
  const roles = rolesQuery.data;

  // Loading state
  const isLoading = eventQuery.isLoading || rolesQuery.isLoading;

  // Error state
  const queryError = eventQuery.error ?? rolesQuery.error;

  if (queryError) {
    return (
      <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-[1200px] p-6 md:p-10 rounded-[20px] bg-background flex flex-col items-center justify-center gap-4">
          <p className="text-red-500">{getErrorMessage(queryError)}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <ManageRolesLayout
        owner={
          roles?.owner
            ? { ...roles.owner, id: roles.owner.id || "owner-id" }
            : null
        }
        managers={roles?.managers || []}
        evaluators={roles?.evaluators || []}
        isLoading={isLoading}
        skeletonName="dashboard-event-manage-roles"
        onAddRole={(role) => {
          setActiveTab(role);
          setIsModalOpen(true);
        }}
        onDeleteRole={handleDeleteClick}
      />

      <AddRoleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        roleType={activeTab}
        onAdd={handleAddRole}
        isLoading={addMutation.isPending}
        ownerId={roles?.owner.id}
      />
    </div>
  );
}
