"use client";

import React from "react";
import { UserPlus, Share2, RotateCcw, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Registration } from "./registration-types";
import { RegistrationStepper } from "./RegistrationStepper";

interface RegistrationCardProps {
  registration: Registration;
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
  return (
    <div className="bg-white border border-[#E0E0E6] rounded-[32px] p-4 md:p-6 mb-6 flex flex-col xl:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Banner */}
      <div className="w-full xl:w-[280px] h-[180px] shrink-0 relative rounded-2xl overflow-hidden group">
        <Image
          src={registration.bannerUrl}
          alt={registration.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <h3 className="text-2xl font-bold text-[#1A1A1E]">{registration.title}</h3>

            {/* Quick Actions */}
            <div className="flex items-center gap-4 text-[#6B4EAB]">
              <button className="flex items-center gap-2 hover:bg-[#6B4EAB]/5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium">
                <UserPlus className="w-4 h-4" />
                Invite Team
              </button>
              <button className="flex items-center gap-2 hover:bg-[#6B4EAB]/5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
          <div className="text-sm xl:w-3/4">
            {/* First Line (max width + truncate) */}
            <div className="flex items-center max-w-full overflow-hidden">
              {[
                { title: "Registered On", value: registration.registeredOn },
                { title: "By", value: registration.registeredBy },
                { title: "Team Name", value: registration.teamName }
              ].map((item, i, arr) => (
                <div key={i} className="flex items-center min-w-0">
                  <p className="text-neutral-700 font-medium text-xs truncate">
                    {item.title}:{" "}
                    <span className="text-neutral-600 font-normal">
                      {item.value}
                    </span>
                  </p>

                  {/* Divider */}
                  {i < arr.length - 1 && (
                    <div className="mx-2 w-px h-3 bg-neutral-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Second Line (Deadline) */}
            <div className="mt-1">
              <p className="text-neutral-700 font-medium text-xs">
                Deadline:{" "}
                <span className="text-neutral-600 font-normal">
                  {registration.deadline}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="pb-8">
          <RegistrationStepper stages={registration.stages} />
        </div>
      </div>
    </div>
  );
}
