"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Dot } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { formatCount } from "@/lib/tools";
import type { EventListItem } from "@/hooks/useEvents";

interface EventCardProps {
    event: EventListItem;
    hideRegistrationInfo?: boolean;
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

function formatEntryFee(event: EventListItem): string {
    if (event.isFree) return "Free";
    if (event.entryFeeAmount) {
        return `${event.currency} ${event.entryFeeAmount.toLocaleString()}`;
    }
    return "Free";
}

export function EventCard({ event, hideRegistrationInfo }: EventCardProps) {
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

    const mode = formatMode(event.locationType);
    const entryFee = formatEntryFee(event);

    return (
        <Link href={`/events/${event.slug}`} prefetch={false}>
            <Card className="gap-2 p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card h-full flex flex-col">
                {/* Image Section */}
                <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
                    {event.bannerImageUrl ? (
                        <Image
                            src={event.bannerImageUrl}
                            alt={event.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
                            <span className="text-background text-5xl font-bold">
                                {event.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 right-0 bg-background rounded-tl-lg px-3 flex text-primary-500 text-xs">
                        {[event.eventType, event.locationType].map((item, index) => (
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
                        {[event.isFree ? "Free" : "Paid", formattedDate, mode].map(
                            (item, index) => (
                                <p key={index} className="gap-0.5 flex items-center">
                                    {index > 0 && <Dot />}
                                    {item}
                                </p>
                            )
                        )}
                    </div>
                    <h3 className="font-semibold text-xl text-neutral-900 whitespace-nowrap overflow-ellipsis overflow-hidden">
                        {event.name}
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
                                    {formatCount(event.registrationCount)}
                                </span>
                            </div>
                        </div>

                        {!hideRegistrationInfo && (
                            <div className="flex flex-col gap-2 ">
                                <span className="text-xs text-neutral-600">Register By</span>
                                <span className="text-neutral-700">
                                    {formattedDeadLineDate}
                                </span>
                            </div>
                        )}

                        <div className={`flex flex-col gap-2 ${hideRegistrationInfo ? 'text-left' : 'text-right'}`}>
                            <span className="text-xs text-neutral-600">Entry Fee</span>
                            <span className="text-neutral-700">{entryFee}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
