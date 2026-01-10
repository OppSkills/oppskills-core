"use client";

import { useParams } from "next/navigation";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { Loader2, Calendar, MapPin, Globe, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FestivalDetailsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: festival, isLoading, isError, error } = useFestivalBySlug(slug);

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
                <h1 className="text-2xl font-bold text-red-500">
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

    // Type assertion for simplified access (replace with proper types if available)
    const f = festival as any;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero / Banner */}
            <div className="relative h-[300px] w-full bg-muted md:h-[400px]">
                {f.posterImageUrl ? (
                    <Image
                        src={f.posterImageUrl}
                        alt={f.name}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800">
                        <span className="text-4xl font-bold text-gray-400">
                            {f.name.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                <div className="container absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {f.name}
                    </h1>
                    {f.organizationName && (
                        <div className="mt-2 flex items-center gap-2 text-lg text-muted-foreground">
                            <Building2 className="h-5 w-5" />
                            <span>{f.organizationName}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto mt-8 grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">About</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{f.description || "No description provided."}</p>
                        </div>
                    </section>

                    {/* Hackathons List */}
                    {f.hackathons && f.hackathons.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Competitions & Hackathons</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {f.hackathons.map((hackathon: any) => (
                                    <Link
                                        key={hackathon.id}
                                        href={`/competitions/${hackathon.slug}`}
                                        className="group block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                                    >
                                        <h3 className="font-semibold group-hover:text-primary">{hackathon.name}</h3>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(hackathon.startDate).toLocaleDateString()}
                                            </div>
                                            <div className="mt-1">
                                                {hackathon.mode}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Events List */}
                    {f.events && f.events.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Events</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {f.events.map((event: any) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.slug}`}
                                        className="group block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                                    >
                                        <h3 className="font-semibold group-hover:text-primary">{event.name}</h3>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 text-lg">Festival Details</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium">Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(f.startDate).toLocaleDateString()} - {new Date(f.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {(f.locationAddress || f.locationCity) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Location</p>
                                        <p className="text-sm text-muted-foreground">
                                            {f.locationAddress ? f.locationAddress : ''}
                                            {f.locationAddress && f.locationCity ? ', ' : ''}
                                            {f.locationCity}
                                        </p>
                                        {f.locationVirtualLink && (
                                            <a href={f.locationVirtualLink} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 block">
                                                Virtual Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {f.websiteUrl && (
                                <div className="flex items-start gap-3">
                                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Website</p>
                                        <a href={f.websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
                                            {f.websiteUrl}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {f.status === 'ONGOING' && (
                            <div className="mt-6">
                                <span className="inline-flex items-center rounded-full border border-green-500 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:border-green-400 dark:bg-green-950 dark:text-green-400">
                                    Live Now
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
