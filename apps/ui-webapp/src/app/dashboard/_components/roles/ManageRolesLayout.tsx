"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { RoleCard } from "./RoleCard";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { DashboardManageRolesFallback } from "@/components/boneyard/loading-fallbacks";

export interface RoleUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string;
  imageUrl?: string | null;
}

interface ManageRolesLayoutProps {
  owner: RoleUser | null;
  managers: RoleUser[];
  evaluators: RoleUser[];
  isLoading?: boolean;
  onAddRole: (role: "Manager" | "Evaluator") => void;
  onDeleteRole: (user: RoleUser, role: "Manager" | "Evaluator") => void;
  skeletonName?: string;
}

export function ManageRolesLayout({
  owner,
  managers,
  evaluators,
  isLoading,
  onAddRole,
  onDeleteRole,
  skeletonName = "manage-roles",
}: ManageRolesLayoutProps) {
  const [activeTab, setActiveTab] = useState<"Manager" | "Evaluator">(
    "Manager",
  );

  const formatDisplayName = (user: RoleUser): string => {
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    return user.firstName || user.lastName || user.email.split("@")[0];
  };

  const currentList = activeTab === "Manager" ? managers : evaluators;

  return (
    <div className="flex w-full justify-center">
      <BoneyardSkeleton
        loading={!!isLoading}
        name={skeletonName}
        className="flex w-full flex-col gap-10 p-4"
        fallback={<DashboardManageRolesFallback />}
      >
        <div className="flex flex-col gap-10">
          {/* Header Description */}
          <p className="text-neutral-700 text-lg">
            Manage user roles, set permissions, and control access for a secure
            system.
          </p>

          {/* Owner Section */}
          {owner && (
            <div className="flex flex-col gap-4">
              <RoleCard
                name={formatDisplayName(owner)}
                email={owner.email}
                phone={owner.phone}
                imageUrl={owner.imageUrl}
                type="Owner"
              />
            </div>
          )}

          <div className="h-px w-full bg-[#EAECF0]" />

          {/* Tabs Section */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center border-b border-[#EAECF0]">
              {(["Manager", "Evaluator"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-4 py-3 text-base transition-all flex items-center gap-2",
                    activeTab === tab
                      ? "text-primary-600"
                      : "text-neutral-600 hover:text-primary-600",
                  )}
                >
                  {tab}s
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                      activeTab === tab
                        ? "bg-primary-100 text-primary-600"
                        : "bg-neutral-100 text-neutral-600",
                    )}
                  >
                    {tab === "Manager" ? managers.length : evaluators.length}
                  </span>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                  )}
                </button>
              ))}
            </div>

            {/* List Section */}
            <div className="flex flex-col gap-4 min-h-[400px]">
              {currentList.length > 0 ? (
                <>
                  <div className="flex flex-col gap-4">
                    {currentList.map((user) => (
                      <RoleCard
                        key={user.id}
                        name={formatDisplayName(user)}
                        email={user.email}
                        phone={user.phone}
                        imageUrl={user.imageUrl}
                        type={activeTab}
                        onDelete={() => onDeleteRole(user, activeTab)}
                      />
                    ))}
                  </div>

                  {/* Add Button for Non-Empty State */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => onAddRole(activeTab)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-neutral-200 text-primary-600 font-bold text-base hover:bg-primary-50 transition-all bg-white"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Add {activeTab}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-neutral-200 gap-8">
                  <div className="relative w-72 h-48">
                    <img
                      src="/illustrations/no_manager.svg"
                      alt={`No ${activeTab.toLocaleLowerCase()}(s) have been assigned yet`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center max-w-sm">
                    <h3 className="text-xl font-black text-neutral-900">
                      No {activeTab.toLowerCase()}(s) have been assigned yet
                    </h3>
                    <p className="text-neutral-700 text-base">
                      {activeTab.toLowerCase()} will have complete access to
                      event they can do edits on your behalf.
                    </p>
                  </div>
                  <button
                    onClick={() => onAddRole(activeTab)}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary-600 text-white font-black text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20"
                  >
                    <PlusCircle className="w-6 h-6" />
                    Assign {activeTab}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </BoneyardSkeleton>
    </div>
  );
}
