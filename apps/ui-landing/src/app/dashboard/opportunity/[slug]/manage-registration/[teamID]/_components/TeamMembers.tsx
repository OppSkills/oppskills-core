"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  MapPin,
  GraduationCap,
  CalendarDays,
  PenLine,
} from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  role: "Team Leader" | "Team Member";
  college: string;
  email: string;
  location: string;
  education: string;
  registeredOn: string;
  avatarUrl?: string;
}

interface TeamMembersProps {
  members: TeamMember[];
}

export default function TeamMembers({ members }: TeamMembersProps) {
  return (
    <div className="flex flex-col gap-4">
      {members.map((member) => (
        <Card
          key={member.id}
          className="w-full rounded-[20px] pt-6 shadow-sm border border-border"
        >
          <CardContent className="flex flex-col sm:flex-row gap-6 p-6 pt-0">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-sm">
                <AvatarImage
                  src={member.avatarUrl}
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <Badge
                  variant="secondary"
                  className={`w-fit px-3 py-1 text-xs font-medium rounded-full ${member.role === "Team Leader"
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
                    : "bg-pink-100 text-pink-600 hover:bg-pink-100"
                    }`}
                >
                  {member.role}
                </Badge>
                <h3 className="text-2xl font-bold font-poppins text-foreground break-words">
                  {member.name}
                </h3>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="break-words">{member.college}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{member.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="break-words">{member.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span className="break-words">{member.education}</span>
                </div>

                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 shrink-0" />
                  <span>Registered on: {member.registeredOn}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
