import { format } from "date-fns";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";
import { formatCount } from "@/lib/tools";
import { HackathonCard } from "./HackathonCard";
import { formatListingEntryFee } from "@/lib/formatListingEntryFee";

interface CompetitionCardProps {
  hackathon: PublicHackathonListItem;
}

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

export function CompetitionCard({ hackathon }: CompetitionCardProps) {
  const mode = formatMode(hackathon.mode);
  const isFree = hackathon.isFree;

  const formattedDeadline = hackathon.registrationDeadline
    ? format(new Date(hackathon.registrationDeadline), "dd MMM yyyy")
    : "N/A";

  const entryFee = formatListingEntryFee({
    isFree: hackathon.isFree,
    currency: hackathon.currency,
    entryFeeAmount: hackathon.entryFeeAmount,
    lowestTicketPrice: hackathon.lowestTicketPrice,
    highestTicketPrice: hackathon.highestTicketPrice,
  });

  const footerContent = (
    <div className="flex items-between justify-between mt-auto pt-2 w-full">
      <div className="flex flex-col gap-2 ">
        <span className="text-xs text-neutral-600">Attendees</span>
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
      <div className="flex flex-col gap-1">
        <span className="text-neutral-500 text-xs">Register by</span>
        <span className="text-neutral-700 text-sm font-medium">
          {formattedDeadline}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-right">
        <span className="text-neutral-500 text-xs">Entry Fee</span>
        <span className="text-neutral-700 text-sm font-medium">{entryFee}</span>
      </div>
    </div>
  );

  return (
    <HackathonCard
      href={`/hackathons/${hackathon.slug}`}
      imageSrc={hackathon.bannerImageUrl}
      title={hackathon.name}
      organizationName={hackathon.locationAddress}
      isFree={isFree}
      mode={mode}
      footerContent={footerContent}
    />
  );
}
