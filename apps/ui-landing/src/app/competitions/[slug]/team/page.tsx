"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, ArrowLeft, CheckCircle, Copy, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import {
  checkMyHackathonTeam,
  removeMember,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import Image from "next/image";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface HackathonData {
  id: string;
  name: string;
  maxTeamSize?: number;
}

export default function TeamDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [myTeam, setMyTeam] = useState<TeamDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!isLoaded || !slug) return;

      setIsLoading(true);
      try {
        const hackathonData = (await getPublicHackathonBySlug(
          slug,
        )) as HackathonData;
        setHackathon(hackathonData);

        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            const team = await checkMyHackathonTeam(token, hackathonData.id);
            setMyTeam(team);
          }
        }
      } catch (err) {
        console.error("Failed to load team data:", err);
        setError("Failed to load team details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isLoaded, isSignedIn, getToken, slug]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Invitation code copied to clipboard");
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      const token = await getToken();
      if (!token || !myTeam) throw new Error("Unauthorized");
      return removeMember(token, myTeam.id, memberUserId);
    },
    onSuccess: () => {
      toast.success("Member removed successfully");
      window.location.reload();
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  const handleRemoveMember = (memberUserId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate(memberUserId);
    }
  };

  const isLeader = userId === myTeam?.leaderId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Error Loading Page
        </h1>
        <p className="text-muted-foreground mb-6">
          {error || "Hackathon not found"}
        </p>
        <Link href="/competitions">
          <Button>Back to Competitions</Button>
        </Link>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center space-y-6">
        <h1 className="text-3xl font-bold">Sign In Required</h1>
        <p className="text-muted-foreground">
          Please sign in to view your team details.
        </p>
        <Link href={`/sign-in?redirect_url=/competitions/${slug}/team`}>
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center space-y-6">
        <div className="p-8 border rounded-2xl bg-muted/30">
          <h1 className="text-2xl font-bold mb-2">No Team Found</h1>
          <p className="text-muted-foreground mb-6">
            You are not registered for {hackathon.name} yet.
          </p>
          <div className="flex justify-center gap-4">
            <Link href={`/competitions/${slug}`}>
              <Button variant="outline">Back to Details</Button>
            </Link>
            <Link href={`/competitions/${slug}`}>
              <Button>Register Now</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const memberCount = (myTeam.members?.length || 0) + 1;

  return (
    <div className="min-h-screen bg-background py-12 font-sans">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/competitions/${slug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {hackathon.name}
          </Link>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 text-center border-b bg-muted/20">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              Registration Confirmed!
            </h1>
            <p className="text-muted-foreground">
              You are part of team{" "}
              <span className="font-semibold text-foreground">
                {myTeam.name}
              </span>
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-muted/30 border border-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Team Name
                </p>
                <p className="text-lg font-bold text-foreground">
                  {myTeam.name}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 border border-muted/50 relative group">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Invitation Code
                </p>
                {myTeam.invitationCode ? (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono font-bold text-foreground tracking-wider">
                      {myTeam.invitationCode}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        copyToClipboard(myTeam.invitationCode || "")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No code available
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-bold text-foreground mb-5 flex items-center justify-between">
                <span>Team Members</span>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full border">
                  {memberCount} /{" "}
                  {myTeam.maxSize || hackathon.maxTeamSize || "N/A"}
                </span>
              </h3>

              <div className="space-y-4">
                {myTeam.leader && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden border-2 border-background shadow-sm">
                      {myTeam.leader.imageUrl ? (
                        <Image
                          src={myTeam.leader.imageUrl}
                          alt="Leader"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (myTeam.leader.firstName?.[0] || "L").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {myTeam.leader.firstName} {myTeam.leader.lastName}
                        </p>
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Leader
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {myTeam.leader.email}
                      </p>
                    </div>
                  </div>
                )}

                {myTeam.members?.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-muted-foreground/20 hover:shadow-sm transition-all"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg overflow-hidden border-2 border-background shadow-sm">
                      {member.user.imageUrl ? (
                        <Image
                          src={member.user.imageUrl}
                          alt="Member"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (member.user.firstName?.[0] || "M").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                    {isLeader && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
