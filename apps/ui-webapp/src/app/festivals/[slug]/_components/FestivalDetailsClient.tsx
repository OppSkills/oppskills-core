"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, isSameDay, isSameYear } from "date-fns";
import { MapPin, Calendar, ExternalLink, Trophy, Ticket, Building2, Globe } from "lucide-react";
import { EventTabs } from "@/app/events/[slug]/_components/EventTabs";
import { FestivalInfoCard } from "./FestivalInfoCard";
import { Badge } from "@/components/ui/badge";

interface FestivalDetailsClientProps {
    festival: any;
    hackathons: any[];
    events: any[];
}

export default function FestivalDetailsClient({
    festival,
    hackathons,
    events,
}: FestivalDetailsClientProps) {
    const [activeTab, setActiveTab] = useState("About Festival");

    const TABS = ["About Festival", "Competitions", "Events", "Contact Details"];

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
                            <div className="relative m-0 lg:mb-4 aspect-[16/9] w-full overflow-hidden lg:rounded-2xl lg:shadow-sm border border-neutral-100">
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
                            <FestivalInfoCard festival={festival} />
                        </div>

                        {/* Contact Details Section for Desktop (scrolled to) */}
                        <div id="contact-details-desktop" className="scroll-mt-24 hidden lg:block">
                            {/* This section might be redundant if we have the info card, 
                   but strictly following the event page pattern, it might be separate.
                   For Festival, the info card essentially IS the contact details + more.
                   Let's render it again or just point here. 
                   Actually, let's keep it simple and just use the card as the target or put additional info here.
               */}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Info, Content */}
                    <div className="lg:col-span-8 space-y-8 order-1 lg:order-2 px-4 sm:px-0">

                        {/* Title & Header Info */}
                        <div>
                            <h1 className="text-neutral-900 text-3xl lg:text-4xl font-semibold mb-4">
                                {festival.name}
                            </h1>

                            {/* Date & Location Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date */}
                                <div className="flex gap-4 items-center">
                                    <div>
                                        <div className="flex flex-col items-center justify-center shadow-sm overflow-hidden rounded-lg">
                                            <div className="bg-neutral-200 min-w-12 flex justify-center items-center py-0.5">
                                                <span className="text-neutral-700 text-xs">
                                                    {monthShort}
                                                </span>
                                            </div>
                                            <span className="text-base font-medium text-neutral-900 py-0.5 px-2">
                                                {dayNum}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium text-neutral-800 text-base">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex w-full gap-2 items-center">
                                    <div className="border border-neutral-200 shadow-sm rounded-lg p-3">
                                        <MapPin className="w-6 h-6 text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium text-base text-neutral-800">
                                            {locationText}
                                        </p>
                                        <p className="text-xs text-neutral-600">
                                            {festival.locationAddress}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Info Card */}
                        <div className="lg:hidden">
                            <FestivalInfoCard festival={festival} />
                        </div>

                        {/* Tabs & Content */}
                        <div className="space-y-6">
                            <EventTabs
                                tabs={TABS}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
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
                                                className="html-content whitespace-pre-line break-words leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: festival.description }}
                                            />
                                        ) : (
                                            <p>No description available.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Competitions */}
                                <section id="competitions" className="scroll-mt-24">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground poppins">
                                            Competitions
                                        </h2>
                                        <Badge variant="secondary" className="rounded-full px-3">{hackathons.length}</Badge>
                                    </div>

                                    {hackathons.length > 0 ? (
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            {hackathons.map((hackathon: any) => (
                                                <Link
                                                    key={hackathon.id}
                                                    href={`/hackathons/${hackathon.slug}`}
                                                    className="group relative flex flex-col bg-card border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                                                >
                                                    <div className="aspect-[16/9] w-full bg-neutral-100 relative overflow-hidden">
                                                        {hackathon.bannerImageUrl ? (
                                                            <Image
                                                                src={hackathon.bannerImageUrl}
                                                                alt={hackathon.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Trophy className="h-12 w-12 text-neutral-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                                            {hackathon.name}
                                                        </h3>
                                                        <div className="mt-auto pt-3 flex items-center text-sm text-neutral-500 gap-4 border-t border-neutral-100">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {format(new Date(hackathon.startDate), "MMM d")}
                                                            </div>
                                                            <div className="ml-auto text-primary text-xs font-medium">View Details &rarr;</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-neutral-500 italic">No competitions listed yet.</div>
                                    )}
                                </section>

                                {/* Events */}
                                <section id="events" className="scroll-mt-24">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground poppins">
                                            Events
                                        </h2>
                                        <Badge variant="secondary" className="rounded-full px-3">{events.length}</Badge>
                                    </div>

                                    {events.length > 0 ? (
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            {events.map((event: any) => (
                                                <Link
                                                    key={event.id}
                                                    href={`/events/${event.slug}`}
                                                    className="group relative flex flex-col bg-card border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                                                >
                                                    <div className="aspect-[16/9] w-full bg-neutral-100 relative overflow-hidden">
                                                        {event.thumbnailUrl || event.bannerImageUrl ? (
                                                            <Image
                                                                src={event.thumbnailUrl || event.bannerImageUrl}
                                                                alt={event.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Ticket className="h-12 w-12 text-neutral-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                                            {event.name}
                                                        </h3>
                                                        <div className="mt-auto pt-3 flex items-center text-sm text-neutral-500 gap-4 border-t border-neutral-100">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {format(new Date(event.startDate), "MMM d")}
                                                            </div>
                                                            <div className="ml-auto text-primary text-xs font-medium">View Details &rarr;</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-neutral-500 italic">No events listed yet.</div>
                                    )}
                                </section>

                                {/* Contact Details (Mobile Target) */}
                                <div id="contact-details-mobile" className="scroll-mt-24 lg:hidden">
                                    {/* This is targeted by the tab on mobile. 
                       The content is actually the FestivalInfoCard shown above in mobile view.
                       We can scroll to that, or just leave this as an anchor.
                       Since the tabs sticky header might cover the top of the section, 
                       we need this anchor to be positioned correctly relative to the mobile card.
                       However, the mobile card is at the top (under banner). 
                       If user clicks Contact Details on mobile, they might expect to jump to top?
                       Or maybe we should duplicate the contact info here?
                       Let's duplicate the organizer info here for clarity if they scroll down.
                   */}
                                    <h3 className="text-xl font-semibold text-neutral-800 mb-4 mt-8">Contact Details</h3>
                                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                                        <p className="text-sm text-neutral-600 mb-2">
                                            For questions, please contact the organizer.
                                        </p>
                                        <div className="flex items-center gap-3 mt-4">
                                            {festival.organizationLogoUrl ? (
                                                <Image
                                                    src={festival.organizationLogoUrl}
                                                    alt={festival.organizationName || "Organizer"}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full w-10 h-10 object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-500">
                                                    {festival.organizationName?.charAt(0) || "?"}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sm text-neutral-900">{festival.organizationName || "OppSkills"}</p>
                                                {festival.websiteUrl && (
                                                    <Link href={festival.websiteUrl} target="_blank" className="text-xs text-primary hover:underline">
                                                        Visit Website
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
