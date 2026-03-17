"use client";
import { format } from "date-fns";
import { MapPin, Users, Sparkles, IconNode, LucideIcon } from "lucide-react";

interface FestivalInfoCardProps {
    festival: {
        startDate: string;
        endDate: string;
        locationAddress?: string | null;
        locationCity: string | null;
        locationVirtualLink: string | null;
        websiteUrl: string | null;
        organizationName: string | null;
        organizationLogoUrl: string | null;
        organizer?: {
            firstName: string | null;
            lastName: string | null;
            email?: string | null;
        };
        totalImpressions?: number;
        totalRegistrations?: number;
    };
}

export function FestivalInfoCard({ festival }: FestivalInfoCardProps) {
    const organizerName =
        festival.organizationName ||
        `${festival.organizer?.firstName || ''} ${festival.organizer?.lastName || ''}`.trim() ||
        "OppSkills Organizer";

    const formattedLongDate = format(new Date(festival.startDate), "EEEE, d MMMM yyyy");
    const timeRange = `${format(new Date(festival.startDate), "H:mm")} - ${format(new Date(festival.endDate), "H:mm")} GMT+5:30`;
    const StatsCompo = ({ Icon, value, label }: { Icon: LucideIcon, value: string | number, label: string }) => <div className="flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-800">
            <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
            <span className="text-xl font-semibold text-neutral-800 leading-tight">
                {value}
            </span>
            <span className="text-sm text-neutral-600">{label}</span>
        </div>
    </div>
    return (
        <div className="w-full space-y-4 font-sans">
            {/* Stats: Impressions */}
            <StatsCompo Icon={Sparkles} value={festival.totalImpressions?.toLocaleString() || 0} label="Impressions" />

            {/* Stats: Registrations */}
            <StatsCompo Icon={Users} value={festival.totalRegistrations || 0} label="Registrations" />

            {/* Date */}
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-white border border-neutral-200 shadow-sm flex flex-col items-center justify-center overflow-hidden">
                    <div className="bg-[#E5E7EB] w-full text-[10px] text-center py-0.5 text-neutral-600 font-bold uppercase tracking-tighter">
                        {format(new Date(festival.startDate), "MMM")}
                    </div>
                    <div className="text-lg font-bold text-neutral-900 leading-none py-1">
                        {format(new Date(festival.startDate), "d")}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-neutral-800 leading-tight">
                        {formattedLongDate}
                    </span>
                    <span className="text-xs text-neutral-600">{timeRange}</span>
                </div>
            </div>

            {/* Location */}
            {festival.locationAddress &&
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-600">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold text-neutral-900 leading-tight truncate max-w-[200px]">
                            {festival.locationAddress || "College/University Name"}
                        </span>
                    </div>
                </div>
            }

            {/* Contact Details Section */}
            <div className="pt-4 space-y-4">
                <h3 className="text-2xl font-semibold text-neutral-900">Contact Details</h3>

                {/* Contact Card 1 */}
                <div className="bg-primary-100 rounded-3xl border-[0.5px] border-primary-500 p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-[60px] w-[60px] shrink-0 rounded-full bg-[#1F1D2B] flex items-center justify-center text-white text-xl font-bold">
                        {organizerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-lg text-neutral-900 truncate">
                            {organizerName}
                        </h4>
                        {festival.organizer?.email && (
                            <p className="text-neutral-700 text-xs truncate font-medium">
                                {festival.organizer.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Optional: Second Contact Card if more data is available, for now just follow the image's "format" */}
                {/* 
                <div className="bg-[#F5F3FF] rounded-[24px] border border-[#DDD6FE] p-6 flex items-center gap-4 shadow-sm">
                    <div className="h-[60px] w-[60px] shrink-0 rounded-full bg-[#1F1D2B] flex items-center justify-center text-white text-xl font-bold">
                        TM
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-xl text-neutral-900 truncate">Owner Name</h4>
                        <p className="text-neutral-500 text-sm mt-1 font-medium">+91 99999 99999</p>
                        <p className="text-neutral-400 text-sm truncate font-medium">Emailoftheperson@gmail.com</p>
                    </div>
                </div>
                */}
            </div>
        </div>
    );
}
