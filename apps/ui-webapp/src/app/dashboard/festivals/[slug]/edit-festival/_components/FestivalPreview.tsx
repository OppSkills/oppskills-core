"use client";

import React, { useState } from "react";
import { format, isSameDay, isSameYear } from "date-fns";
import { MapPin, Users, Sparkles, Link as LinkIcon } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { FestivalFormData } from "../page";
import { EventTabs } from "@/app/events/[slug]/_components/EventTabs";

interface FestivalPreviewProps {
    formData: FestivalFormData;
}

export default function FestivalPreview({ formData }: FestivalPreviewProps) {
    const [activeTab, setActiveTab] = useState("About Festival");
    const TABS = ["About Festival", "Contact Details"];

    const formatDateRange = (start: Date | undefined, end: Date | undefined) => {
        if (!start || !end) return "Dates to be announced";
        if (isSameDay(start, end)) {
            return format(start, "EEE, MMM d, yyyy");
        }
        if (isSameYear(start, end)) {
            return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
        }
        return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
    };

    const normalizeUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        const trimmed = url.trim();
        if (trimmed.length === 0) return undefined;
        if (trimmed.startsWith("http") || trimmed.startsWith("/")) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    const formattedDate = formatDateRange(formData.startDate, formData.endDate);

    const StatsCompo = ({ Icon, value, label, type }: { Icon: any, value: string | number, label: string, type?: "link" }) => (
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-800 bg-white">
                <Icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
                <span className="text-base font-semibold text-neutral-800 leading-tight">
                    {type === "link" ? (
                        <a href={normalizeUrl(value as string)} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium hover:underline">
                            {value}
                        </a>
                    ) : value}
                </span>
                <span className="text-xs text-neutral-600">{label}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-0 bg-transparent py-4 px-0 font-sans">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* LEFT COLUMN: Image & Sidebar Info */}
                    <div className="w-full lg:w-[380px] space-y-6">
                        {/* Banner Image */}
                        {formData.bannerUrl && normalizeUrl(formData.bannerUrl) ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm">
                                <img
                                    src={normalizeUrl(formData.bannerUrl)}
                                    alt={formData.name || "Festival Banner"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center text-muted-foreground">
                                <span className="text-sm">No banner uploaded</span>
                            </div>
                        )}

                        {/* Info Card */}
                        <div className="w-full space-y-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
                            {/* Stats: Impressions */}
                            <StatsCompo Icon={Sparkles} value={0} label="Impressions" />

                            {/* Stats: Registrations */}
                            <StatsCompo Icon={Users} value={0} label="Registrations" />

                            {/* Date */}
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 shrink-0 rounded-xl bg-white border border-neutral-200 shadow-sm flex flex-col items-center justify-center overflow-hidden">
                                    <div className="bg-neutral-100 w-full text-[10px] text-center py-0.5 text-neutral-600 font-bold uppercase tracking-tighter">
                                        {formData.startDate ? format(formData.startDate, "MMM") : "TBD"}
                                    </div>
                                    <div className="text-lg font-bold text-neutral-900 leading-none py-1">
                                        {formData.startDate ? format(formData.startDate, "d") : "-"}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-neutral-800 leading-tight">
                                        {formattedDate}
                                    </span>
                                    <span className="text-xs text-neutral-600">
                                        {formData.startDate ? `${format(formData.startDate, "H:mm")} GMT+5:30` : ""}
                                    </span>
                                </div>
                            </div>

                            {/* Location */}
                            {formData.location && (
                                <StatsCompo Icon={MapPin} value={formData.location} label="Location" />
                            )}

                            {/* Website */}
                            {formData.websiteUrl && (
                                <StatsCompo type="link" Icon={LinkIcon} value={formData.websiteUrl} label="Website" />
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Tabs Content */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-neutral-900 text-3xl md:text-4xl font-bold tracking-tight">
                                    {formData.name || "Untitled Festival"}
                                </h1>
                                <p className="text-sm text-muted-foreground">{formData.organizationName}</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold uppercase tracking-wider border border-neutral-200 text-neutral-700">
                                {formData.status}
                            </span>
                        </div>

                        {/* Tabs */}
                        <EventTabs
                            tabs={TABS}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        {/* Tab Contents */}
                        <div className="space-y-12">
                            {activeTab === "About Festival" && (
                                <section id="about-festival" className="scroll-mt-24">
                                    <h2 className="text-2xl font-bold mb-4 text-neutral-900">
                                        About Festival
                                    </h2>
                                    <div className="prose max-w-none text-neutral-600 leading-relaxed">
                                        {formData.description ? (
                                            <div
                                                className="html-content whitespace-pre-line wrap-break-word"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(formData.description),
                                                }}
                                            />
                                        ) : (
                                            <p className="italic text-muted-foreground">No description available.</p>
                                        )}
                                    </div>
                                </section>
                            )}

                            {activeTab === "Contact Details" && (
                                <section id="contact-details" className="scroll-mt-24 space-y-6">
                                    <h2 className="text-2xl font-bold text-neutral-900">
                                        Contact Details
                                    </h2>
                                    <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                                        {formData.organizationLogoUrl && normalizeUrl(formData.organizationLogoUrl) ? (
                                            <div className="h-16 w-16 overflow-hidden rounded-full border border-neutral-200 shadow-sm shrink-0">
                                                <img
                                                    src={normalizeUrl(formData.organizationLogoUrl)}
                                                    alt={formData.organizationName || "Organizer"}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xl font-bold border border-neutral-200 shrink-0">
                                                {(formData.organizationName || "O").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-lg text-neutral-900">
                                                {formData.organizationName || "OppSkills Organizer"}
                                            </p>
                                            <p className="text-neutral-500 font-medium text-sm">
                                                {formData.contactEmail || "Contact directly via website"}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
