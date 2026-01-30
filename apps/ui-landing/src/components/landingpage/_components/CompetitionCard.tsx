"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import type { PublicHackathonListItem } from "@/lib/api/hackathonApi";

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

    return (
        <Link href={`/competitions/${hackathon.slug}`} prefetch={false}>
            <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-3xl">
                {/* Image Section */}
                <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted">
                    {hackathon.bannerImageUrl ? (
                        <Image
                            src={hackathon.bannerImageUrl}
                            alt={hackathon.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                            <span className="text-white font-bold opacity-20 text-4xl">IMAGE</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute -bottom-0.5 left-0 flex items-center">
                        <div className="py-1 pr-3 pl-5 bg-background text-primary-500 text-xs rounded-tr-lg flex gap-2 items-center">
                            <span>{isFree ? "Free" : "Paid"}</span>
                            <span className="text-[6px]">  ●  </span>
                            <span>{mode}</span>
                        </div>
                        <div className="relative self-stretch w-5  flex-1 overflow-hidden">
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
                <div className="relative bg-card pt-2 px-5 pb-5 flex flex-col gap-1 flex-1">
                    <div className="flex-1 flex gap-1 flex-col">
                        <h3 className="text-xl text-neutral-900 font-semibold line-clamp-1 leading-tight tracking-tight">
                            {hackathon.name}
                        </h3>

                        <p className="text-neutral-600 text-xs line-clamp-1">
                            {hackathon.organizationName || "OppSkills"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-neutral-500 text-xs">Register by</span>
                            <span className="text-neutral-700">{formattedDeadline}</span>
                        </div>

                        <div className="flex flex-col gap-1 text-right">
                            <span className="text-neutral-500 text-xs">Prizes worth</span>
                            <span className="text-neutral-700">₹ {prizeAmount}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
