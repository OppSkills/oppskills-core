"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { EventsSectionSkeleton } from "./_components/EventsSectionSkeleton";
import { EventsEmptyState } from "./_components/EventsEmptyState";
import { EventCard } from "./_components/EventCard";

export const UpcomingEvents = () => {
  const {
    data: events,
    isLoading,
    isError,
  } = useUpcomingEvents();
  const [prevEl, setPrevEl] = React.useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = React.useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = React.useState<HTMLDivElement | null>(
    null
  );

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
      <EventsSectionSkeleton
        title="Upcoming College Events"
        subtitle="Stay ahead with the latest events, workshops, and conferences."
      />
    );
  }

  // Empty state
  if (isError || displayEvents.length === 0) {
    return (
      <EventsEmptyState
        title="Upcoming College Events"
        subtitle="Stay ahead with the latest events, workshops, and conferences."
        emptyTitle="No Events Yet"
        emptyMessage="Check back soon for upcoming events, workshops, and conferences!"
      />
    );
  }

  return (
    <section
      className="w-full pt-12 md:pt-16 lg:pt-20 bg-background"
      id="events"
    >
      <div className="container mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Upcoming College Events
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Don’t miss what’s next, stay updated with upcoming events and
            sessions.
          </p>
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
          loop={displayEvents.length > 4} // Only loop if enough slides
          pagination={{
            clickable: true,
            el: paginationEl,
            bulletClass:
              "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
            bulletActiveClass: "!bg-primary !w-6",
          }}
          navigation={{
            prevEl,
            nextEl,
          }}
        >
          {displayEvents.map((event, i) => {
            return (
              <SwiperSlide key={i} className="h-auto">
                <EventCard event={event} />
              </SwiperSlide>
            );
          })}
        </Swiper>
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            ref={setPrevEl}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div
            ref={setPaginationEl}
            className="flex justify-center items-center gap-1 h-6 w-auto"
          />
          <button
            ref={setNextEl}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};
