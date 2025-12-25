"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, MapPin, Users, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetitionDetails } from "./types";

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  return (
    <div className="space-y-5 font-sans">
      {/* Featured In Pill */}
      {competition.featuredIn && (
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-100  rounded-full text-sm text-neutral-600 ">
          <span className="font-normal text-muted-foreground">Featured in</span>
          <span className="font-semibold text-neutral-900 ">
            {competition.featuredIn}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      )}

      {/* Banner Component */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm">
        <Image
          src={competition.thumbnail || "/competition_placeholder.png"}
          alt={competition.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Info Card */}
      <div className="bg-white  rounded-2xl border border-neutral-200  p-6 shadow-sm">
        <p className="text-neutral-600  text-[15px] mb-6">
          Welcome! to join event please register below.
        </p>

        <div className="space-y-5">
          {/* Date Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                Jan
              </span>
              <span className="text-lg font-bold text-neutral-900  leading-none">
                05
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900  text-[15px]">
                {competition.specificDate || "Monday, 5 January 2026"}
              </h4>
              <p className="text-sm text-neutral-500">
                {competition.specificTime || "8:00 - 20:00 GMT-8"}
              </p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
              <MapPin className="w-5 h-5 text-neutral-700 " />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900  text-[15px]">
                {competition.venueName || "College/University Name"}
              </h4>
              <p className="text-sm text-neutral-500">
                {competition.venueAddress || "City, State"}
              </p>
            </div>
          </div>

          {/* Register Button */}
          <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm">
            Register for free
          </Button>

          {/* Divider */}
          <div className="h-px bg-neutral-100  w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Team Size */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Users className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.teamSize || "1-2 Members"}
                </div>
                <div className="text-xs text-neutral-500">Team Size</div>
              </div>
            </div>

            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.impressions || "206"}
                </div>
                <div className="text-xs text-neutral-500">Impressions</div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.registrationDeadline || "8 Days"}
                </div>
                <div className="text-xs text-neutral-500">
                  Registration Deadline
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
