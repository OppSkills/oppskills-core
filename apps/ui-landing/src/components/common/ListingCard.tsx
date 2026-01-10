import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatInTimeZone } from "date-fns-tz";
import { Dot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ListingItem {
  id: string;
  title: string;
  slug: string;
  bannerUrl?: string; // Standardized field name
  startDate?: string;
  endDate?: string;
  status?: string;

  // Display fields
  mode?: string; // Online, Offline, Hybrid
  locationType?: string | null; // Raw backend value to derive mode
  location?: string;

  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;

  registrationDeadline?: string | null;
  registrationCount?: number;

  eventType?: string; // "Hackathon", "Event", "Workshop", "Festival"

  tags?: string[];

  // Route prefix for linking (e.g. "competitions" or "events")
  routePrefix: string;
}

interface ListingCardProps {
  item: ListingItem;
}

/**
 * Format event mode/location type for display.
 */
function formatMode(
  mode: string | undefined,
  locationType: string | null | undefined
): string {
  if (mode) return mode; // Use explicit mode if provided

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
function formatEntryFee(item: ListingItem): string {
  if (item.isFree) return "Free";
  if (item.entryFeeAmount) {
    return `${item.currency || "INR"} ${item.entryFeeAmount.toLocaleString()}`;
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

export function ListingCard({ item }: ListingCardProps) {
  const startDate = item.startDate ? new Date(item.startDate) : new Date(); // Fallback to now if missing

  const formattedDate = formatInTimeZone(startDate, "UTC", "dd MMM yyyy");

  // Safely handle null registrationDeadline
  const formattedDeadLineDate = item.registrationDeadline
    ? formatInTimeZone(
      new Date(item.registrationDeadline),
      "UTC",
      "dd MMM yyyy"
    )
    : "N/A";

  const mode = formatMode(item.mode, item.locationType);
  const entryFee = formatEntryFee(item);
  const isFree = item.isFree ?? !item.entryFeeAmount;

  // Derive event type if not provided
  const eventType = item.eventType || "Event";

  return (
    <Link href={`/${item.routePrefix}/${item.slug}`} prefetch={false}>
      <Card className="gap-2 p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
        {/* Image Section */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
          {item.bannerUrl ? (
            <Image
              src={item.bannerUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
              <span className="text-background text-5xl font-bold">
                {item.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 right-0 bg-background rounded-tl-lg px-3 flex text-primary-500 text-xs">
            {[eventType, mode].map((tag, index) => (
              <div key={index} className="flex gap-0.5 items-center">
                {index > 0 && <Dot />}
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="space-y-2 flex-grow">
          <div className="flex gap-0.5 items-center overflow-ellipsis inter text-xs text-neutral-600">
            {[isFree ? "Free" : "Paid", formattedDate, mode].map(
              (tag, index) => (
                <p key={index} className="gap-0.5 flex items-center">
                  {index > 0 && <Dot />}
                  {tag}
                </p>
              )
            )}
          </div>
          <h3 className="font-semibold text-xl text-neutral-900 break-words">
            {item.title}
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
                  {formatCount(item.registrationCount)}
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
