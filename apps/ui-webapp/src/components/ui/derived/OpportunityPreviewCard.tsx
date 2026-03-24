import React from "react";
import { format } from "date-fns";
import { HackathonCard } from "@/components/landingpage/_components/HackathonCard";
import { formatCount } from "@/lib/tools";

interface OpportunityPreviewCardProps {
  title: string;
  imageSrc?: string | null;
  organizationName?: string | null;
  isFree: boolean;
  mode: string;
  entryFeeAmount?: string | number | null;
  currency?: string;
  registrationDeadline?: Date | string | null;
  type?: "EVENT" | "HACKATHON";
}

/**
 * A preview card component for the Organize pages.
 * Matches the design of the landing page cards.
 */
export default function OpportunityPreviewCard({
  title,
  imageSrc,
  organizationName,
  isFree,
  mode,
  entryFeeAmount,
  currency = "INR",
  registrationDeadline,
  type = "EVENT",
}: OpportunityPreviewCardProps) {
  const formattedDeadline = registrationDeadline
    ? format(new Date(registrationDeadline), "dd MMM yyyy")
    : "N/A";

  const entryFee = isFree
    ? "Free"
    : `${currency === "INR" ? "₹" : currency} ${entryFeeAmount ? Number(entryFeeAmount).toLocaleString() : "0"
    }`;

  const topRightBadge = (
    <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
      {type}
    </div>
  );

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
            {formatCount(3299)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 ">
        <span className="text-xs text-neutral-600">Register By</span>
        <span className="text-neutral-700 font-medium">
          {formattedDeadline}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-right">
        <span className="text-xs text-neutral-600">Entry Fee</span>
        <span className="text-neutral-700 font-medium">{entryFee || 99}</span>
      </div>
    </div>
  );

  return (
    <HackathonCard
      href="#"
      imageSrc={imageSrc || null}
      title={title || (type === "HACKATHON" ? "Hackathon Name" : "Event Name")}
      organizationName={organizationName || "OppSkills"}
      isFree={isFree}
      mode={mode}
      topRightBadge={topRightBadge}
      footerContent={footerContent}
    />
  );
}
