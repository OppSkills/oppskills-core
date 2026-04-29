"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import {
  Building2,
  Mail,
  MapPin,
  GraduationCap,
  PenLine,
} from "lucide-react";
import { Buildings3, Letter, MapPoint, Pen2, SquareAcademicCap } from "@solar-icons/react";

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
}

export interface RegistrationAnswer {
  fieldId: string;
  value: string | string[] | number | null | undefined;
}

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
  answers?: RegistrationAnswer[];
  registrationFields?: RegistrationField[];
}

interface RegistrationInfoCardProps {
  participant: ParticipantInfo;
}

const formatAnswerValue = (
  value: string | string[] | number | null | undefined,
): string => {
  if (value === null || value === undefined || value === "") return "Answer not given";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

export function RegistrationInfoCard({ participant }: RegistrationInfoCardProps) {
  return (
    <div className="w-full bg-white rounded-[16px] p-4 sm:p-5 shadow-sm border border-neutral-200">
      <div className="flex gap-4 sm:gap-6">
        {/* Avatar Section */}
        <div className="shrink-0">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shadow-lg ring-1 ring-neutral-100">
            <AvatarImage
              src={ensureAbsoluteUrl(participant.avatarUrl)}
              alt={participant.name}
              className="object-cover"
            />
            <AvatarFallback className="text-xl bg-primary-50 text-primary-600 font-black poppins">
              {participant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Right Content Section */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Info Section */}
          <div className="space-y-2">
            <div className="flex flex-col gap-1">

              {participant.role && (
                <Badge
                  variant="secondary"
                  className="w-fit px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm bg-blue-50 text-blue-600 border-none"
                >
                  {participant.role}
                </Badge>
              )}
              <h3 className="text-lg font-black font-poppins text-neutral-900 break-words leading-tight">
                {participant.name}
              </h3>
            </div>

            <div className="grid gap-1.5 text-xs font-medium text-neutral-500 inter">
              {participant.college && (
                <div className="flex items-center gap-2">
                  <Buildings3 className="h-4 w-4 shrink-0 text-neutral-600" />
                  <span className="wrap-words text-base text-neutral-600">{participant.college}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Letter className="h-4 w-4 shrink-0 text-neutral-600" />
                <span className="wrap-words text-base text-neutral-600">{participant.email}</span>
              </div>

              {participant.location && (
                <div className="flex items-center gap-2">
                  <MapPoint className="h-4 w-4 shrink-0 text-neutral-600" />
                  <span className="wrap-words text-base text-neutral-600">{participant.location}</span>
                </div>
              )}

              {participant.education && (
                <div className="flex items-center gap-2">
                  <SquareAcademicCap className="h-4 w-4 shrink-0 text-neutral-600" />
                  <span className="wrap-words text-base text-neutral-600">{participant.education}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Pen2 className="h-4 w-4 shrink-0 text-neutral-600 wrap-words text-base" />
                <span className="wrap-words text-base text-neutral-600">Registered on: {participant.registeredOn}</span>
              </div>
            </div>
          </div>

          {/* Additional Questions Section */}
          {participant.registrationFields && participant.registrationFields.length > 0 && (
            <div className="space-y-4 border-t border-neutral-100">
              <h4 className="text-2xl text-neutral-900">
                Additional Questions
              </h4>
              <div className="grid gap-4">
                {participant.registrationFields.map((field) => {
                  const answer = participant.answers?.find((a) => a.fieldId === field.id);
                  const isAnswered = answer?.value && answer.value !== "" && answer.value !== null && answer.value !== undefined;
                  const borderColor = isAnswered ? "border-UI-success bg-UI-success-100" : "border-UI-error";

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "relative pl-4 py-1 border-l-2 transition-all",
                        borderColor,
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-xl text-neutral-900">
                          {field.label}
                        </p>
                        <Badge className="bg-accent-pink-100 text-accent-pink-500 border-none p-1 rounded-sm font-bold text-xs tracking-wider">
                          {field.type}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xl text-neutral-600">
                        {formatAnswerValue(answer?.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}