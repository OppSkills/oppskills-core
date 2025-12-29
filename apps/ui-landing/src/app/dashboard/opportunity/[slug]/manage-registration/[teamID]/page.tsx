"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, UserCircle2, Loader2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import TeamMembers, { TeamMember } from "./_components/TeamMembers";
import { useTeams } from "@/hooks/useTeams";
import { useHackathonRegistrationsBySlug } from "@/hooks/useHackathonRegistrations";
import type { TeamDetailResponse } from "@/lib/api/teamApi";
import { getTeamRegistrationAnswers } from "@/lib/api/hackathonApi";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeamManagementPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const teamId = params.teamID as string;

  const { teamById } = useTeams();
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
  } = teamById(teamId);
  const { data: registrationsData } = useHackathonRegistrationsBySlug(slug);

  const [activeTab, setActiveTab] = useState<string>("members");

  const { getToken } = useAuth();

  const { data: registrationAnswersData, isLoading: isLoadingAnswers } =
    useQuery({
      queryKey: ["team-registration-answers", slug, teamId],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return null;
        return getTeamRegistrationAnswers(token, slug, teamId);
      },
      enabled: activeTab === "registration-answers",
    });

  const formatAnswerValue = (
    value: string | string[] | number | null | undefined,
  ): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  };

  // Build members list from team data
  const members: TeamMember[] = useMemo(() => {
    if (!teamData) return [];
    const team = teamData as TeamDetailResponse;

    const result: TeamMember[] = [];

    // Add leader first
    result.push({
      id: team.leader.id,
      name:
        [team.leader.firstName, team.leader.lastName]
          .filter(Boolean)
          .join(" ") || team.leader.email,
      role: "Team Leader",
      college: "—",
      email: team.leader.email,
      location: "—",
      education: "—",
      registeredOn: new Date(team.createdAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatarUrl: team.leader.imageUrl || undefined,
    });

    // Add members
    for (const member of team.members) {
      result.push({
        id: member.user.id,
        name:
          [member.user.firstName, member.user.lastName]
            .filter(Boolean)
            .join(" ") || member.user.email,
        role: "Team Member",
        college: "—",
        email: member.user.email,
        location: "—",
        education: "—",
        registeredOn: new Date(member.joinedAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatarUrl: member.user.imageUrl || undefined,
      });
    }

    return result;
  }, [teamData]);

  // Build round tabs from registrations data
  const roundTabs = useMemo(() => {
    if (!registrationsData || registrationsData.rounds.length === 0) return [];
    return registrationsData.rounds.map((round) => ({
      id: round.id,
      name: round.name,
      order: round.order,
    }));
  }, [registrationsData]);

  // Find submission for selected round
  const selectedRoundSubmission = useMemo(() => {
    if (!registrationsData || activeTab === "members") return null;
    const team = registrationsData.teams.find((t) => t.teamId === teamId);
    if (!team) return null;
    return team.roundSubmissions[activeTab] || null;
  }, [registrationsData, activeTab, teamId]);

  const handleBack = () => {
    router.back();
  };

  if (teamLoading) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px] bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (teamError || !teamData) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px] bg-surface">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load team</p>
          <p className="text-muted-foreground text-sm mt-1">
            {teamError instanceof Error ? teamError.message : "Team not found"}
          </p>
        </div>
      </div>
    );
  }

  const team = teamData as TeamDetailResponse;
  const teamInitials = team.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-2 sm:p-4 md:p-6 lg:p-10 space-y-6 font-inter">
      {/* Header Section */}
      <div className="flex items-center gap-4 bg-background p-4 rounded-xl shadow-sm border border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="hover:bg-gray-100 rounded-full h-10 w-10"
        >
          <ChevronLeft className="h-6 w-6 text-gray-500" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-background font-bold text-lg">
              {teamInitials}
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-poppins">
              {team.name}
            </h1>
          </div>
          <Badge className="w-fit mt-1 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-medium text-xs px-2 py-0.5 rounded-md">
            {members.length} / {team.maxSize} Members
          </Badge>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex flex-wrap gap-4">
        {/* Tab 1: Team Members */}
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${
            activeTab === "members"
              ? "bg-secondary/50 border-primary/30 text-primary-500 shadow-sm"
              : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
          }`}
        >
          <UserCircle2 className="h-5 w-5" />
          Team Members
        </button>

        {/* Tab 2: Registration Answers */}
        <button
          onClick={() => setActiveTab("registration-answers")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${
            activeTab === "registration-answers"
              ? "bg-secondary/50 border-primary/30 text-primary-500 shadow-sm"
              : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          Registration Answers
        </button>

        {/* Round Tabs - Dynamic from rounds data */}
        {roundTabs.map((round) => (
          <button
            key={round.id}
            onClick={() => setActiveTab(round.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${
              activeTab === round.id
                ? "bg-secondary/50 border-primary/30 text-primary-500 shadow-sm"
                : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
            }`}
          >
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs border ${
                activeTab === round.id
                  ? "border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {round.order}
            </div>
            {round.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-primary-foreground rounded-[20px] p-2 sm:p-4 md:p-6 lg:p-10 shadow-sm border border-gray-100 min-h-[500px]">
        {activeTab === "members" && <TeamMembers members={members} />}

        {activeTab === "registration-answers" && (
          <div className="space-y-6">
            {isLoadingAnswers && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingAnswers &&
              registrationAnswersData &&
              registrationAnswersData.fields.length > 0 && (
                <div className="space-y-8">
                  {registrationAnswersData.fields.map((field) => (
                    <div key={field.id} className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                        {field.label}
                      </h3>
                      <div className="grid gap-3">
                        {registrationAnswersData.respondents.map(
                          (respondent) => {
                            const answer = respondent.answers.find(
                              (a) => a.fieldId === field.id,
                            );
                            return (
                              <div
                                key={respondent.odooId}
                                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={respondent.avatarUrl || undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {respondent.odooName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {respondent.odooName}
                                    </span>
                                    {respondent.isLeader && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Leader
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formatAnswerValue(answer?.value)}
                                  </p>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {!isLoadingAnswers &&
              (!registrationAnswersData ||
                registrationAnswersData.fields.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-muted-foreground text-lg">
                    No registration form
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    This hackathon does not have a registration form configured
                  </p>
                </div>
              )}
          </div>
        )}

        {activeTab !== "members" && activeTab !== "registration-answers" && (
          <div className="space-y-4">
            {selectedRoundSubmission ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    Submitted
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedRoundSubmission.submittedAt
                      ? new Date(
                          selectedRoundSubmission.submittedAt,
                        ).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Submission Data</h3>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(selectedRoundSubmission.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-lg">
                  No submission yet
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  This team has not submitted for this round
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
