import { formatInTimeZone } from "date-fns-tz";
import { formatCount } from "@/lib/tools";
import type { EventListItem, PastOpportunityItem } from "@/hooks/useEvents";
import { HackathonCard } from "./HackathonCard";
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
        lowestTicketPrice: (event as { lowestTicketPrice?: number | null }).lowestTicketPrice,
        highestTicketPrice: (event as { highestTicketPrice?: number | null }).highestTicketPrice,
    });
}

export function EventCard({ event, hideRegistrationInfo, organizationName }: EventCardProps) {
    const startDate = new Date(event.startDate);
    const formattedDate = formatInTimeZone(startDate, "UTC", "dd MMM yyyy");

    // Safely handle null registrationDeadline
    const formattedDeadLineDate = event.registrationDeadline
        ? formatInTimeZone(
            new Date(event.registrationDeadline),
            "UTC",
            "dd MMM yyyy"
        )
        : "N/A";

    // ... (rest of function until return)

    // Fallback logic: Use prop if provided, otherwise event.locationAddress, otherwise null
    const displayOrgName = organizationName !== undefined ? organizationName : event.locationAddress;
    // Note: Typescript might still complain about event.locationAddress if it thinks it doesn't exist.
    // Since we verified the types, it should be fine.


    const mode = formatMode(event.locationType);
    const entryFee = formatEntryFee(event);

    const baseUrl = 'type' in event && event.type === 'HACKATHON' ? '/hackathons' : '/events';

    const topRightBadge = (
        'type' in event ? (
            <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                {event.type}
            </div>
        ) : null
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

            <div className={`flex flex-col gap-1 ${hideRegistrationInfo ? 'text-left' : 'text-right'}`}>
                <span className="text-xs text-neutral-600">Entry Fee</span>
                <span className="text-neutral-700 font-medium">{entryFee}</span>
            </div>
        </div>
    );

    return (
        <HackathonCard
            href={`${baseUrl}/${event.slug}`}
            imageSrc={event.bannerImageUrl}
            title={event.name}
            organizationName={organizationName ?? event.locationAddress}
            isFree={event.isFree}
            mode={mode}
            topRightBadge={topRightBadge}
            footerContent={footerContent}
        />
    );
}
