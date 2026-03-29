import React, { useState } from "react";
import Image from "next/image";
import {
  LogOut,
  Trash2,
  UserMinus,
  Mail,
  Phone,
  CheckCircle,
  MoreVertical,
  Share2
} from "lucide-react";
import { SquareShareLine } from '@solar-icons/react';
import { Button } from "@/components/ui/button";
import {
  type TeamDetailResponse,
  leaveTeam,
  removeMember
} from "@/lib/api/teamApi";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TeamDetailsCardProps {
  team: TeamDetailResponse;
  currentUserId: string;
  hackathonSlug: string;
  onUpdate?: () => void;
}

export function TeamDetailsCard({
  team,
  currentUserId,
  hackathonSlug,
  onUpdate
}: TeamDetailsCardProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isLeader = team.leaderId === currentUserId;

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;

    setIsActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await leaveTeam(token, team.id);
      toast.success("Left team successfully");
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to leave team:", error);
      toast.error("Failed to leave team");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleKickMember = async (memberUserId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to kick ${memberName} out?`)) return;

    setIsActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await removeMember(token, team.id, memberUserId);
      toast.success(`${memberName} has been removed from the team`);
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to kick member:", error);
      toast.error("Failed to kick member");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShareTeam = () => {
    if (team.invitationCode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oppskills.com";
      const link = `${baseUrl}/hackathons/${hackathonSlug}?registration=join&invitation=${team.invitationCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Team registration link copied!");
    }
  };

  const renderMemberCard = (member: any, role: "Leader" | "Member") => {
    const user = member.user || member; // member.user exists for TeamMember, but leader is passed directly or as a user object
    const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown User";
    const initials = (user.firstName?.[0] || user.email?.[0] || "U").toUpperCase();
    const isCurrentUser = user.id === currentUserId;

    return (
      <div
        key={user.id}
        className="group relative flex items-center gap-4 p-4 mb-3 bg-white border border-neutral-200 rounded-4xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {/* Avatar */}
        <div className="shrink-0 w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xl font-bold overflow-hidden border-2 border-neutral-100">
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={displayName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h5 className="text-lg font-medium text-neutral-900 truncate">
              {displayName} {isCurrentUser && <span className="text-neutral-500 font-normal">(You)</span>}
            </h5>
            <Badge className="h-4" variant={role === "Leader" ? "default" : "secondary"}>
              {role === "Leader" ? "Leader" : "Member"}
            </Badge>
          </div>

          <div className="flex flex-col gap-y-1 text-sm text-neutral-500">
            <span className="flex items-center gap-1 truncate">
              <Mail className="w-3.5 h-3.5" />
              {user.email || "no-email@example.com"}
            </span>
          </div>
        </div>

        {/* Kick Action (Leader only, can't kick self) */}
        {isLeader && !isCurrentUser && role === "Member" && (
          <button
            onClick={() => handleKickMember(user.id, displayName)}
            disabled={isActionLoading}
            className="absolute -right-2 -top-2 w-8 h-8 bg-red-50 text-red-600 rounded-full border border-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shadow-sm"
            title="Kick Member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-4 mt-4">
      {/* Team Header */}
      <div className="flex flex-col gap-2">
        <h4 className="text-2xl font-medium tracking-tight">Team Details</h4>
        <div className="flex w-full justify-between items-center text-primary-600">
          <p className="text-base">
            <span className="text-neutral-700">Team Name: </span>
            <span className="font-semibold text-purple-700">
              {team.name} ({team.members.length + 1}/{team.maxSize})
            </span>
          </p>
          <button
            onClick={handleShareTeam}
            className="text-xs flex items-center gap-1.5 font-medium hover:text-primary-700 transition-colors bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100"
          >
            <SquareShareLine size={16} />
            Share Team
          </button>
        </div>
      </div>

      {/* Tabs Design - Pill shape as in screenshot */}
      <div className="flex p-1 bg-neutral-100/80 rounded-full w-fit">
        <div className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-full flex items-center gap-3 shadow-sm">
          <div className="relative">
            <Image src="/icons/members-group.svg" alt="Members" width={24} height={24} className="opacity-80" onError={(e) => {
              // Fallback if svg doesn't exist
              (e.target as any).style.display = 'none';
            }} />
            <div className="absolute inset-0 flex items-center justify-center text-purple-600">
              <CheckCircle className="w-5 h-5 fill-purple-100" />
            </div>
          </div>
          <span className="font-medium text-lg">Team Members</span>
        </div>
      </div>

      {/* Member List */}
      <div className="flex flex-col mt-2">
        {/* Render Leader First */}
        {renderMemberCard(team.leader, "Leader")}

        {/* Render Members */}
        {team.members.map(member => renderMemberCard(member, "Member"))}

        {/* Empty slots indicator if team is not full */}
        {team.members.length + 1 < team.maxSize && (
          <div className="flex items-center gap-4 p-4 mb-3 border-2 border-dashed border-neutral-200 rounded-4xl opacity-50">
            <div className="shrink-0 w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <UserMinus className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-neutral-500 font-medium">Waiting for members...</p>
              <p className="text-xs text-neutral-400">Use code {team.invitationCode} to invite</p>
            </div>
          </div>
        )}
      </div>

      {/* Leave Team Button (For members only) */}
      {!isLeader && (
        <Button
          variant="outline"
          onClick={handleLeaveTeam}
          disabled={isActionLoading}
          className="mt-2 w-full py-6 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Leave Team
        </Button>
      )}
    </div>
  );
}
