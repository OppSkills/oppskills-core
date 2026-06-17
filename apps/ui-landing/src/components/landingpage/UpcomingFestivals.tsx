"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { FestivalCard } from "./_components/FestivalCard";
import { SwiperControls } from "./_components/SwiperControls";
import { EventsSectionSkeleton } from "./_components/EventsSectionSkeleton";
import { EventsEmptyState } from "./_components/EventsEmptyState";
import { usePublicFestivals } from "@/hooks/usePublicFestivals";

export default function UpcomingFestivals() {
  const { data, isLoading, isError } = usePublicFestivals();

  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  const allFestivals = (data?.pages.flat() ?? []).slice(0, 8);

  // Only show PUBLISHED or ONGOING festivals
  const displayFestivals = allFestivals.filter(
    (f) => !f.status || f.status === "PUBLISHED" || f.status === "ONGOING"
  );

  if (isLoading) {
    return (
      <EventsSectionSkeleton
        title="College Festivals"
        subtitle="Explore the biggest college fests happening near you."
      />
    );
  }

  if (isError || displayFestivals.length === 0) {
    return null; // Hide section silently if no festivals
  }

  return (
    <section className="w-full pt-12 md:pt-16 lg:pt-20" id="festivals">
      <div className="container mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            College Festivals
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Explore the biggest college fests and cultural events happening near you.
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
          loop={displayFestivals.length > 4}
          navigation={{ prevEl, nextEl }}
          pagination={{
            clickable: true,
            el: paginationEl,
            bulletClass:
              "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
            bulletActiveClass: "!bg-primary !w-6",
          }}
        >
          {displayFestivals.map((festival) => (
            <SwiperSlide key={festival.id} className="!h-auto pb-1">
              <div className="h-full">
                <FestivalCard festival={festival} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <SwiperControls
          setPrevEl={setPrevEl}
          setNextEl={setNextEl}
          setPaginationEl={setPaginationEl}
        />
      </div>
    </section>
  );
}
