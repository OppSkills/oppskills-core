import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn, normalizeUrl } from "@/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import { formatCount } from "@/lib/tools";
import type {
  EventListItem,
  PastOpportunityItem,
} from "@/hooks/events/useEvents";
import { formatListingEntryFee } from "@/lib/formatListingEntryFee";

interface EventCardProps {
  event: EventListItem | PastOpportunityItem;
  hideRegistrationInfo?: boolean;
  organizationName?: string | null;
}

function formatMode(locationType: string | null): string {
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

function formatEntryFee(event: EventListItem | PastOpportunityItem): string {
  return formatListingEntryFee({
    isFree: event.isFree,
    currency: event.currency,
    entryFeeAmount: event.entryFeeAmount,
    lowestTicketPrice: (event as { lowestTicketPrice?: number | null })
      .lowestTicketPrice,
    highestTicketPrice: (event as { highestTicketPrice?: number | null })
      .highestTicketPrice,
  });
}

export function EventCard({
  event,
  hideRegistrationInfo,
  organizationName,
}: EventCardProps) {
  const startDate = new Date(event.startDate);
  const formattedDate = formatInTimeZone(startDate, "UTC", "dd MMM yyyy");

  // Safely handle null registrationDeadline
  const formattedDeadLineDate = event.registrationDeadline
    ? formatInTimeZone(
        new Date(event.registrationDeadline),
        "UTC",
        "dd MMM yyyy",
      )
    : "N/A";

  const displayOrgName =
    organizationName !== undefined ? organizationName : event.locationAddress;

  const mode = formatMode(event.locationType);
  const entryFee = formatEntryFee(event);

  const baseUrl =
    "type" in event && event.type === "HACKATHON" ? "/hackathons" : "/events";

  const topRightBadge =
    "type" in event ? (
      <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
        {event.type}
      </div>
    ) : null;

  const footerContent = (
    <div className="flex justify-between items-center text-sm pb-1 w-full pt-2">
      <div className="flex flex-col gap-1 ">
        <span className="text-xs text-neutral-600">Attendees</span>
        <div className="flex gap-1">
          <div className="flex">
            <div className="w-4 h-4 rounded-full bg-primary-500"></div>
            <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
            <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
          </div>
          <span className="text-neutral-700 font-medium">
            {formatCount(event.registrationCount)}
          </span>
        </div>
      </div>

      {!hideRegistrationInfo && (
        <div className="flex flex-col gap-1 ">
          <span className="text-xs text-neutral-600">Register By</span>
          <span className="text-neutral-700 font-medium">
            {formattedDeadLineDate}
          </span>
        </div>
      )}

      <div
        className={`flex flex-col gap-1 ${hideRegistrationInfo ? "text-left" : "text-right"}`}
      >
        <span className="text-xs text-neutral-600">Entry Fee</span>
        <span className="text-neutral-700 font-medium">{entryFee}</span>
      </div>
    </div>
  );

  const imageSrc = event.bannerImageUrl;
  const title = event.name;
  const isFree = event.isFree;
  const href = `${baseUrl}/${event.slug}`;

  return (
    <Link href={href} prefetch={false} className="h-full block">
      <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-3xl">
        {/* Image Section */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted flex-shrink-0">
          {imageSrc ? (
            <Image
              src={normalizeUrl(imageSrc)}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
              <span className="text-white font-bold opacity-20 text-4xl">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Top Right Badge (e.g. Type) */}
          {topRightBadge && (
            <div className="absolute top-2 right-2 z-10">{topRightBadge}</div>
          )}

          {/* Bottom Right Badge (Event Style - Right Aligned) */}
          <div className="absolute -bottom-[0.1px] right-0 flex items-center">
            <div className="relative -top-[0.185px] self-stretch w-5 flex-1 overflow-hidden">
              <Image
                src="/illustrations/sin-shape-with-rectangle.svg"
                alt="curve"
                fill
                className="object-cover object-left"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <div className="pt-1.5 pb-0.5 pl-3 pr-5 bg-background text-primary-500 text-xs flex gap-2 items-center rounded-tl-[1px]">
              <span>{isFree ? "Free" : "Paid"}</span>
              <span className="text-[6px]"> ● </span>
              <span>{mode}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative bg-card pt-4 px-5 pb-5 flex flex-col flex-1 min-h-[140px]">
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl text-neutral-900 font-semibold line-clamp-2 leading-tight tracking-tight">
              {title}
            </h3>

            {displayOrgName && (
              <p className="text-neutral-600 text-xs line-clamp-1 mt-1">
                {displayOrgName}
              </p>
            )}
          </div>

          <div className="mt-auto">{footerContent}</div>
        </div>
      </Card>
    </Link>
  );
}
