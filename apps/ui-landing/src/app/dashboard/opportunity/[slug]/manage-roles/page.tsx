"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import RoleCard from "./_components/RoleCard";
import AddRoleModal from "./_components/AddEditRoleModal";
import EmptyState from "./_components/EmptyState";
import { cn } from "@/lib/utils";
import { 
  getHackathonRoles, 
  addHackathonRole, 
  removeHackathonRole,
  getHackathonBySlug,
} from "@/lib/api/hackathonApi";
import type { 
  HackathonRolesResponse, 
  HackathonRoleUserResponse,
  HackathonUserRoleValue,
} from "@oppskills/types";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Helper to format display name
function formatDisplayName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.email.split("@")[0];
}

export default function ManageRolesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { getToken } = useAuth();

  const [activeTab, setActiveTab] = useState<"Manager" | "Evaluator">("Manager");
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [roles, setRoles] = useState<HackathonRolesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch hackathon ID from slug first
  const fetchHackathonId = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const hackathon = await getHackathonBySlug(token, slug) as { id: string };
      setHackathonId(hackathon.id);
      return hackathon.id;
    } catch (err) {
      console.error("Error fetching hackathon:", err);
      throw err;
    }
  }, [getToken, slug]);

  // Fetch roles
  const fetchRoles = useCallback(async (id?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const hackId = id || hackathonId;
      if (!hackId) {
        // Need to fetch hackathon ID first
        const fetchedId = await fetchHackathonId();
        const rolesData = await getHackathonRoles(token, fetchedId);
        setRoles(rolesData);
      } else {
        const rolesData = await getHackathonRoles(token, hackId);
        setRoles(rolesData);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, hackathonId, fetchHackathonId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleAddRole = async (email: string) => {
    if (!hackathonId) return;
    
    setIsAddingRole(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const role: HackathonUserRoleValue = activeTab === "Manager" ? "MANAGER" : "EVALUATOR";
      const result = await addHackathonRole(token, hackathonId, { email, role });
      
      if (result.alreadyExists) {
        toast.info(result.message);
      } else {
        toast.success(result.message);
      }
      
      // Refresh roles list
      await fetchRoles();
    } catch (err) {
      console.error("Error adding role:", err);
      const message = err instanceof Error ? err.message : "Failed to add role";
      toast.error(message);
      throw err;
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleDeleteClick = async (user: HackathonRoleUserResponse) => {
    if (!hackathonId) return;
    
    const displayName = formatDisplayName(user);
    if (!confirm(`Are you sure you want to remove ${displayName} as a ${activeTab.toLowerCase()}?`)) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const role: HackathonUserRoleValue = activeTab === "Manager" ? "MANAGER" : "EVALUATOR";
      const result = await removeHackathonRole(token, hackathonId, { email: user.email, role });
      
      toast.success(result.message);
      
      // Refresh roles list
      await fetchRoles();
    } catch (err) {
      console.error("Error removing role:", err);
      const message = err instanceof Error ? err.message : "Failed to remove role";
      toast.error(message);
    }
  };

  const currentList = activeTab === "Manager" 
    ? (roles?.managers ?? []) 
    : (roles?.evaluators ?? []);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-[1200px] p-6 md:p-10 rounded-[20px] bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A020F0]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-[1200px] p-6 md:p-10 rounded-[20px] bg-background flex flex-col items-center justify-center gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => fetchRoles()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
      <div className="w-full max-w-[1200px] p-6 md:p-10 rounded-[20px] bg-background flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-muted-foreground text-base font-normal">
            Manage user roles, set permissions, and control access for a secure system.
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
                  ? "bg-[#A020F0] text-white shadow-md shadow-purple-900/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {tab}
              <span className="ml-2 text-xs opacity-70">
                ({tab === "Manager" ? roles?.managers.length : roles?.evaluators.length})
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
                  <span className="text-xl leading-none mb-0.5">+</span> Add {activeTab}
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              roleName={activeTab}
              onAdd={handleAddClick}
            />
          )}
        </div>

        <AddRoleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          roleType={activeTab}
          onAdd={handleAddRole}
          isLoading={isAddingRole}
        />
      </div>
    </div>
  );
}
