"use client";
import React from "react";

import { useUpcomingEvents } from "@/hooks/useEvents";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { EventsSectionSkeleton } from "./_components/EventsSectionSkeleton";
import { EventsEmptyState } from "./_components/EventsEmptyState";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { EventCard } from "./_components/EventCard";
import { SwiperControls } from "./_components/SwiperControls";
import Link from "next/link";

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
  const allEvents = events?.pages.flatMap((page: any) => page.items || []) ?? [];

  // Filter to only show published events
  const publishedEvents = allEvents.filter(
    (e) => e.status === "PUBLISHED" || e.status === "ONGOING"
  );

  // Show only the first 6 events
  const displayEvents = [...publishedEvents];

  if (isError || (!isLoading && displayEvents.length === 0)) {
    return (
      <EventsEmptyState
        title="Upcoming Events"
        subtitle="Don’t miss what’s next, stay updated with upcoming events and sessions."
        emptyTitle="No Events Yet"
        emptyMessage="Check back soon for upcoming events, workshops, and conferences!"
      />
    );
  }

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="landing-upcoming-events"
      fallback={
        <EventsSectionSkeleton
          title="Upcoming Events"
          subtitle="Don’t miss what’s next, stay updated with upcoming events and sessions."
        />
      }
    >
    <section
      className="w-full pt-8"
      id="events"
    >
      <div className="container mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 w-full">
            <h2 className="text-3xl flex-1 font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0"
            >
              View all →
            </Link>
          </div>
          <p className="text-muted-foreground text-lg inter">
            Don’t miss what’s next, stay updated with upcoming events and
            sessions.
          </p>
        </div>

        <Swiper
          className="!pb-5"
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
              <SwiperSlide key={i} className="!h-auto">
                <EventCard event={event} />
              </SwiperSlide>
            );
          })}
        </Swiper>
        <SwiperControls
          setPrevEl={setPrevEl}
          setNextEl={setNextEl}
          setPaginationEl={setPaginationEl}
        />
      </div>
    </section>
    </BoneyardSkeleton>
  );
};
