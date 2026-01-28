"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dot, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEvents, type EventListItem } from "@/hooks/useEvents";
import { formatInTimeZone } from "date-fns-tz";
import { formatCount } from "@/lib/tools";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
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
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const paginationRef = React.useRef<HTMLDivElement>(null);

  // Filter to only show published events
  // Flatten the pages to get all events
  const allEvents = events?.pages.flat() ?? [];

  // Filter to only show published events
  const publishedEvents = allEvents.filter(
    (e) => e.status === "PUBLISHED" || e.status === "ONGOING"
  );

  // Show only the first 6 events
  const displayEvents = [...publishedEvents];

  // Loading state
  if (isLoading) {
    return (
      <section
        className="w-full py-12 md:py-16 lg:py-20 bg-background"
        id="events"
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Upcoming College Events
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
      <section
        className="w-full py-12 md:py-16 lg:py-20 bg-background"
        id="events"
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Upcoming College Events
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
                  className="text-purple-600 "
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
    <section
      className="w-full py-12 md:py-16 lg:py-20 bg-background"
      id="events"
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Upcoming College Events
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Don’t miss what’s next, stay updated with upcoming events and
            sessions.
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            ref={prevRef}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            ref={nextRef}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
          loop
          pagination={{
            clickable: true,
            el: paginationRef.current,
            bulletClass: "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
            bulletActiveClass: "!bg-primary !w-6",
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-ignore
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-ignore
            swiper.params.navigation.nextEl = nextRef.current;
            // @ts-ignore
            swiper.params.pagination.el = paginationRef.current;
          }}
        >
          {displayEvents.map((event, i) => {
            const startDate = new Date(event.startDate);
            const formattedDate = formatInTimeZone(
              startDate,
              "UTC",
              "dd MMM yyyy"
            );
            const formattedTime = formatInTimeZone(startDate, "UTC", "hh:mm a");
            // Safely handle null registrationDeadline
            const formattedDeadLineDate = event.registrationDeadline
              ? formatInTimeZone(
                new Date(event.registrationDeadline),
                "UTC",
                "dd MMM yyyy"
              )
              : "N/A";
            const mode = formatMode(event.locationType);
            const entryFee = formatEntryFee(event);
            const isFree = event.isFree;

            return (
              <SwiperSlide key={i}>
                <Link href={`/events/${event.slug}`} prefetch={false}>
                  <Card className="gap-2 p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
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
                          <span className="text-background text-5xl font-bold">
                            {event.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 right-0 bg-background rounded-tl-lg px-3 flex text-primary-500 text-xs">
                        {[event.eventType, event.locationType].map(
                          (item, index) => (
                            <div
                              key={index}
                              className="flex gap-0.5 items-center"
                            >
                              {index > 0 && <Dot />}
                              <span>{item}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="space-y-2 flex-grow">
                      <div className="flex gap-0.5 items-center overflow-ellipsis inter text-xs text-neutral-600">
                        {[
                          event.isFree ? "Free" : "Paid",
                          formattedDate,
                          mode,
                        ].map((item, index) => (
                          <p key={index} className="gap-0.5 flex items-center">
                            {index > 0 && <Dot />}
                            {item}
                          </p>
                        ))}
                      </div>
                      <h3 className="font-semibold text-xl text-neutral-900 whitespace-nowrap overflow-ellipsis overflow-hidden">
                        {event.name}
                      </h3>

                      <div className="flex justify-between items-center text-sm pb-3">
                        <div className="flex flex-col gap-2 ">
                          <span className="text-xs text-neutral-600">
                            Attendees
                          </span>
                          <div className="flex gap-1">
                            <div className="flex">
                              <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                              <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
                              <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
                            </div>
                            <span className="text-neutral-700">
                              {formatCount(event.registrationCount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ">
                          <span className="text-xs text-neutral-600">
                            Register By
                          </span>
                          <span className="text-neutral-700">
                            {formattedDeadLineDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2  text-right">
                          <span className="text-xs text-neutral-600">
                            Entry Fee
                          </span>
                          <span className="text-neutral-700">{entryFee}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
        <div
          ref={paginationRef}
          className="flex justify-center items-center mt-8 gap-1 h-6"
        />
      </div>
    </section >
  );
};
