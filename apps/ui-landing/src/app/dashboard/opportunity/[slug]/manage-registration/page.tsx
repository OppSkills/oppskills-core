"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Stages from "./_components/Stages";
import Participants, { Participant } from "./_components/Participants";
import { useHackathonRegistrationsBySlug } from "@/hooks/useHackathonRegistrations";
import { getApiErrorMessage } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, error } = useHackathonRegistrationsBySlug(slug);

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
    const stagesList = [
      { name: "All registrations", description: "All registered teams" },
    ];
    for (const round of data.rounds) {
      stagesList.push({
        name: `R${round.order + 1} - ${round.name}`,
        description: `${round.roundType} round`,
      });
    }
    return stagesList;
  }, [data]);

  // Map teams to Participant format for the selected stage
  const participants: Participant[] = useMemo(() => {
    if (!data) return [];

    // Filter teams based on selected round
    let filteredTeams = data.teams;

    if (selectedRoundId) {
      const selectedRound = data.rounds.find((r) => r.id === selectedRoundId);
      if (selectedRound?.order === 0) {
        // For first round, show teams that have submitted
        filteredTeams = data.teams.filter((team) => {
          const submission = team.roundSubmissions[selectedRoundId];
          return !!submission?.submittedAt;
        });
      } else {
        // For subsequent rounds, show teams that qualified for this round
        filteredTeams = data.teams.filter((team) => {
          return team.roundQualifications?.[selectedRoundId]?.qualified === true;
        });
      }
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
      };
    });
  }, [data, selectedRoundId, nextRoundId]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px] bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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

  if (!data || data.teams.length === 0) {
    return (
      <div className="flex w-full justify-center bg-surface">
        <div className="w-full p-2 sm:p-4 md:p-6 lg:p-10 rounded-[20px] bg-background">
          <Stages
            stages={stages}
            selectedStage={currentStage}
            onSelectStage={setCurrentStage}
          />
          <div className="h-px my-6 w-full bg-foreground/30" />
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground text-lg">
              No team registrations yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Teams will appear here once participants register
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center bg-surface">
      <div className="w-full p-2 sm:p-4 md:p-6 lg:p-10 rounded-[20px] bg-background">
        <Stages
          stages={stages}
          selectedStage={currentStage}
          onSelectStage={setCurrentStage}
        />
        <div className="h-px my-6 w-full bg-foreground/30" />
        <Participants
          data={participants}
          selectedRoundId={selectedRoundId}
          nextRoundId={nextRoundId}
        />
      </div>
    </div>
  );
}
