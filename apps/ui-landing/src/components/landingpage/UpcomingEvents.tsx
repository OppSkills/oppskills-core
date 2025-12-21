"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEvents, type EventListItem } from "@/hooks/useEvents";

/**
 * Format event mode/location type for display.
 */
function formatMode(locationType: string | null): string {
  if (!locationType) return "Online";
  switch (locationType.toUpperCase()) {
    case "VIRTUAL":
    case "ONLINE":
      return "Online";
    case "OFFLINE":
    case "IN_PERSON":
    case "PHYSICAL":
      return "Offline";
    case "HYBRID":
      return "Hybrid";
    default:
      return "Online";
  }
}

/**
 * Format entry fee display.
 */
function formatEntryFee(event: EventListItem): string {
  if (event.isFree) return "Free";
  if (event.entryFeeAmount) {
    return `${event.currency} ${event.entryFeeAmount.toLocaleString()}`;
  }
  return "Free";
}

/**
 * Calculate total prize amount.
 */
function calculateTotalPrize(event: EventListItem): string {
  // For now, we don't have prizeBreakdown in the list response
  // Return a placeholder or calculate if available
  return "Prizes";
}

export const UpcomingEvents = () => {
  const { data: events, isLoading, error } = useEvents();

  // Filter to only show published events
  const publishedEvents = (events ?? []).filter(
    (e) => e.status === "PUBLISHED" || e.status === "ONGOING"
  );

  // Show only the first 6 events
  const displayEvents = publishedEvents.slice(0, 6);

  // Loading state
  if (isLoading) {
    return (
      <section className="w-full py-12 md:py-16 lg:py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground text-lg inter">
              Stay ahead with the latest events, workshops, and conferences.
            </p>
          </div>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (error || displayEvents.length === 0) {
    return (
      <section className="w-full py-12 md:py-16 lg:py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground text-lg inter">
              Stay ahead with the latest events, workshops, and conferences.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border bg-muted/20">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600 dark:text-purple-400"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground poppins mb-2">
              No Events Yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md inter">
              Check back soon for upcoming events, workshops, and conferences!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Upcoming Events
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Stay ahead with the latest events, workshops, and conferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayEvents.map((event) => {
            const startDate = new Date(event.startDate);
            const formattedDate = format(startDate, "dd MMM yyyy");
            const mode = formatMode(event.locationType);
            const entryFee = formatEntryFee(event);
            const isFree = event.isFree;

            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
                    {event.bannerImageUrl ? (
                      <Image
                        src={event.bannerImageUrl}
                        alt={event.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
                        <span className="text-white text-5xl font-bold">
                          {event.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content Section */}
                  <CardContent className="p-5 space-y-3 flex-grow">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs font-normal px-2 py-0.5 rounded-sm ${
                          isFree
                            ? "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entryFee}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal px-2 py-0.5 rounded-sm bg-muted text-muted-foreground"
                      >
                        {mode}
                      </Badge>
                      {event.eventType && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal px-2 py-0.5 rounded-sm bg-muted text-muted-foreground"
                        >
                          {event.eventType}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold leading-tight poppins text-foreground line-clamp-2">
                        {event.name}
                      </h3>
                      <p className="text-sm text-muted-foreground inter line-clamp-1">
                        {event.organizationName || "Event Organizer"}
                      </p>
                    </div>
                  </CardContent>

                  {/* Footer Section */}
                  <CardFooter className="p-5 pt-0 flex justify-between items-center text-sm border-t border-border/40 mt-auto bg-muted/5">
                    <div className="flex flex-col gap-0.5 mt-3">
                      <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
                        Event Date
                      </span>
                      <span className="font-semibold text-foreground inter">
                        {formattedDate}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-3 text-right">
                      <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
                        Registrations
                      </span>
                      <span className="font-semibold text-foreground inter">
                        {event.registrationCount} joined
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
