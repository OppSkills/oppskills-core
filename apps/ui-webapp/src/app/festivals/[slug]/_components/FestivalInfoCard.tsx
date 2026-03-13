"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { format, isSameDay, isSameYear } from "date-fns";
import { Calendar, MapPin, Globe, ExternalLink } from "lucide-react";

interface FestivalInfoCardProps {
    festival: {
        startDate: string;
        endDate: string;
        locationCity: string | null;
        locationVirtualLink: string | null;
        websiteUrl: string | null;
        organizationName: string | null;
        organizationLogoUrl: string | null;
    };
}

export function FestivalInfoCard({ festival }: FestivalInfoCardProps) {
    // Helper for date formatting
    const formatDateRange = (start: string | Date, end: string | Date) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isSameDay(startDate, endDate)) {
            return format(startDate, "EEE, MMM d, yyyy");
        }
        if (isSameYear(startDate, endDate)) {
            return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
        }
        return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    };

    return (
        <div className="w-full bg-background rounded-[20px] border border-neutral-200 overflow-hidden shadow-sm font-sans">
            <div className="bg-primary-100 px-6 py-4 border-b border-neutral-100">
                <h3 className="text-neutral-700 font-semibold text-lg">
                    Festival Info
                </h3>
            </div>

            <div className="p-6 space-y-6">
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-neutral-900">Date</p>
                            <p className="text-sm text-neutral-600 mt-0.5">
                                {formatDateRange(festival.startDate, festival.endDate)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-neutral-900">Location</p>
                            <p className="text-sm text-neutral-600 mt-0.5">
                                {festival.locationCity || "TBD"}
                            </p>
                            {festival.locationVirtualLink && (
                                <Link
                                    href={festival.locationVirtualLink}
                                    target="_blank"
                                    className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                >
                                    Join Virtually <ExternalLink className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {festival.websiteUrl && (
                        <div className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-neutral-900">Website</p>
                                <Link
                                    href={festival.websiteUrl}
                                    target="_blank"
                                    className="text-sm text-primary hover:underline mt-0.5 block break-all"
                                >
                                    Visit Website
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200">
                    <div className="flex items-center gap-3">
                        {festival.organizationLogoUrl ? (
                            <Image
                                src={festival.organizationLogoUrl}
                                alt={festival.organizationName || "Organizer"}
                                width={40}
                                height={40}
                                className="rounded-full w-10 h-10 object-cover border border-neutral-100"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 border border-neutral-200">
                                {festival.organizationName?.charAt(0) || "?"}
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Organized by</p>
                            <p className="font-bold text-sm text-neutral-900">{festival.organizationName || "OppSkills"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
