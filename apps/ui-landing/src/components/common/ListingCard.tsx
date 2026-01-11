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


export interface ListingCardProps {
  item: ListingItem;
  layout?: "grid" | "list";
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

export function ListingCard({ item, layout = "grid" }: ListingCardProps) {
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

  // Common inner content
  const Content = () => (
    <CardContent className="space-y-2 flex-grow p-4">
      <div className="flex gap-0.5 items-center overflow-ellipsis inter text-xs text-neutral-600">
        {[isFree ? "Free" : "Paid", formattedDate, mode].map((tag, index) => (
          <p key={index} className="gap-0.5 flex items-center">
            {index > 0 && <Dot />}
            {tag}
          </p>
        ))}
      </div>
      <h3 className="font-semibold text-xl text-neutral-900 break-words line-clamp-2">
        {item.title}
      </h3>

      <div className="flex justify-between items-center text-sm pt-2 mt-auto">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Attendees</span>
          <div className="flex gap-1 items-center">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-primary-100 border-2 border-background ring-1 ring-background" />
              <div className="w-5 h-5 rounded-full bg-primary-200 border-2 border-background ring-1 ring-background" />
              <div className="w-5 h-5 rounded-full bg-primary-300 border-2 border-background ring-1 ring-background" />
            </div>
            <span className="text-neutral-700 font-medium ml-1">
              {formatCount(item.registrationCount)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Register By</span>
          <span className="text-neutral-700 font-medium">{formattedDeadLineDate}</span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Entry Fee</span>
          <span className="text-neutral-700 font-medium">{entryFee}</span>
        </div>
      </div>
    </CardContent>
  );

  const ImageSection = () => (
    <div className={`relative overflow-hidden bg-muted group-hover:scale-[1.02] transition-transform duration-500 ${layout === 'list' ? 'w-full sm:w-48 md:w-64 h-48 sm:h-full shrink-0' : 'w-full h-48 sm:h-56'}`}>
      {item.bannerUrl ? (
        <Image
          src={item.bannerUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
          <span className="text-background text-5xl font-bold">
            {item.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 right-0 left-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex flex-wrap gap-2 justify-end">
          {/* Tags overlay only on grid or bottom of image in list */}
          {[eventType, mode].map((tag, index) => (
            <span key={index} className="px-2 py-0.5 rounded-full bg-background/90 text-foreground text-[10px] font-medium shadow-sm backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/${item.routePrefix}/${item.slug}`} prefetch={false} className="h-full block">
      <Card className={`
        group overflow-hidden border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-card h-full
        ${layout === 'list' ? 'flex flex-col sm:flex-row h-auto sm:h-52' : 'flex flex-col'}
      `}>
        <ImageSection />
        <Content />
      </Card>
    </Link>
  );
}
