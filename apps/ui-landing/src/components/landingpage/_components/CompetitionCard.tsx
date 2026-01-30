import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";
import { OpportunityCard } from "./OpportunityCard";

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

function formatCurrency(amount: number | null, currency: string): string {
    if (!amount) return "0";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function CompetitionCard({ hackathon }: CompetitionCardProps) {
    const mode = formatMode(hackathon.mode);
    const isFree = hackathon.isFree;

    const formattedDeadline = hackathon.registrationDeadline
        ? format(new Date(hackathon.registrationDeadline), "dd MMM yyyy")
        : "N/A";

    const prizeAmount = formatCurrency(hackathon.prizeTotalWorthAmount, hackathon.currency);

    const footerContent = (
        <div className="flex items-center justify-between mt-auto pt-2 w-full">
            {/* Added top border for separation or just keep clean */}
            <div className="flex flex-col gap-1">
                <span className="text-neutral-500 text-xs">Register by</span>
                <span className="text-neutral-700 text-sm font-medium">{formattedDeadline}</span>
            </div>

            <div className="flex flex-col gap-1 text-right">
                <span className="text-neutral-500 text-xs">Prizes worth</span>
                <span className="text-neutral-700 text-sm font-medium">₹ {prizeAmount}</span>
            </div>
        </div>
    );

    return (
        <OpportunityCard
            href={`/competitions/${hackathon.slug}`}
            imageSrc={hackathon.bannerImageUrl}
            title={hackathon.name}
            organizationName={hackathon.locationAddress}
            isFree={isFree}
            mode={mode}
            footerContent={footerContent}
        />
    );
}
