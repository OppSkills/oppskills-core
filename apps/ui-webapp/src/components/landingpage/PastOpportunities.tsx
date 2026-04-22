"use client";

import { usePastEvents } from "@/hooks/useEvents";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { EventsSectionSkeleton } from "./_components/EventsSectionSkeleton";
import { EventsEmptyState } from "./_components/EventsEmptyState";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { EventCard } from "./_components/EventCard";
import { SwiperControls } from "./_components/SwiperControls";
import Link from "next/link";

export default function PastOpportunities() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = usePastEvents();

  // Replaced useRef with useState for Swiper navigation and pagination elements
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  // Helper to extract all events from infinite query pages
  const allEvents = data?.pages.flatMap((page) => page.items) || [];

  if (isError) {
    return null; // or show error state component
  }

  if (!isLoading && allEvents.length === 0) {
    // Optionally return null to hide section if empty, or use EmptyState
    // return null;
    return (
      <EventsEmptyState
        title="Past Opportunties"
        subtitle="Explore our history of successful hackathons and workshops."
        emptyTitle="No Past Opportunties"
        emptyMessage="There are no Past Opportunties to display at the moment."
      />
    );
  }

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="landing-past-opportunities"
      fallback={
        <EventsSectionSkeleton
          title="Past Opportunities"
          subtitle="Explore our history of successful listings of opportunities."
        />
      }
    >
    <section className="w-full pt-8">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between gap-2 w-full">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
                  Past Opportunities
                </h2>
                <Link
                  href="/past-opportunities"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0 mt-2"
                >
                  View all →
                </Link>
              </div>

              <p className="text-muted-foreground text-lg inter">
                Explore our history of successful listings of opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="relative pb-10">
          <Swiper
            className="!pb-5"
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            breakpoints={{
              0: { slidesPerView: 1, slidesPerGroup: 1 },
              768: { slidesPerView: 2, slidesPerGroup: 1 },
              1024: { slidesPerView: 3, slidesPerGroup: 1 },
              1280: { slidesPerView: 4, slidesPerGroup: 3 },
            }}
            loop={allEvents.length > 4}
            navigation={{
              prevEl, // Updated to use state variable
              nextEl, // Updated to use state variable
            }}
            pagination={{
              clickable: true,
              el: paginationEl, // Updated to use state variable
              bulletClass:
                "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
              bulletActiveClass: "!bg-primary !w-6",
            }}
            // onBeforeInit is no longer needed as state ensures elements are available
            // Use standard overflow-hidden (default) or the specific class from UpcomingEvents
            // UpcomingEvents uses default.
            onReachEnd={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
          >
            {allEvents.map((event) => {
              return (
                <SwiperSlide key={event.id} className="h-auto!">
                  <EventCard
                    event={event}
                    hideRegistrationInfo={true}
                    organizationName={event.locationAddress}
                  />
                </SwiperSlide>
              );
            })}

            {/* Loading Slide for Infinite Scroll */}
            {isFetchingNextPage && (
              <SwiperSlide>
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Loading more...
                  </span>
                </div>
              </SwiperSlide>
            )}
          </Swiper>

          <SwiperControls
            setPrevEl={setPrevEl}
            setNextEl={setNextEl}
            setPaginationEl={setPaginationEl}
          />
        </div>
      </div>
    </section>
    </BoneyardSkeleton>
  );
}
