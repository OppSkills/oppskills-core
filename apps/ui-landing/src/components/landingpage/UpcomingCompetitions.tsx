"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Dot, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";
import { formatCount } from "@/lib/tools";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import React from "react";


/**
 * Format hackathon mode for display.
 */
function formatMode(mode: string | null): string {
  if (!mode) return "Online";
  switch (mode.toUpperCase()) {
    case "ONLINE":
      return "Online";
    case "OFFLINE":
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
function formatEntryFee(hackathon: PublicHackathonListItem): string {
  if (hackathon.isFree) return "Free";
  if (hackathon.entryFeeAmount) {
    return `${hackathon.currency} ${hackathon.entryFeeAmount.toLocaleString()}`;
  }
  return "Free";
}

export default function UpcomingCompetitions() {
  const { data: hackathons, isLoading, error } = usePublicHackathons();
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const paginationRef = React.useRef<HTMLDivElement>(null);

  // Show only the first 6 hackathons
  const displayHackathons = (hackathons?.pages.flat() ?? []).slice(0, 6);

  // Loading state
  if (isLoading) {
    return (
      <section
        className="w-full pt-12 md:pt-16 lg:pt-20 bg-background"
        id="competitions"
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Top Competitions
            </h2>
            <p className="text-muted-foreground text-lg inter">
              Discover the most popular competitions students are joining right
              now.
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
  if (error || displayHackathons.length === 0) {
    return (
      <section
        className="w-full pt-12 md:pt-16 lg:pt-20 bg-background"
        id="competitions"
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              Top Competitions
            </h2>
            <p className="text-muted-foreground text-lg inter">
              Discover the most popular competitions students are joining right
              now.
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
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground poppins mb-2">
              No Competitions Yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md inter">
              Check back soon for exciting hackathons and coding competitions!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full pt-12 md:pt-16 lg:pt-20 bg-background"
      id="competitions"
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 space-y-2 flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Top Competitions
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Discover the most popular competitions students are joining right
            now.
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
          {displayHackathons.map((hackathon) => {
            const startDate = new Date(hackathon.startDate);
            const formattedDate = format(startDate, "dd MMM yyyy");
            const formattedDeadLineDate = hackathon.registrationDeadline
              ? format(new Date(hackathon.registrationDeadline), "dd MMM yyyy")
              : "N/A";
            const mode = formatMode(hackathon.mode);
            const entryFee = formatEntryFee(hackathon);

            return (
              <SwiperSlide key={hackathon.id}>
                <Link href={`/competitions/${hackathon.slug}`} prefetch={false}>
                  <Card className="gap-2 p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
                    {/* Image Section */}
                    <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
                      {hackathon.bannerImageUrl ? (
                        <Image
                          src={hackathon.bannerImageUrl}
                          alt={hackathon.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
                          <span className="text-background text-5xl font-bold">
                            {hackathon.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 right-0 bg-background rounded-tl-lg px-3 flex text-primary-500 text-xs">
                        {[hackathon.hackathonType, hackathon.mode].map(
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
                          hackathon.isFree ? "Free" : "Paid",
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
                        {hackathon.name}
                      </h3>

                      <div className="flex justify-between items-center text-sm pb-3">
                        <div className="flex flex-col gap-2 ">
                          <span className="text-xs text-neutral-500">Members</span>
                          <div className="flex gap-1">
                            <div className="flex">
                              <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                              <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
                              <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
                            </div>
                            <span className="text-neutral-700">
                              {formatCount(hackathon.registrationCount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ">
                          <span className="text-xs text-neutral-500">
                            Register By
                          </span>
                          <span className="text-neutral-700">
                            {formattedDeadLineDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2  text-right">
                          <span className="text-xs text-neutral-500">
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
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            ref={prevRef}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div
            ref={paginationRef}
            className="flex justify-center items-center gap-1 h-6 w-auto"
          />
          <button
            ref={nextRef}
            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div >
    </section >
  );
}
