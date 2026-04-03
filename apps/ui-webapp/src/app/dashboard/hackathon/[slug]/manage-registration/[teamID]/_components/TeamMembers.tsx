"use client";

import { RegistrationInfoCard, ParticipantInfo } from "@/app/dashboard/_components/registration/RegistrationInfoCard";

export type TeamMember = ParticipantInfo;

interface TeamMembersProps {
  members: TeamMember[];
}

export default function TeamMembers({ members }: TeamMembersProps) {
  return (
    <div className="flex flex-col gap-6">
      {members.map((member) => (
        <RegistrationInfoCard key={member.id} participant={member} />
      ))}
    </div>
  );
}
