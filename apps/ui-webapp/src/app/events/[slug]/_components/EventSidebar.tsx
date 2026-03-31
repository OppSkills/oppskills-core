"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, Users, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { EventDetails } from "./types";
import InfoCard from "./InfoCard";
import { ensureAbsoluteUrl } from "@/lib/utils";

interface EventSidebarProps {
  event: EventDetails;
}

export function EventSidebar({ event }: EventSidebarProps) {
  const startDate = event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : null);

  return (
    <div className="m-0 lg:m-auto lg:space-y-5">
      <div className="flex flex-col lg:relative">
        {/* Thumbnail */}
        <div className="relative aspect-16/10 w-full overflow-hidden lg:rounded-2xl shadow-sm border border-neutral-100">
          {event.thumbnail ? (
            <Image
              src={ensureAbsoluteUrl(event.thumbnail)}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
              <span className="text-white font-bold opacity-20 text-4xl">
                {event.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Featured In Pill */}
        {event.festival?.name && (
          <div className="pl-2 lg:pl-0">
            <Link
              href={`/festivals/${event.festival.slug}`}
              className=" mt-4 flex gap-1 items-center bg-neutral-100 hover:bg-neutral-200 shadow-sm p-2 rounded-lg w-fit"
            >
              <span className="font-normal text-neutral-600">Featured in</span>
              <span className="font-semibold text-neutral-800 ">
                {event.festival.name}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-800 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* Desktop Sidebar (Thumbnail + Stats) */}
      <div className="hidden lg:block bg-background rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-5">
        <InfoCard
          teamSize={event.teamSize || ""}
          impressions={event.impressions || 0}
          registrationDeadline={event.registrationDeadline || ""}
          noBorder
          noPadding
        />
      </div>
    </div>
  );
}
