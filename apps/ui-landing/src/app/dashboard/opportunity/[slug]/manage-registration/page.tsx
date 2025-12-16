"use client";

import React, { useState } from "react";
import Stages from "./_components/Stages";
import Participants, { Participant } from "./_components/Participants";

// Mock Data
const allRegistrations: Participant[] = [
  {
    id: "1",
    serialNumber: 1,
    teamName: "InnoTech",
    memberCount: 4,
    email: "esther.williamson@five9.com",
    university: "Stanford University",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    status: "Completed",
    currentRound: "Registered",
  },
  {
    id: "2",
    serialNumber: 2,
    teamName: "Team Gravity",
    memberCount: 3,
    email: "cody.cooper@five9.com",
    university: "Niagara University",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    status: "Completed",
    currentRound: "Registered",
  },
  {
    id: "3",
    serialNumber: 3,
    teamName: "CorePeakers",
    memberCount: 2,
    email: "aubrey.flores@five9.com",
    university: "Brown University",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    status: "Completed",
    currentRound: "Registered",
  },
  {
    id: "4",
    serialNumber: 4,
    teamName: "Vibe Vasters",
    memberCount: 1,
    email: "shane.webb@five9.com",
    university: "MIT",
    avatarUrl: "https://i.pravatar.cc/150?u=4",
    status: "Incomplete",
    currentRound: "Registered",
  },
  {
    id: "5",
    serialNumber: 5,
    teamName: "ViloTech",
    memberCount: 4,
    email: "arthur.russel@five9.com",
    university: "Villanova University",
    avatarUrl: "https://i.pravatar.cc/150?u=5",
    status: "Completed",
    currentRound: "Registered",
  },
  {
    id: "6",
    serialNumber: 6,
    teamName: "CodeCrashers",
    memberCount: 3,
    email: "jane.doe@example.com",
    university: "Harvard University",
    avatarUrl: "https://i.pravatar.cc/150?u=6",
    status: "Completed",
    currentRound: "Registered",
  }
];

const round1Data: Participant[] = [
  {
    id: "1",
    serialNumber: 1,
    teamName: "InnoTech",
    memberCount: 4,
    email: "esther.williamson@five9.com",
    university: "Stanford University",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    status: "Completed",
    currentRound: "In Progress",
  },
  {
    id: "2",
    serialNumber: 2,
    teamName: "Team Gravity",
    memberCount: 3,
    email: "cody.cooper@five9.com",
    university: "Niagara University",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    status: "Completed",
    currentRound: "Submitted",
  },
  {
    id: "3",
    serialNumber: 3,
    teamName: "CorePeakers",
    memberCount: 2,
    email: "aubrey.flores@five9.com",
    university: "Brown University",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    status: "Completed",
    currentRound: "Evaluated",
  },
  {
    id: "5",
    serialNumber: 4,
    teamName: "ViloTech",
    memberCount: 4,
    email: "arthur.russel@five9.com",
    university: "Villanova University",
    avatarUrl: "https://i.pravatar.cc/150?u=5",
    status: "Completed",
    currentRound: "Evaluated",
  }
];

const round2Data: Participant[] = [
  {
    id: "1",
    serialNumber: 1,
    teamName: "InnoTech",
    memberCount: 4,
    email: "esther.williamson@five9.com",
    university: "Stanford University",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    status: "Completed",
    currentRound: "Scheduled",
  },
  {
    id: "3",
    serialNumber: 2,
    teamName: "CorePeakers",
    memberCount: 2,
    email: "aubrey.flores@five9.com",
    university: "Brown University",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    status: "Completed",
    currentRound: "Completed",
  }
];

const round3Data: Participant[] = [
  {
    id: "1",
    serialNumber: 1,
    teamName: "InnoTech",
    memberCount: 4,
    email: "esther.williamson@five9.com",
    university: "Stanford University",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    status: "Completed",
    currentRound: "Winner",
  }
];

export default function Page() {
  const [currentStage, setCurrentStage] = useState("All registrations");

  const getStageData = () => {
    switch (currentStage) {
      case "All registrations":
        return allRegistrations;
      case "R1 - Synopsis Submissions":
        return round1Data;
      case "R2 - Online Presentation":
        return round2Data;
      case "R3 - Finale Offline":
        return round3Data;
      default:
        return allRegistrations;
    }
  };

  return (
    <div className="flex w-full justify-center bg-surface">
      <div className="w-full p-10 rounded-[20px] bg-background">
        <Stages selectedStage={currentStage} onSelectStage={setCurrentStage} />
        <div className="h-px my-6 w-full bg-foreground/30" />
        <Participants data={getStageData()} />
      </div>
    </div>
  );
}
