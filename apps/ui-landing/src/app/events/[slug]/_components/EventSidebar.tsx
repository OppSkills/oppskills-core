"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Calendar, Clock } from "lucide-react";
import { EventDetails } from "./types";
import { EventRegistrationCard } from "./EventRegistrationCard";

interface EventSidebarProps {
  event: EventDetails;
}

export function EventSidebar({ event }: EventSidebarProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm">
        <Image
          src={event.thumbnail}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Registration Card */}
      <EventRegistrationCard tickets={event.tickets} />

      {/* Quick Info Card */}
      <div className="bg-white  rounded-2xl border border-neutral-200  p-6 shadow-sm space-y-5">
        {/* Date Row */}
        <div className="flex gap-4 items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
            <Calendar className="w-5 h-5 text-neutral-700 " />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900  text-[15px]">
              {event.date}
            </h4>
            <p className="text-sm text-neutral-500">{event.time}</p>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex gap-4 items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
            <MapPin className="w-5 h-5 text-neutral-700 " />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900  text-[15px]">
              {event.venueName}
            </h4>
            <p className="text-sm text-neutral-500">{event.venueAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
