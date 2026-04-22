"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import RoleCard from "./_components/RoleCard";
import AddRoleModal from "./_components/AddEditRoleModal";
import EmptyState from "./_components/EmptyState";
import { cn } from "@/lib/utils";
import { useEventBySlug } from "@/hooks/useEventBySlug";
import {
  useEventRoles,
  useAddEventRoleMutation,
  useRemoveEventRoleMutation,
} from "@/hooks/useEventRoles";
import type {
  EventRoleUserResponse,
  EventUserRoleValue,
} from "@oppskills/types/frontend";
import { RefreshCw } from "lucide-react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { DashboardManageRolesFallback } from "@/components/boneyard/loading-fallbacks";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Helper to format display name
function formatDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.lastName) {
    return user.lastName;
  }
  return user.email.split("@")[0];
}

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
    "Manager"
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

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

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

  const handleDeleteClick = async (user: EventRoleUserResponse) => {
    const displayName = formatDisplayName(user);
    if (
      !confirm(
        `Are you sure you want to remove ${displayName} as a ${activeTab.toLowerCase()}?`
      )
    ) {
      return;
    }

    const role: EventUserRoleValue =
      activeTab === "Manager" ? "MANAGER" : "EVALUATOR";

    try {
      const result = await removeMutation.mutateAsync({
        email: user.email,
        role,
      });
      toast.success(result.message);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
    }
  };

  const handleRetry = () => {
    if (eventQuery.error) {
      eventQuery.refetch();
    }
    if (rolesQuery.error) {
      rolesQuery.refetch();
    }
  };

  // Derive roles data
  const roles = rolesQuery.data;

  const currentList =
    activeTab === "Manager"
      ? (roles?.managers ?? [])
      : (roles?.evaluators ?? []);

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
    <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
      <BoneyardSkeleton
        loading={isLoading}
        name="dashboard-event-manage-roles"
        className="flex w-full max-w-[1200px] flex-col gap-8 rounded-[20px] bg-background p-6 md:p-10"
        fallback={<DashboardManageRolesFallback />}
      >
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-muted-foreground text-base font-normal">
            Manage user roles, set permissions, and control access for a secure
            system.
          </h1>
        </div>

        {/* Owner Section */}
        {roles?.owner && (
          <div>
            <RoleCard
              name={formatDisplayName(roles.owner)}
              email={roles.owner.email}
              imageUrl={roles.owner.imageUrl}
              type="Owner"
            />
          </div>
        )}

        <div className="h-[1px] w-full bg-border" />

        {/* Tabs */}
        <div className="flex items-center gap-4">
          {(["Manager", "Evaluator"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-[#A020F0] text-background shadow-md shadow-purple-900/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {tab}
              <span className="ml-2 text-xs opacity-70">
                (
                {tab === "Manager"
                  ? roles?.managers.length
                  : roles?.evaluators.length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Interactive Role List */}
        <div className="flex flex-col gap-4 min-h-[400px]">
          {currentList.length > 0 ? (
            <>
              {currentList.map((user) => (
                <RoleCard
                  key={`${user.id}-${user.role}`}
                  name={formatDisplayName(user)}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  type={activeTab}
                  onDelete={() => handleDeleteClick(user)}
                />
              ))}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-6 py-2 rounded-full border border-border text-[#A020F0] font-medium hover:bg-[#F3E8FF] transition-colors"
                >
                  <span className="text-xl leading-none mb-0.5">+</span> Add{" "}
                  {activeTab}
                </button>
              </div>
            </>
          ) : (
            <EmptyState roleName={activeTab} onAdd={handleAddClick} />
          )}
        </div>

        <AddRoleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          roleType={activeTab}
          onAdd={handleAddRole}
          isLoading={addMutation.isPending}
          ownerId={roles?.owner.id}
        />
      </div>
      </BoneyardSkeleton>
    </div>
  );
}
