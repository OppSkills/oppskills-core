"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Only these needed now
import { useUpcomingHackathons } from "@/hooks/usePublicHackathons";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { CompetitionCard } from "./_components/CompetitionCard";
// import { EventCard } from "./_components/EventCard"; // No longer needed here
import type { PastOpportunityItem } from "@/hooks/useEvents";
import { EventsSectionSkeleton } from "./_components/EventsSectionSkeleton";
import { EventsEmptyState } from "./_components/EventsEmptyState";

export default function UpcomingCompetitions() {
  const {
    data: hackathons,
    isLoading,
    isError,
  } = useUpcomingHackathons();

  // State for Swiper navigation references
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  // Flatten pages if infinite query, or use data directly if simple query
  // useUpcomingHackathons returns InfiniteData<PublicHackathonListItem[]>
  const displayHackathons = (hackathons?.pages.flat() ?? []).slice(0, 6);

  if (isLoading) {
    return (
      <EventsSectionSkeleton
        title="Top Competitions"
        subtitle="Discover the most popular competitions students are joining right now."
      />
    );
  }

  if (isError || displayHackathons.length === 0) {
    return (
      <EventsEmptyState
        title="Top Competitions"
        subtitle="Discover the most popular competitions students are joining right now."
        emptyTitle="No Competitions Yet"
        emptyMessage="Check back soon for exciting hackathons and coding competitions!"
      />
    );
  }

  return (
    <section
      className="w-full pt-12 md:pt-16 lg:pt-20 bg-background"
      id="competitions"
    >
      <div className="container mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Top Competitions
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Discover the most popular competitions students are joining right now.
          </p>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
          loop={displayHackathons.length > 4} // Only loop if enough items
          navigation={{
            prevEl,
            nextEl,
          }}
          pagination={{
            clickable: true,
            el: paginationEl,
            bulletClass:
              "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
            bulletActiveClass: "!bg-primary !w-6",
          }}
        >
          {displayHackathons.map((hackathon) => {
            return (
              <SwiperSlide key={hackathon.id} className="h-full pb-1">
                <div className="h-full">
                  <CompetitionCard hackathon={hackathon} />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Navigation & Pagination Controls */}
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            ref={(node) => setPrevEl(node)}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Custom Pagination Container */}
          <div
            ref={(node) => setPaginationEl(node)}
            className="flex justify-center items-center gap-1 h-6 w-auto"
          />

          <button
            ref={(node) => setNextEl(node)}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}
