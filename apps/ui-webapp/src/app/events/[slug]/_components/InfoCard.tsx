import { Clock, Sparkles, Users, MapPin, Calendar } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";

interface InfoCardProps {
  teamSize: string;
  impressions: number;
  registrationDeadline: string;
  // Optional props for mobile view
  dateText?: string;
  timeText?: string;
  venueName?: string;
  venueAddress?: string;
  monthShort?: string;
  dayNum?: string;
  noBorder?: boolean;
  noPadding?: boolean;
}

export default function InfoCard({
  teamSize,
  impressions,
  registrationDeadline,
  dateText,
  timeText,
  venueName,
  venueAddress,
  monthShort,
  dayNum,
  noBorder,
  noPadding,
}: InfoCardProps) {
  const formattedDeadline = React.useMemo(() => {
    if (!registrationDeadline) return "Open until event starts";
    const date = new Date(registrationDeadline);
    if (isValid(date)) {
      return format(date, "MMM d, yyyy h:mm a");
    }
    return registrationDeadline; // Fallback to raw string if already formatted or invalid
  }, [registrationDeadline]);

  return (
    <div
      className={cn(
        "bg-background rounded-2xl",
        !noBorder && "border border-neutral-200 shadow-sm",
        !noPadding && "p-6",
      )}
    >
      <div className="space-y-5">
        {/* Mobile-only Date & Location (Hides on desktop as the grid handles it there) */}
        {(dateText || venueName) && (
          <div className="lg:hidden space-y-5 pb-5 border-b border-neutral-100">
            {dateText && (
              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-xl border border-neutral-400 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                    {monthShort || "---"}
                  </span>
                  <span className="text-lg font-bold text-neutral-900 leading-none">
                    {dayNum || "--"}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 text-[15px]">
                    {dateText}
                  </h4>
                  <p className="text-sm text-neutral-500">
                    {timeText || "Time TBD"}
                  </p>
                </div>
              </div>
            )}

            {venueName && (
              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 text-[15px]">
                    {venueName}
                  </h4>
                  <p className="text-sm text-neutral-500">
                    {venueAddress || "Location Details"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats List */}
        <div className="space-y-4">
          {/* Entry Type */}
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-neutral-800 " />
            </div>
            <div>
              <div className="font-semibold text-neutral-900  text-sm">
                {teamSize || "Individual Registration"}
              </div>
              <div className="text-xs text-neutral-500">Entry Type</div>
            </div>
          </div>

          {/* Impressions */}
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-neutral-800 " />
            </div>
            <div>
              <div className="font-semibold text-neutral-900  text-sm">
                {impressions}
              </div>
              <div className="text-xs text-neutral-500">Impressions</div>
            </div>
          </div>

          {/* Registration Deadline */}
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-neutral-800 " />
            </div>
            <div>
              <div className="font-semibold text-neutral-900  text-sm">
                {formattedDeadline}
              </div>
              <div className="text-xs text-neutral-500">
                Registration Deadline
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
