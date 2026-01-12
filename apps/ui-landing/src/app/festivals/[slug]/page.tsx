"use client";

import { useParams } from "next/navigation";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { useEvents } from "@/hooks/useEvents";
import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { Loader2, Calendar, MapPin, Globe, Building2, ExternalLink, Ticket, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, isSameDay, isSameYear } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function FestivalDetailsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: festival, isLoading, isError, error } = useFestivalBySlug(slug);

    // Type assertion for simplified access (replace with proper types if available)
    const f = festival as any;
    const festivalId = f?.id;

    const { data: hackathonsData } = usePublicHackathons(festivalId, undefined, {
        enabled: !!festivalId,
    });
    const { data: eventsData } = useEvents(festivalId, undefined, {
        enabled: !!festivalId,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !festival) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold text-destructive">
                    Error loading festival
                </h1>
                <p className="text-muted-foreground">
                    {(error as Error)?.message || "Festival not found"}
                </p>
                <Button asChild className="mt-4">
                    <Link href="/festivals">Back to Festivals</Link>
                </Button>
            </div>
        );
    }

    const hackathons = hackathonsData?.pages.flatMap((page) => page) ?? [];
    const events = eventsData?.pages.flatMap((page) => page) ?? [];

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
        <div className="min-h-screen bg-background pb-20 font-sans">
            {/* HERO SECTION */}
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-foreground">
                {f.posterImageUrl ? (
                    <Image
                        src={f.posterImageUrl}
                        alt={f.name}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80 opacity-80" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 mx-auto z-10">
                    {/* Status Badge */}
                    {f.status === 'ONGOING' && (
                        <div className="mb-4">
                            <Badge className="bg-primary/20 text-primary-foreground border-primary/20 hover:bg-primary/30 px-3 py-1 text-sm backdrop-blur-sm">
                                <span className="mr-2 relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Live Now
                            </Badge>
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-background mb-4 drop-shadow-md">
                        {f.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-background/90 text-sm md:text-base font-medium">
                        {f.organizationName && (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-background/10 rounded-lg backdrop-blur-sm">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <span>{f.organizationName}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-background/10 rounded-lg backdrop-blur-sm">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <span>{formatDateRange(f.startDate, f.endDate)}</span>
                        </div>
                        {(f.locationAddress || f.locationCity) && (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-background/10 rounded-lg backdrop-blur-sm">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <span>
                                    {f.locationCity}{f.locationAddress ? `, ${f.locationAddress}` : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                {/* LEFT COLUMN (CONTENT) */}
                <div className="lg:col-span-2 space-y-12">

                    {/* About Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
                            About Festival
                        </h2>
                        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: f.description || "<p>No description provided.</p>" }} />
                        </div>
                    </section>

                    {/* Hackathons Section */}
                    {hackathons && hackathons.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                                    <Trophy className="h-6 w-6 text-primary" />
                                    Competitions
                                </h2>
                                <Badge variant="secondary" className="rounded-full px-3">{hackathons.length}</Badge>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {hackathons.map((hackathon: any) => (
                                    <Link
                                        key={hackathon.id}
                                        href={`/competitions/${hackathon.slug}`}
                                        className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                                    >
                                        <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
                                            {hackathon.bannerImageUrl ? (
                                                <Image
                                                    src={hackathon.bannerImageUrl}
                                                    alt={hackathon.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Trophy className="h-12 w-12 text-muted-foreground/30" />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <Badge variant="outline" className="text-xs font-normal bg-primary/5 text-primary border-primary/20">
                                                    {hackathon.mode || "Online"}
                                                </Badge>
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                                {hackathon.name}
                                            </h3>

                                            <div className="mt-auto pt-4 flex items-center text-sm text-muted-foreground gap-4 border-t border-border/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(hackathon.startDate), "MMM d")}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary ml-auto group-hover:translate-x-1 transition-transform">
                                                    View Details <ExternalLink className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Events Section */}
                    {events && events.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                                    <Ticket className="h-6 w-6 text-secondary-foreground" />
                                    Events
                                </h2>
                                <Badge variant="secondary" className="rounded-full px-3">{events.length}</Badge>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {events.map((event: any) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.slug}`}
                                        className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-secondary/50"
                                    >
                                        <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
                                            {event.thumbnailUrl || event.bannerImageUrl ? (
                                                <Image
                                                    src={event.thumbnailUrl || event.bannerImageUrl}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <Badge variant="outline" className="text-xs font-normal bg-secondary/5 text-secondary-foreground border-secondary/20">
                                                    Event
                                                </Badge>
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 group-hover:text-secondary-foreground transition-colors line-clamp-1">
                                                {event.name}
                                            </h3>

                                            <div className="mt-auto pt-4 flex items-center text-sm text-muted-foreground gap-4 border-t border-border/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(event.startDate), "MMM d")}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary ml-auto group-hover:translate-x-1 transition-transform">
                                                    View Details <ExternalLink className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* RIGHT COLUMN (SIDEBAR) */}
                <div className="lg:sticky lg:top-24 h-fit space-y-8">

                    {/* Quick Info Card */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 border-b pb-4">Festival Info</h3>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Date</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {formatDateRange(f.startDate, f.endDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Location</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {f.locationCity || "TBD"}
                                    </p>
                                    {f.locationVirtualLink && (
                                        <Link
                                            href={f.locationVirtualLink}
                                            target="_blank"
                                            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                        >
                                            Join Virtually <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {f.websiteUrl && (
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Website</p>
                                        <Link
                                            href={f.websiteUrl}
                                            target="_blank"
                                            className="text-sm text-primary hover:underline mt-0.5 block break-all"
                                        >
                                            Visit Website
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex items-center gap-3">
                                {f.organizationLogoUrl ? (
                                    <Image
                                        src={f.organizationLogoUrl}
                                        alt={f.organizationName}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                        {f.organizationName?.charAt(0) || "?"}
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organized by</p>
                                    <p className="font-bold text-sm">{f.organizationName || "OppSkills"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
