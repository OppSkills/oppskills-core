"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ensureAbsoluteUrl } from "@/lib/utils";
import {
  Building2,
  Mail,
  MapPin,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

export interface ParticipantInfo {
  id: string;
  name: string;
  role?: string;
  college?: string;
  email: string;
  location?: string;
  education?: string;
  registeredOn: string;
  avatarUrl?: string;
}

interface RegistrationInfoCardProps {
  participant: ParticipantInfo;
}

export function RegistrationInfoCard({ participant }: RegistrationInfoCardProps) {
  return (
    <Card className="w-full rounded-[20px] pt-6 shadow-sm border border-border">
      <CardContent className="flex flex-col sm:flex-row gap-6 p-6 pt-0">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-sm">
            <AvatarImage
              src={ensureAbsoluteUrl(participant.avatarUrl)}
              alt={participant.name}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {participant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-2">
            {participant.role && (
              <Badge
                variant="secondary"
                className="w-fit px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600 hover:bg-blue-100"
              >
                {participant.role}
              </Badge>
            )}
            <h3 className="text-2xl font-bold font-poppins text-foreground break-words">
              {participant.name}
            </h3>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            {participant.college && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="break-words">{participant.college}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{participant.email}</span>
            </div>

            {participant.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="break-words">{participant.location}</span>
              </div>
            )}

            {participant.education && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span className="break-words">{participant.education}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>Registered on: {participant.registeredOn}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
