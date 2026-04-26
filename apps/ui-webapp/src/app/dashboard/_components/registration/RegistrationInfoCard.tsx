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
  const borderColors = [
    "border-green-500",
    "border-blue-500",
    "border-purple-500",
    "border-orange-500",
    "border-pink-500",
  ];

  return (
    <div className="w-full bg-white rounded-[16px] p-4 sm:p-5 shadow-sm border border-neutral-200">
      <div className="flex gap-4 sm:gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
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
            <div className="flex flex-col gap-0.5">
              <h3 className="text-lg font-black font-poppins text-neutral-900 break-words leading-tight">
                {participant.name}
              </h3>
              {participant.role && (
                <Badge
                  variant="secondary"
                  className="w-fit px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-sm bg-blue-50 text-blue-600 border-none"
                >
                  {participant.role}
                </Badge>
              )}
            </div>

            <div className="grid gap-1.5 text-xs font-medium text-neutral-500 inter">
              {participant.college && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="break-words">{participant.college}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="break-all">{participant.email}</span>
              </div>

              {participant.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="break-words">{participant.location}</span>
                </div>
              )}

              {participant.education && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="break-words leading-snug">{participant.education}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span>Registered on: {participant.registeredOn}</span>
              </div>
            </div>
          </div>

          {/* Additional Questions Section */}
          {participant.registrationFields && participant.registrationFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-sm font-black font-poppins text-neutral-900">
                Additional Questions
              </h4>
              <div className="grid gap-4">
                {participant.registrationFields.map((field) => {
                  const answer = participant.answers?.find((a) => a.fieldId === field.id);
                  const isAnswered = answer?.value && answer.value !== "" && answer.value !== null && answer.value !== undefined;
                  const borderColor = isAnswered ? "border-green-500" : "border-red-500";

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "relative pl-4 py-1 border-l-2 transition-all",
                        borderColor,
                        !isAnswered && "bg-red-50/30"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h5 className="text-xs font-bold text-neutral-800 poppins leading-snug">
                          {field.label}
                        </h5>
                        <Badge className="bg-pink-100 text-pink-500 hover:bg-pink-100 border-none px-1.5 py-0 rounded-sm font-bold text-[8px] uppercase tracking-wider">
                          {field.type}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs font-medium text-neutral-500 inter leading-relaxed">
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
