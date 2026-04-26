"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Stages from "./_components/Stages";
import Participants, { Participant } from "./_components/Participants";
import { useHackathonRegistrationsBySlug } from "@/hooks/useHackathonRegistrations";
import { getApiErrorMessage } from "@/lib/utils";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);

  const { data, isLoading, error } = useHackathonRegistrationsBySlug(slug, { page, take });

  const [currentStage, setCurrentStage] = useState("All registrations");

  const selectedRoundId = useMemo(() => {
    if (!data) return null;
    if (currentStage === "All registrations") return null;

    const match = currentStage.match(/^R(\d+)\s*-/);
    if (!match) return null;

    const order = parseInt(match[1], 10);
    const round = data.rounds.find((r) => r.order === order - 1);
    return round?.id ?? null;
  }, [currentStage, data]);

  /**
   * The "Qualify to next round" action should set qualification on the NEXT round.
   * Example: when you're on R1 tab, qualifying moves the team into R2 by setting R2.qualified=true.
   */
  const nextRoundId = useMemo(() => {
    if (!data || !selectedRoundId) return null;
    const sortedRounds = [...data.rounds].sort((a, b) => a.order - b.order);
    const selectedRound = sortedRounds.find((r) => r.id === selectedRoundId);
    if (!selectedRound) return null;
    const nextRound = sortedRounds.find(
      (r) => r.order === selectedRound.order + 1,
    );
    return nextRound?.id ?? null;
  }, [data, selectedRoundId]);

  // Build stages from rounds data
  const stages = useMemo(() => {
    if (!data) return [];

    // helper that returns filtered teams for a stage (same logic used later for participants)
    const getFilteredForRound = (roundId: string | null) => {
      if (!roundId) return data.teams.items;

      const selectedRound = data.rounds.find((r) => r.id === roundId);
      if (!selectedRound) return [];

      if (selectedRound.order === 0) {
        return data.teams.items.filter((team) => {
          const submission = team.roundSubmissions[roundId];
          return !!submission?.submittedAt;
        });
      }

      return data.teams.items.filter((team) => {
        return team.roundQualifications?.[roundId]?.qualified === true;
      });
    };

    const stagesList: Array<{ name: string; description: string; displayName?: string }> = [
      { name: "All registrations", description: "All registered teams" },
    ];

    // Add rounds with counts
    for (const round of data.rounds) {
      const name = `R${round.order + 1} - ${round.name}`;
      stagesList.push({
        name,
        description: `${round.roundType} round`,
      });
    }

  return stagesList;
  }, [data]);

  // Map teams to Participant format for the selected stage
  const participants: Participant[] = useMemo(() => {
    if (!data) return [];

    // Filter teams based on selected round
    let filteredTeams;
    if (selectedRoundId) {
      const selectedRound = data.rounds.find((r) => r.id === selectedRoundId);
      if (selectedRound?.order === 0) {
        // For first round, show teams that have submitted
        filteredTeams = data.teams.items.filter((team) => {
          const submission = team.roundSubmissions[selectedRoundId];
          return !!submission?.submittedAt;
        });
      } else {
        // For subsequent rounds, show teams that qualified for this round
        filteredTeams = data.teams.items.filter((team) => {
          return team.roundQualifications?.[selectedRoundId]?.qualified === true;
        });
      }
    } else {
      filteredTeams = data.teams.items;
    }

    return filteredTeams.map((team, index) => {
      // Determine current round status
      let currentRound = "Registered";
      let status: "Completed" | "Incomplete" = "Completed";
      let qualificationStatus:
        | "Qualified"
        | "Not Qualified"
        | "Awaiting"
        | null = null;

      if (selectedRoundId) {
        const submission = team.roundSubmissions[selectedRoundId];
        if (submission?.submittedAt) {
          currentRound = "Submitted";
          status = "Completed";
        } else {
          currentRound = "Not Submitted";
          status = "Incomplete";
        }

        /**
         * Show qualification status for the NEXT round (this is what "push to next round" controls).
         * If there is no next round (last round), we don't show a qualification status.
         */
        if (nextRoundId) {
          const qualification = team.roundQualifications?.[nextRoundId];
          if (qualification) {
            qualificationStatus = qualification.qualified
              ? "Qualified"
              : "Not Qualified";
          } else {
            qualificationStatus = "Awaiting";
          }
        } else {
          qualificationStatus = null;
        }
      } else {
        // When viewing "All registrations", determine status based on team size
        // For range teams: Completed if memberCount >= minSize
        // For absolute teams: Completed if memberCount >= maxSize
        if (team.minSize !== undefined) {
          // Range team
          status = team.memberCount >= team.minSize ? "Completed" : "Incomplete";
        } else {
          // Absolute team (existing logic)
          status = team.memberCount >= team.maxSize ? "Completed" : "Incomplete";
        }
      }

      return {
        id: team.teamId,
        serialNumber: index + 1,
        teamName: team.teamName,
        memberCount: team.memberCount,
        email: team.leader.email,
        university: team.leader.university || "—",
        avatarUrl: team.leader.imageUrl || "",
        status,
        currentRound,
        qualificationStatus,
        teamCreatedAt: team.createdAt,
        teamIsOpen: team.isOpen,
        teamInvitationCode: team.invitationCode,
        leaderFirstName: team.leader.firstName,
        leaderLastName: team.leader.lastName,
        leaderPhone: team.leader.phone ?? "",
        maxSize: team.maxSize,
        teamMembers: team.members,
      };
    });
  }, [data, selectedRoundId, nextRoundId]);

  if (!isLoading && error) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px] bg-surface">
        <div className="text-center">
          <p className="text-destructive font-medium">
            Failed to load registrations
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {getApiErrorMessage(error, "Unknown error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="dashboard-hackathon-manage-registration"
      className="w-full min-h-screen bg-background"
      fallback={<TableBlockFallback className="min-h-screen bg-background p-8" />}
    >
      {!isLoading && (!data || data.teams.total === 0) ? (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl p-4 sm:p-6 md:p-8 flex flex-col gap-6">
          <Stages
            stages={stages}
            selectedStage={currentStage}
            onSelectStage={setCurrentStage}
          />
          <div className="h-px my-4 w-full bg-foreground/10" />
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground text-lg font-medium">
              No team registrations yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Teams will appear here once participants register
            </p>
          </div>
        </div>
      </div>
      ) : !isLoading && data ? (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl p-4 sm:p-6 md:p-8 flex flex-col gap-6">
          <Stages
            stages={stages}
            selectedStage={currentStage}
            onSelectStage={setCurrentStage}
          />
          <div className="h-px my-4 w-full bg-foreground/10" />
          <Participants
            data={participants}
            selectedRoundId={selectedRoundId}
            nextRoundId={nextRoundId}
            hackathonId={data.hackathonId}
            hackathonName={data.name}
            page={page}
            totalPages={data.teams.totalPages}
            take={take}
            onPageChange={setPage}
            onTakeChange={setTake}
          />
        </div>
      </div>
      ) : null}
    </BoneyardSkeleton>
  );
}
