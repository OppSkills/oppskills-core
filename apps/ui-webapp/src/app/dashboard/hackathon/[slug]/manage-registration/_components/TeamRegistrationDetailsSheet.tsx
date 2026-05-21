"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  UserCircle2,
  Loader2,
  ClipboardList,
  FileText,
  Download,
  ExternalLink,
  Users,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";
import {
  useHackathonRegistrationsBySlug,
  useHackathonTeamRegistration,
} from "@/hooks/useHackathonRegistrations";
import type { TeamDetailResponse } from "@/lib/api/teamApi";
import { getTeamRegistrationAnswers } from "@/lib/api/hackathonApi";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/utils";
import { getSafeToken } from "@/lib/auth-utils";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RegistrationInfoCard } from "@/app/dashboard/_components/registration/RegistrationInfoCard";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import {
  CardListFallback,
  ProfileLikeFallback,
} from "@/components/boneyard/loading-fallbacks";

interface TeamRegistrationDetailsSheetProps {
  teamId: string | null;
  slug: string;
  onClose: () => void;
}

export function TeamRegistrationDetailsSheet({
  teamId,
  slug,
  onClose,
}: TeamRegistrationDetailsSheetProps) {
  const { teamById } = useTeams();
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
  } = teamById(teamId || "");

  const { data: registrationsData } = useHackathonRegistrationsBySlug(slug);
  const { data: teamRegistrationData, isLoading: teamRegistrationLoading } =
    useHackathonTeamRegistration(slug, teamId);
  const [activeTab, setActiveTab] = useState<string>("");

  // Build round tabs from registrations data
  const roundTabs = useMemo(() => {
    if (!registrationsData || registrationsData.rounds.length === 0) return [];
    return registrationsData.rounds.map((round) => ({
      id: round.id,
      name: round.name,
      order: round.order,
    }));
  }, [registrationsData]);

  // Set default tab to first round when data is available
  useEffect(() => {
    if (roundTabs.length > 0 && activeTab === "") {
      setActiveTab(roundTabs[0].id);
    }
  }, [roundTabs, activeTab]);

  const { getToken } = useAuth();

  const { data: registrationAnswersData, isLoading: isLoadingAnswers } =
    useQuery({
      queryKey: ["team-registration-answers", slug, teamId],
      queryFn: async () => {
        const token = await getSafeToken(getToken);
        if (!token || !teamId) return null;
        return getTeamRegistrationAnswers(token, slug, teamId);
      },
      enabled: !!teamId,
    });

  const formatLocation = (
    profile:
      | TeamDetailResponse["leader"]["onboardingProfile"]
      | null
      | undefined,
  ): string => {
    if (!profile) return "—";
    const parts = [
      profile.locationCity,
      profile.locationState,
      profile.locationCountry,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  const formatEducation = (
    profile:
      | TeamDetailResponse["leader"]["onboardingProfile"]
      | null
      | undefined,
  ): string => {
    if (!profile) return "—";
    if (profile.userCategory === "student") {
      const school = profile.schoolName || profile.college?.name;
      const classLabel = profile.schoolClass || profile.collegeCurrentYear;
      const parts = [school, classLabel].filter(Boolean);
      return parts.length > 0 ? parts.join(" • ") : "Student";
    }

    if (profile.userCategory === "professional") {
      const parts = [profile.jobTitle, profile.companyName].filter(Boolean);
      return parts.length > 0 ? parts.join(" @ ") : "Professional";
    }

    return "—";
  };

  const formatCollege = (
    profile:
      | TeamDetailResponse["leader"]["onboardingProfile"]
      | null
      | undefined,
  ): string => profile?.college?.name || profile?.schoolName || "—";

  // Build members list from team data
  const members = useMemo(() => {
    if (!teamData) return [];
    const team = teamData as TeamDetailResponse;

    const result = [];

    // Helper to get answers for a specific user
    const getUserAnswers = (userId: string) => {
      if (!registrationAnswersData) return [];
      const respondent = registrationAnswersData.respondents.find(
        (r: any) => r.userId === userId,
      );
      return respondent?.answers || [];
    };

    // Add leader first
    result.push({
      id: team.leader.id,
      name:
        [team.leader.firstName, team.leader.lastName]
          .filter(Boolean)
          .join(" ") || team.leader.email,
      role: "Team Leader",
      college: formatCollege(team.leader.onboardingProfile ?? null),
      email: team.leader.email,
      location: formatLocation(team.leader.onboardingProfile ?? null),
      education: formatEducation(team.leader.onboardingProfile ?? null),
      registeredOn: new Date(team.createdAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatarUrl: team.leader.imageUrl || undefined,
      answers: getUserAnswers(team.leader.id),
      registrationFields: registrationAnswersData?.fields || [],
    });

    // Add members
    for (const member of team.members ?? []) {
      result.push({
        id: member.user.id,
        name:
          [member.user.firstName, member.user.lastName]
            .filter(Boolean)
            .join(" ") || member.user.email,
        role: "Team Member",
        college: formatCollege(member.user.onboardingProfile ?? null),
        email: member.user.email,
        location: formatLocation(member.user.onboardingProfile ?? null),
        education: formatEducation(member.user.onboardingProfile ?? null),
        registeredOn: new Date(member.joinedAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatarUrl: member.user.imageUrl || undefined,
        answers: getUserAnswers(member.user.id),
        registrationFields: registrationAnswersData?.fields || [],
      });
    }

    return result;
  }, [teamData, registrationAnswersData]);

  // Find submission for selected round
  const selectedRoundSubmission = useMemo(() => {
    if (!teamRegistrationData || activeTab === "members" || !teamId)
      return null;
    const team = teamRegistrationData.team;
    if (!team || team.teamId !== teamId) return null;
    return team.roundSubmissions[activeTab] || null;
  }, [teamRegistrationData, activeTab, teamId]);

  const team = teamData as TeamDetailResponse | null;
  const teamInitials = team?.name?.slice(0, 2).toUpperCase() || "??";

  return (
    <Sheet open={!!teamId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-neutral-50 p-0 flex flex-col gap-0 border-l border-neutral-200 overflow-hidden">
        <SheetHeader className="p-4 border-b border-neutral-200 bg-white flex flex-row items-center gap-4 space-y-0 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-100 text-neutral-500"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                {teamInitials}
              </div>
              <SheetTitle className="text-lg font-black text-neutral-900 poppins">
                {team?.name || "Loading..."}
              </SheetTitle>
            </div>
            {team && (
              <SheetDescription className="text-xs text-neutral-500 inter font-medium ml-11">
                {members.length} / {team.maxSize} Members
              </SheetDescription>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar p-2 flex flex-col gap-4">
          <BoneyardSkeleton
            loading={teamLoading || isLoadingAnswers}
            name="team-details-members"
            fallback={<CardListFallback rows={2} className="px-0 py-0" />}
            className="w-full"
          >
            <div className="flex flex-col gap-4">
              {members.map((member) => (
                <RegistrationInfoCard key={member.id} participant={member} />
              ))}
            </div>
          </BoneyardSkeleton>

          {/* Rounds Section */}
          <BoneyardSkeleton
            loading={teamRegistrationLoading}
            name="team-details-rounds"
            fallback={<CardListFallback rows={1} className="px-0 py-0" />}
            className="w-full"
          >
            {roundTabs.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary-500" />
                    <h4 className="text-sm font-black font-poppins text-neutral-900 uppercase tracking-wider">
                      Rounds & Submissions
                    </h4>
                  </div>
                </div>

                {/* Rounds Tabs Navigation */}
                <div className="flex flex-wrap gap-2">
                  {roundTabs.map((round) => (
                    <button
                      key={round.id}
                      onClick={() => setActiveTab(round.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        activeTab === round.id
                          ? "bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/20"
                          : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] border ${
                          activeTab === round.id
                            ? "border-white"
                            : "border-neutral-300"
                        }`}
                      >
                        {round.order + 1}
                      </div>
                      {round.name}
                    </button>
                  ))}
                </div>

                {/* Round Content */}
                <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
                  {selectedRoundSubmission ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 rounded-full font-bold inter text-xs">
                          Submitted
                        </Badge>
                        <span className="text-xs text-neutral-400 inter font-medium">
                          {selectedRoundSubmission.submittedAt
                            ? new Date(
                                selectedRoundSubmission.submittedAt,
                              ).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>

                      {selectedRoundSubmission.payload
                        ? (() => {
                            const payload =
                              selectedRoundSubmission.payload as Record<
                                string,
                                unknown
                              >;
                            const files = payload.files as
                              | Array<{
                                  url?: string;
                                  publicUrl?: string;
                                  fileName?: string;
                                  name?: string;
                                  mimeType?: string;
                                  size?: number;
                                }>
                              | undefined;
                            const fileUrl = (payload.fileUrl || payload.url) as
                              | string
                              | undefined;
                            const fileName = payload.fileName as
                              | string
                              | undefined;

                            return (
                              <div className="space-y-6">
                                {Array.isArray(files) && files.length > 0 && (
                                  <div className="space-y-3">
                                    <h3 className="font-bold text-neutral-800 poppins text-sm">
                                      Submitted Files
                                    </h3>
                                    <div className="grid gap-3">
                                      {files.map((file, index) => {
                                        const url = file.url || file.publicUrl;
                                        const name =
                                          file.fileName ||
                                          file.name ||
                                          `File ${index + 1}`;
                                        return (
                                          <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                                          >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-neutral-100">
                                              <FileText className="h-5 w-5 text-primary-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-bold text-neutral-800 truncate text-sm inter">
                                                {name}
                                              </p>
                                              {file.mimeType && (
                                                <p className="text-[10px] text-neutral-400 font-medium inter">
                                                  {file.mimeType}
                                                </p>
                                              )}
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {!Array.isArray(files) && fileUrl && (
                                  <div className="space-y-3">
                                    <h3 className="font-bold text-neutral-800 poppins text-sm">
                                      Submitted File
                                    </h3>
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                                    >
                                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-neutral-100">
                                        <FileText className="h-5 w-5 text-primary-500" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-neutral-800 truncate text-sm inter">
                                          {fileName || "Submission File"}
                                        </p>
                                      </div>
                                      <Download className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                                    </a>
                                  </div>
                                )}

                                {Object.entries(payload).filter(
                                  ([key]) =>
                                    ![
                                      "files",
                                      "fileUrl",
                                      "url",
                                      "fileName",
                                    ].includes(key),
                                ).length > 0 && (
                                  <div className="space-y-3">
                                    <h3 className="font-bold text-neutral-800 poppins text-sm">
                                      Additional Information
                                    </h3>
                                    <div className="grid gap-3">
                                      {Object.entries(payload)
                                        .filter(
                                          ([key]) =>
                                            ![
                                              "files",
                                              "fileUrl",
                                              "url",
                                              "fileName",
                                            ].includes(key),
                                        )
                                        .map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"
                                          >
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider inter">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            </p>
                                            <p className="text-neutral-800 mt-1 inter text-sm font-medium">
                                              {typeof value === "string"
                                                ? value
                                                : JSON.stringify(value)}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        : null}
                    </div>
                  ) : (
                    <EmptyState
                      title="No submission yet"
                      description="This team has not submitted for this round"
                      className="py-12"
                    />
                  )}
                </div>
              </div>
            )}
          </BoneyardSkeleton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
