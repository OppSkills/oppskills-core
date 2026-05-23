"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, Users, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { EventDetails } from "./types";
import { ensureAbsoluteUrl, isLocationCoords, getGoogleMapsUrl } from "@/lib/utils";
import { EventRegisterCta } from "./EventRegisterCta";

interface EventSidebarProps {
  event: EventDetails;
  onRegister?: () => void;
  /** When signed in, registration status is loading from API */
  isCheckingRegistration?: boolean;
  /** Participant row exists with submission (full registration) */
  isRegistered?: boolean;
  /** Participant exists but form answers not saved (paid or free) */
  needsCompleteRegistration?: boolean;
  /** When true, CTA lives in the main column (ticket card); sidebar shows details only */
  hideRegisterButton?: boolean;
}

export function EventSidebar({
  event,
  onRegister,
  isCheckingRegistration = false,
  isRegistered = false,
  needsCompleteRegistration = false,
  hideRegisterButton = false,
}: EventSidebarProps) {
  const startDate = event.startDate
    ? new Date(event.startDate)
    : event.date
      ? new Date(event.date)
      : null;

  const monthShort = startDate ? format(startDate, "MMM") : "---";
  const dayNum = startDate ? format(startDate, "dd") : "--";

  return (
    <div className="p-4 lg:p-0 space-y-5 font-sans">
      {/* Thumbnail / Banner — first so it stays above the fold in the sidebar */}
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl shadow-sm border border-neutral-100">
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

      {/* Mobile Title */}
      <h1 className="lg:hidden text-neutral-900 text-3xl font-semibold mb-4 break-all">
        {event.title}
      </h1>

      {/* Featured In Pill */}
      {event.festival?.name && (
        <Link
          href={`/festivals/${event.festival.slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-200 rounded-md text-sm text-neutral-600 hover:bg-neutral-300 transition-colors"
        >
          <span className="font-normal text-neutral-600">Featured in</span>
          <span className="font-semibold text-neutral-800 ">
            {event.festival.name}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-800" />
        </Link>
      )}

      {/* Info Card (Matches CompetitionSidebar style) */}
      <div className="bg-background rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <p className="text-neutral-600 text-[15px] mb-6">
          {hideRegisterButton
            ? "Welcome! Event date and venue are below."
            : "Welcome! To join this event, please register below."}
        </p>

        <div className="space-y-4">
          {/* Date Row */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                {monthShort}
              </span>
              <span className="text-lg font-bold text-neutral-900 leading-none">
                {dayNum}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 text-[15px]">
                {event.date}
              </h4>
              <p className="text-sm text-neutral-500">
                {event.time || "Time TBD"}
              </p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 text-[15px]">
                {event.venueName || "Venue Name"}
              </h4>
              {(() => {
                const mapsUrl = getGoogleMapsUrl(event.locationCoords);
                const addressText = event.venueAddress || "Location Address";
                return mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline decoration-neutral-400 block"
                  >
                    <p className="text-sm text-neutral-500">
                      {addressText}
                    </p>
                  </a>
                ) : (
                  <p className="text-sm text-neutral-500">
                    {addressText}
                  </p>
                );
              })()}
            </div>
          </div>

          {!hideRegisterButton ? (
            <EventRegisterCta
              event={event}
              onRegister={onRegister}
              isCheckingRegistration={isCheckingRegistration}
              isRegistered={isRegistered}
              needsCompleteRegistration={needsCompleteRegistration}
            />
          ) : null}

          {/* Stats List */}
          <div className="space-y-4">
            {/* Team Size / Entry Type */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-neutral-800" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">
                  {event.teamSize || "Individual"}
                </div>
                <div className="text-xs text-neutral-500">Entry Type</div>
              </div>
            </div>

            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-neutral-800" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">
                  {event.impressions || 0}
                </div>
                <div className="text-xs text-neutral-500">Impressions</div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-neutral-800" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">
                  {event.registrationDeadline
                    ? format(
                        new Date(event.registrationDeadline),
                        "MMM d, yyyy h:mm a",
                      )
                    : "Open until starts"}
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
