"use client";

import React, { useState } from "react";
import { EventRegistrationCard } from "@/app/events/[slug]/_components/EventRegistrationCard";
import { EventTabs } from "@/app/events/[slug]/_components/EventTabs";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useEventBySlug } from "@/hooks/useEventBySlug";

// Re-export of internal types for mapping
interface EventData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  visibility: string;
  eventType: string | null;
  registrationCount: number;
  maxUsers: number | null;
  registrationDeadline: string | null;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  attendeeEligibility: string[];
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
  prizeBreakdown?: Array<{
    id: string;
    position: string;
    amount: number;
    description: string | null;
  }>;
}

/**
 * Get initials from a name for avatar fallback.
 */
function getInitials(
  firstName: string | null,
  lastName: string | null
): string {
  const first = (firstName ?? "").trim().charAt(0).toUpperCase();
  const last = (lastName ?? "").trim().charAt(0).toUpperCase();
  return first + last || "??";
}

/**
 * Format the location display from event data.
 */
function formatLocation(event: {
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
}): { venueName: string; venueAddress: string } {
  if (event.locationType === "VIRTUAL" || event.locationType === "ONLINE") {
    return {
      venueName: "Virtual Event",
      venueAddress: event.locationVirtualLink || "Online",
    };
  }

  return {
    venueName: event.locationAddress || "TBA",
    venueAddress: event.locationCity || "",
  };
}

/**
 * Type guard for checking if value is a record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface EventPreviewProps {
  slug: string;
}

/**
 * Event Preview Component
 * Used in the edit-event dashboard to show a preview of how the event will look.
 */
export function EventPreview({ slug }: EventPreviewProps) {
  const { data: eventRaw, isLoading, error } = useEventBySlug(slug);

  const [activeTab, setActiveTab] = useState("About Event");

  const TABS = ["About Event", "Contact Details"];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !eventRaw) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold text-foreground">
          Preview Unavailable
        </h1>
        <p className="text-muted-foreground">
          Unable to load event preview. Please save your changes and try again.
        </p>
      </div>
    );
  }

  // Map the raw data to typed structure
  const event = eventRaw as unknown as EventData;

  // Format dates
  const startDate = new Date(event.startDate);
  const formattedDate = format(startDate, "EEEE, d MMM yyyy");
  const formattedTime = format(startDate, "h:mm a") + " Onwards";
  const monthShort = format(startDate, "MMM");
  const dayNum = format(startDate, "dd");

  // Location info
  const { venueName, venueAddress } = formatLocation(event);

  // Build tickets array for registration card
  const tickets = [
    {
      id: "standard",
      name: event.isFree ? "Free Entry" : "Standard Ticket",
      price: event.isFree ? 0 : (event.entryFeeAmount ?? 0),
      description: event.description || "Join this amazing event!",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* TOP HEADER SECTION */}
        <div className="mb-8">
          {/* Festival badge if applicable */}
          {event.festival && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100  rounded-full text-xs text-neutral-600 ">
                <span className="font-normal text-muted-foreground">
                  Featured in
                </span>
                <span className="font-semibold text-neutral-900 ">
                  {event.festival.name}
                </span>
                <span className="text-neutral-400">&gt;</span>
              </div>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6 poppins tracking-tight">
            {event.name}
          </h1>

          <div className="flex flex-wrap gap-6 md:gap-12">
            {/* Date Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                  {monthShort}
                </span>
                <span className="text-lg font-bold text-neutral-900  leading-none">
                  {dayNum}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900  text-[15px]">
                  {formattedDate}
                </h4>
                <p className="text-sm text-neutral-500">{formattedTime}</p>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <MapPin className="w-5 h-5 text-neutral-700 " />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900  text-[15px]">
                  {venueName}
                </h4>
                <p className="text-sm text-neutral-500">{venueAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          {/* Left Column: Image, Tabs, Content */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-8">
            {/* Thumbnail */}
            {event.bannerImageUrl && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm">
                <Image
                  src={event.bannerImageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Tabs */}
            <EventTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Scrollable Content Sections */}
            <div className="space-y-16">
              {/* ABOUT SECTION */}
              <section id="about-event" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                  About Event
                </h2>
                <div className="prose  max-w-none text-neutral-600  inter whitespace-pre-line">
                  {event.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  ) : (
                    <p>No description available.</p>
                  )}
                </div>
              </section>

              {/* CONTACT DETAILS SECTION */}
              <section id="contact-details" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Card */}
                  <div className="p-4 bg-[#FDF2FF]  rounded-xl border border-purple-100  flex items-center gap-4">
                    {event.owner.imageUrl ? (
                      <Image
                        src={event.owner.imageUrl}
                        alt={`${event.owner.firstName || ""} ${event.owner.lastName || ""}`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {getInitials(
                          event.owner.firstName,
                          event.owner.lastName
                        )}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground">
                        {event.owner.firstName || ""}{" "}
                        {event.owner.lastName || "Organizer"}
                      </h4>
                      {event.contactPhone && (
                        <p className="text-xs text-neutral-500">
                          {event.contactPhone}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {event.contactEmail || event.owner.email}
                      </p>
                    </div>
                  </div>

                  {/* Contact person card (if different from owner) */}
                  {event.contactName && (
                    <div className="p-4 bg-[#FDF2FF]  rounded-xl border border-purple-100  flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {event.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {event.contactName}
                        </h4>
                        {event.contactPhone && (
                          <p className="text-xs text-neutral-500">
                            {event.contactPhone}
                          </p>
                        )}
                        {event.contactEmail && (
                          <p className="text-xs text-neutral-500">
                            {event.contactEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* PRIZES SECTION (if any) */}
              {event.prizeBreakdown && event.prizeBreakdown.length > 0 && (
                <section id="prizes" className="scroll-mt-48">
                  <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                    Prizes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.prizeBreakdown.map((prize) => (
                      <div
                        key={prize.id}
                        className="p-4 border border-neutral-200  rounded-xl"
                      >
                        <h4 className="font-bold text-foreground">
                          {prize.position}
                        </h4>
                        <p className="text-xl font-bold text-primary">
                          {event.currency} {prize.amount.toLocaleString()}
                        </p>
                        {prize.description && (
                          <p className="text-sm text-neutral-500 mt-2">
                            {prize.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Right Column: Registration (Sticky) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 order-1 lg:order-2 h-fit">
            <EventRegistrationCard
              tickets={tickets}
              selectedTicketId={tickets[0]?.id ?? null}
              onSelectTicket={() => {}}
              onRegister={() => {}}
              isRegistering={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
