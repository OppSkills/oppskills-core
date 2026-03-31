import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatInTimeZone } from "date-fns-tz";
import { Dot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ensureAbsoluteUrl } from "@/lib/utils";

// Expanded interface to match PublicHackathonListItem fields + UI needs
export interface Competition {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  startDate?: string;
  endDate?: string;
  mode?: string;
  location?: string;
  bannerUrl?: string;
  status?: string;
  // New fields for the new design
  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;
  registrationDeadline?: string | null;
  locationType?: string | null; // e.g. "To format mode"
  eventType?: string; // "Hackathon" usually
  registrationCount?: number;
  tags?: string[];
  isDraft?: boolean; // Kept for type compatibility but won't be visually emphasized as before
}

interface CompetitionCardProps {
  competition: Competition;
}

/**
 * Format event mode/location type for display.
 */
function formatMode(locationType: string | null | undefined): string {
  if (!locationType) return "Online";
  switch (locationType.toUpperCase()) {
    case "VIRTUAL":
    case "ONLINE":
      return "Online";
    case "OFFLINE":
    case "IN_PERSON": // Fallback
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
function formatEntryFee(competition: Competition): string {
  if (competition.isFree) return "Free";
  if (competition.entryFeeAmount) {
    return `${competition.currency || "INR"} ${competition.entryFeeAmount.toLocaleString()}`;
  }
  return "Free"; // Default to Free if unknown
}

function formatCount(num: number | undefined): string {
  if (!num) return "0";
  if (num < 10) {
    return `${num}`;
  }

  if (num < 1000) {
    return `${Math.floor(num / 10) * 10}+`;
  }

  if (num < 1_000_000) {
    const value = Math.floor(num / 100) / 10; // 1 decimal
    return `${value % 1 === 0 ? value.toFixed(0) : value}k`;
  }

  const value = Math.floor(num / 10_000) / 100; // 2 decimals
  return `${value % 1 === 0 ? value.toFixed(0) : value}M+`;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const startDate = competition.startDate
    ? new Date(competition.startDate)
    : new Date(); // Fallback to now if missing

  const formattedDate = formatInTimeZone(startDate, "UTC", "dd MMM yyyy");

  // Safely handle null registrationDeadline
  const formattedDeadLineDate = competition.registrationDeadline
    ? formatInTimeZone(
        new Date(competition.registrationDeadline),
        "UTC",
        "dd MMM yyyy"
      )
    : "N/A";

  const mode = formatMode(competition.locationType ?? competition.mode);
  const entryFee = formatEntryFee(competition);
  const isFree = competition.isFree ?? true;

  // Derive event type if not provided, usually "Hackathon" for this page
  const eventType = competition.eventType || "Hackathon";

  return (
    <Link href={`/hackathons/${competition.slug}`}>
      <Card className="gap-2 p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
        {/* Image Section */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
          {competition.bannerUrl ? (
            <Image
              src={ensureAbsoluteUrl(competition.bannerUrl)}
              alt={competition.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
              <span className="text-background text-5xl font-bold">
                {competition.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 right-0 bg-background rounded-tl-lg px-3 flex text-primary-500 text-xs">
            {[eventType, mode].map((item, index) => (
              <div key={index} className="flex gap-0.5 items-center">
                {index > 0 && <Dot />}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="space-y-2 flex-grow">
          <div className="flex gap-0.5 items-center overflow-ellipsis inter text-xs text-neutral-600">
            {[isFree ? "Free" : "Paid", formattedDate, mode].map(
              (item, index) => (
                <p key={index} className="gap-0.5 flex items-center">
                  {index > 0 && <Dot />}
                  {item}
                </p>
              )
            )}
          </div>
          <h3 className="font-semibold text-xl text-neutral-900 line-clamp-1">
            {competition.title}
          </h3>

          <div className="flex justify-between items-center text-sm pb-3">
            <div className="flex flex-col gap-2 ">
              <span className="text-xs text-neutral-600">Attendees</span>
              <div className="flex gap-1">
                <div className="flex">
                  <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                  <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
                  <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
                </div>
                <span className="text-neutral-700">
                  {formatCount(competition.registrationCount)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 ">
              <span className="text-xs text-neutral-600">Register By</span>
              <span className="text-neutral-700">{formattedDeadLineDate}</span>
            </div>
            <div className="flex flex-col gap-2  text-right">
              <span className="text-xs text-neutral-600">Entry Fee</span>
              <span className="text-neutral-700">{entryFee}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
