"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Stages from "./_components/Stages";
import Participants, { Participant } from "./_components/Participants";
import { useHackathonRegistrationsBySlug } from "@/hooks/useHackathonRegistrations";
import { Loader2 } from "lucide-react";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, error } = useHackathonRegistrationsBySlug(slug);

  const [currentStage, setCurrentStage] = useState("All registrations");

  // Build stages from rounds data
  const stages = useMemo(() => {
    if (!data) return [];
    const stagesList = [
      { name: "All registrations", description: "All registered teams" },
    ];
    for (const round of data.rounds) {
      stagesList.push({
        name: `R${round.order} - ${round.name}`,
        description: `${round.roundType} round`,
      });
    }
    return stagesList;
  }, [data]);

  // Map teams to Participant format for the selected stage
  const participants: Participant[] = useMemo(() => {
    if (!data) return [];

    // Find the selected round (if not "All registrations")
    let selectedRoundId: string | null = null;
    if (currentStage !== "All registrations" && data.rounds.length > 0) {
      // Parse "R{order} - {name}" format
      const match = currentStage.match(/^R(\d+)\s*-/);
      if (match) {
        const order = parseInt(match[1], 10);
        const round = data.rounds.find((r) => r.order === order);
        if (round) {
          selectedRoundId = round.id;
        }
      }
    }

    return data.teams.map((team, index) => {
      // Determine current round status
      let currentRound = "Registered";
      let status: "Completed" | "Incomplete" = "Completed";

      if (selectedRoundId) {
        const submission = team.roundSubmissions[selectedRoundId];
        if (submission?.submittedAt) {
          currentRound = "Submitted";
          status = "Completed";
        } else {
          currentRound = "Not Submitted";
          status = "Incomplete";
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
      };
    });
  }, [data, currentStage]);

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
            {error instanceof Error ? error.message : "Unknown error"}
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
        <Participants data={participants} />
      </div>
    </div>
  );
}
