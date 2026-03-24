import React from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { formatCount } from "@/lib/tools";

export interface OpportunityCardProps {
  href: string;
  imageSrc?: string | null;
  title: string;
  organizationName?: string | null;
  isFree?: boolean;
  mode?: string;
  registrationDeadline?: string | Date | null;
  registrationCount?: number;
  opportunityCount?: number;
  startDate?: string | Date | null;
  entryFee?: string;
  currency?: string;
  eventType?: string;
  topRightBadge?: React.ReactNode;
}

export function OpportunityCard({
  href,
  imageSrc,
  title,
  organizationName = "OppSkills",
  isFree = false,
  mode = "Online",
  registrationDeadline,
  registrationCount = 0,
  opportunityCount,
  startDate,
  entryFee,
  currency = "INR",
  eventType,
  topRightBadge,
}: OpportunityCardProps) {
  const formattedDeadline = registrationDeadline
    ? format(new Date(registrationDeadline), "dd MMM yyyy")
    : "N/A";

  const formattedStartDate = startDate
    ? format(new Date(startDate), "dd MMM yyyy")
    : "N/A";

  const displayEntryFee = isFree ? "Free" : entryFee || "Paid";

  return (
    <Link href={href} prefetch={false} className="h-full block">
      <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-3xl">
        {/* Image Section */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted shrink-0">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
              <span className="text-white font-bold opacity-20 text-4xl">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Top Right Badge (e.g. Type) */}
          {topRightBadge ? (
            <div className="absolute top-2 right-2 z-10">{topRightBadge}</div>
          ) : eventType ? (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                {eventType}
              </div>
            </div>
          ) : null}

          {/* Bottom Left Badge (Common Style) */}
          <div className="absolute -bottom-0.5 left-0 flex items-center">
            <div className="py-1 pr-3 pl-5 bg-background text-primary-500 text-xs rounded-tr-lg flex gap-2 items-center">
              <span>{isFree ? "Free" : "Paid"}</span>
              <span className="text-[6px]"> ● </span>
              <span>{mode}</span>
            </div>
            <div className="relative -left-[0.5px] -top-[0.5px] self-stretch w-5 flex-1 overflow-hidden">
              <Image
                src="/illustrations/curve.svg"
                alt="curve"
                fill
                className="object-cover object-right"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative bg-card pt-4 px-5 pb-5 flex flex-col flex-1 min-h-[140px]">
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl text-neutral-900 font-semibold line-clamp-2 leading-tight tracking-tight min-h-13">
              {title}
            </h3>

            {organizationName && (
              <p className="text-neutral-600 text-xs line-clamp-1 mt-1">
                {organizationName}
              </p>
            )}
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mt-auto pt-2 w-full">
              <div className="flex flex-col gap-2 ">
                <span className="text-xs text-neutral-600">Attendees</span>
                <div className="flex gap-1">
                  <div className="flex">
                    <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                    <div className="w-4 h-4 rounded-full bg-primary-400 -ml-2"></div>
                    <div className="w-4 h-4 rounded-full bg-primary-300 -ml-2"></div>
                  </div>
                  <span className="text-neutral-700">
                    {formatCount(registrationCount)}
                  </span>
                </div>
              </div>

              {opportunityCount !== undefined ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Opportunities</span>
                    <span className="text-neutral-700 text-sm font-medium">
                      {opportunityCount}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-neutral-500 text-xs">Date from</span>
                    <span className="text-neutral-700 text-sm font-medium">
                      {formattedStartDate}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 text-xs">Register by</span>
                    <span className="text-neutral-700 text-sm font-medium">
                      {formattedDeadline}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-neutral-500 text-xs">Entry Fee</span>
                    <span className="text-neutral-700 text-sm font-medium">
                      {displayEntryFee}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
