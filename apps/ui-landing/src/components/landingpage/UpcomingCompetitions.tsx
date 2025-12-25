"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Dot, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";

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

  // Show only the first 6 hackathons
  const displayHackathons = (hackathons ?? []).slice(0, 6);

  // Loading state
  if (isLoading) {
    return (
      <section
        className="w-full py-12 md:py-16 lg:py-20 bg-background"
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
        className="w-full py-12 md:py-16 lg:py-20 bg-background"
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
      className="w-full py-12 md:py-16 lg:py-20 bg-background"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayHackathons.map((hackathon) => {
            const startDate = new Date(hackathon.startDate);
            const formattedDate = format(startDate, "dd MMM yyyy");
            const formattedDeadLineDate = hackathon.registrationDeadline
              ? format(new Date(hackathon.registrationDeadline), "dd MMM yyyy")
              : "N/A";
            const mode = formatMode(hackathon.mode);
            const entryFee = formatEntryFee(hackathon);

            return (
              <Link key={hackathon.id} href={`/competitions/${hackathon.slug}`}>
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
                        <span className="text-white text-5xl font-bold">
                          {hackathon.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    <h3 className="font-semibold text-xl text-neutral-900">
                      {hackathon.name}
                    </h3>

                    <div className="flex justify-between items-center text-sm pb-3">
                      <div className="flex flex-col gap-2 ">
                        <span className="text-xs text-neutral-500">Teams</span>
                        <span className="text-neutral-700">
                          {hackathon.registrationCount}
                        </span>
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
            );
          })}
          {displayHackathons.length === 1 && (
            <div className="col-span-2 bg-[url('/competition_placeholder.png')] bg-cover bg-center bg-no-repeat"></div>
          )}
        </div>
      </div>
    </section>
  );
}
