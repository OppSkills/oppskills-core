"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, isSameDay, isSameYear } from "date-fns";
import { Loader2 } from "lucide-react";
import { CompetitionCard } from "@/components/landingpage/_components/CompetitionCard";
import { EventCard } from "@/components/landingpage/_components/EventCard";
import { EventTabs } from "@/app/events/[slug]/_components/EventTabs";
import { FestivalInfoCard } from "./FestivalInfoCard";
import { Button } from "@/components/ui/button";

interface FestivalDetailsClientProps {
    festival: any;
    hackathons: any[];
    events: any[];
    hasNextPageHackathons?: boolean;
    fetchNextPageHackathons?: () => void;
    isFetchingNextPageHackathons?: boolean;
    hasNextPageEvents?: boolean;
    fetchNextPageEvents?: () => void;
    isFetchingNextPageEvents?: boolean;
}

export default function FestivalDetailsClient({
    festival,
    hackathons,
    events,
    hasNextPageHackathons,
    fetchNextPageHackathons,
    isFetchingNextPageHackathons,
    hasNextPageEvents,
    fetchNextPageEvents,
    isFetchingNextPageEvents,
}: FestivalDetailsClientProps) {
    const [activeTab, setActiveTab] = useState("About Festival");

    const TABS = React.useMemo(() => {
        const tabs = ["About Festival"];
        if (hackathons && hackathons.length > 0) tabs.push("Competitions");
        if (events && events.length > 0) tabs.push("Events");
        tabs.push("Contact Details");
        return tabs;
    }, [hackathons, events]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const sectionId = tab.toLowerCase().replace(/\s+/g, '-');
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // Helper for date formatting (reused for main header)
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

    const formattedDate = formatDateRange(festival.startDate, festival.endDate);
    const locationText = festival.locationCity || "TBD";

    // Month/Day for the calendar icon
    const startDateObj = new Date(festival.startDate);
    const monthShort = format(startDateObj, "MMM");
    const dayNum = format(startDateObj, "dd");

    return (
        <div className="min-h-screen bg-transparent lg:pt-8 pb-8 font-sans">
            {/* Main Container - Full width with padding, no max-w constraint */}
            <div className="w-full px-0 sm:px-8 md:px-12 lg:px-16 xl:px-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

                    {/* LEFT COLUMN: Banner & Contact Details (Mobile Only) & Info Card */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Banner Image */}
                        {festival.posterImageUrl && (
                            <div className="relative m-0 lg:mb-4 aspect-video w-full overflow-hidden lg:rounded-3xl shadow-sm">
                                <Image
                                    src={festival.posterImageUrl}
                                    alt={festival.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}

                        {/* Sidebar Info Card (Desktop Only - hidden on mobile, shown in right col on mobile?) 
                Actually design says sidebar is left, similar to event page contact/banner.
                Events page has contact details on left.
            */}
                        <div className="hidden lg:block">
                            <FestivalInfoCard type="sidebar" festival={festival} />
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Info, Content */}
                    <div className="lg:col-span-8 space-y-8 order-1 lg:order-2 px-4 sm:px-0">
                        <div className="mb-6 mt-3">
                            <h1 className="text-neutral-900 text-3xl font-semibold">
                                {festival.name}
                            </h1>
                        </div>

                        {/* Tabs & Content */}
                        <div className="space-y-6">
                            <EventTabs
                                tabs={TABS}
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                            />

                            <div className="space-y-12">

                                {/* About Festival */}
                                <section id="about-festival" className="scroll-mt-24">
                                    <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                                        About Festival
                                    </h2>
                                    <div className="prose max-w-none text-neutral-600 inter">
                                        {festival.description ? (
                                            <div
                                                className="html-content whitespace-pre-line wrap-break-word leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: festival.description }}
                                            />
                                        ) : (
                                            <p>No description available.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Competitions */}
                                {hackathons.length > 0 && (
                                    <section id="competitions" className="scroll-mt-24">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground poppins">
                                                Competitions
                                            </h2>
                                        </div>

                                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                                            {hackathons.map((hackathon: any) => (
                                                <CompetitionCard key={hackathon.id} hackathon={hackathon} />
                                            ))}
                                        </div>

                                        {hasNextPageHackathons && (
                                            <div className="mt-8 flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => fetchNextPageHackathons?.()}
                                                    disabled={isFetchingNextPageHackathons}
                                                    className="rounded-full px-8"
                                                >
                                                    {isFetchingNextPageHackathons ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        "Show More"
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* Events */}
                                <section id="events" className="scroll-mt-24">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground poppins">
                                            Events
                                        </h2>
                                    </div>

                                    {events.length > 0 ? (
                                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                                            {events.map((event: any) => (
                                                <EventCard key={event.id} event={event} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-neutral-500 italic p-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-center">
                                            No events listed yet.
                                        </div>
                                    )}

                                    {hasNextPageEvents && (
                                        <div className="mt-8 flex justify-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => fetchNextPageEvents?.()}
                                                disabled={isFetchingNextPageEvents}
                                                className="rounded-full px-8"
                                            >
                                                {isFetchingNextPageEvents ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    "Show More"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </section>

                                {/* Contact Details */}
                                <section id="contact-details" className="scroll-mt-24 space-y-6">
                                    <h2 className="text-2xl font-bold text-foreground poppins">
                                        Contact Details
                                    </h2>
                                    <div className="lg:hidden">
                                        <FestivalInfoCard festival={festival} />
                                    </div>
                                    <div className="hidden lg:block p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                                        <p className="text-neutral-600 mb-6">
                                            For any queries regarding the festival, please reach out to the organizers.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            {festival.organizationLogoUrl ? (
                                                <Image
                                                    src={festival.organizationLogoUrl}
                                                    alt={festival.organizationName || "Organizer"}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-full w-16 h-16 object-cover border-2 border-white shadow-sm"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-sm">
                                                    {(festival.organizationName || festival.organizer?.firstName || "O").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-lg text-neutral-900">
                                                    {festival.organizationName || `${festival.organizer?.firstName || ''} ${festival.organizer?.lastName || ''}`.trim() || "OppSkills Organizer"}
                                                </p>
                                                {festival.organizer?.email && (
                                                    <p className="text-neutral-500 font-medium">
                                                        {festival.organizer.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
