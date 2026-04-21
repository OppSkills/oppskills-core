"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { EventTabs } from "./EventTabs";
import { RegistrationModal } from "@/app/hackathons/[slug]/_components/RegistrationModal";
import { EventSidebar } from "./EventSidebar";
import { EventDetails } from "./types";
import Image from "next/image";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import { format, isSameDay, isSameYear } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  checkMyRegistration,
  submitMissingRegistrationAnswers,
} from "@/lib/api/eventApi";
import { withRetry } from "@/lib/utils/retry";
import {
  readPendingEventRegistration,
  clearPendingEventRegistration,
} from "@/lib/registration/pendingHackathonRegistration";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Razorpay global type
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Types derived from what API returns (approximate based on usage)
// In a real app we'd import full types
type EventData = any; // We'll let it be any for now to avoid huge type duplication

interface EventDetailsClientProps {
  event: EventData; // Hydrated from server
}

/**
 * Get initials from a name for avatar fallback.
 */
function getInitials(
  firstName: string | null,
  lastName: string | null,
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

export default function EventDetailsClient({ event }: EventDetailsClientProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { openSignIn, user } = useClerk();

  // We rely on initial passed 'event' mostly, but we could re-fetch dynamically if needed
  // For now, let's just use the server passed event as initial data
  // Assuming the page handles 404/loading so we always get an event here

  const [activeTab, setActiveTab] = useState("About Event");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>("standard");

  // Fetch registration status if logged in
  const {
    data: registrationStatus,
    refetch: refetchRegistrationStatus,
    isPending: isRegistrationStatusPending,
  } = useQuery({
    queryKey: ["event-registration-status", event?.id, user?.id],
    enabled: !!event?.id && !!user?.id && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !event?.id) return null;
      return checkMyRegistration(token, event.id);
    },
  });

  const isPaidButIncomplete = !!registrationStatus?.isPaidButIncomplete;

  const eventRecoveryTriedRef = useRef(false);

  useEffect(() => {
    if (eventRecoveryTriedRef.current) return;
    if (!isSignedIn || !event?.id || !event?.slug || !user?.id) return;
    if (!registrationStatus?.isPaidButIncomplete) return;

    const pending = readPendingEventRegistration(event.slug);
    if (!pending || pending.userId !== user.id || !pending.answers?.length) {
      return;
    }

    eventRecoveryTriedRef.current = true;

    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          eventRecoveryTriedRef.current = false;
          return;
        }
        await withRetry(() =>
          submitMissingRegistrationAnswers(token, event.id, pending.answers),
        );
        clearPendingEventRegistration(event.slug);
        toast.success("Your registration form was saved.");
        await refetchRegistrationStatus();
      } catch (e) {
        eventRecoveryTriedRef.current = false;
        console.error("Event pending registration recovery failed:", e);
        toast.error(
          getApiErrorMessage(
            e,
            "Could not restore your registration. Try again from the event page.",
          ),
        );
      }
    })();
  }, [
    isSignedIn,
    event?.id,
    event?.slug,
    user?.id,
    registrationStatus?.isPaidButIncomplete,
    getToken,
    refetchRegistrationStatus,
  ]);

  const TABS = [
    "About Event",
    "Contact Details"
  ];

  const handleRegistration = async () => {
    if (!event) return;

    if (!isSignedIn) {
      openSignIn({
        fallbackRedirectUrl: window.location.href,
        signUpFallbackRedirectUrl: window.location.href,
      });
      return;
    }

    if (registrationStatus?.isRegistered) {
      return;
    }

    setIsModalOpen(true);
  };


  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const sameDay = isSameDay(startDate, endDate);

  // Events with TBA dates
  const TBA_EVENT_IDS = new Set<string>([]);
  const isDateTBA = TBA_EVENT_IDS.has(event.id);

  // Format date display
  let formattedDate: string;
  if (isDateTBA) {
    formattedDate = "To Be Announced";
  } else if (sameDay) {
    formattedDate = format(startDate, "EEEE, d MMM yyyy");
  } else {
    // Check if same year
    if (isSameYear(startDate, endDate)) {
      formattedDate = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    } else {
      formattedDate = `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
  }

  const formattedTime = isDateTBA ? "" : format(startDate, "h:mm a") + " Onwards";
  const monthShort = isDateTBA ? "TBA" : format(startDate, "MMM");
  const dayNum = isDateTBA ? "—" : format(startDate, "dd");

  const { venueName, venueAddress } = formatLocation(event);

  const tickets = [
    {
      id: "standard",
      name: event.isFree ? "Free Entry" : "Standard Ticket",
      // Coerce entry fee to number to avoid runtime issues in calculations
      price: event.isFree
        ? 0
        : typeof event.entryFeeAmount === "number"
          ? event.entryFeeAmount
          : Number(event.entryFeeAmount ?? 0) || 0,
      description: "Don’t miss out, FOMO is real! 🚀",
    },
  ];

  const cardUser = user
    ? {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar: user.imageUrl,
    }
    : undefined;


  const sidebarEvent: EventDetails = {
    id: event.id,
    slug: event.slug,
    title: event.name,
    thumbnail: ensureAbsoluteUrl(event.bannerImageUrl) || "",
    date: formattedDate,
    time: formattedTime,
    venueName: venueName,
    venueAddress: venueAddress,
    startDate: event.startDate,
    endDate: event.endDate,
    tickets: tickets,
    about: event.description || "",
    contact: {
      email: event.contactEmail || event.owner?.email || "",
      phone: event.contactPhone || "",
    },
    speakers: [], // Map if needed
    organizers: [], // Map if needed
    registrationCount: event.registrationCount,
    createdAt: event.createdAt,
    festival: event.festival,
    registrationDeadline: event.registrationDeadline,
    currency: event.currency || "INR",
    impressions: event.impressions,
    teamSize: event.isRecruitmentEvent ? "Recruitment" : "Individual", // Customize as needed
  };

  return (
    <div className="min-h-screen bg-transparent lg:pt-8 pb-8 font-sans">
      {/* Load Razorpay SDK for paid events */}
      {!event.isFree && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
      )}

      {/* Main Container - Full width with padding, no max-w constraint */}
      <div className="w-full px-0 sm:px-8 md:px-12 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

          {/* LEFT COLUMN: Sidebar (Like Hackathons) */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl">
            <EventSidebar
              event={sidebarEvent}
              onRegister={handleRegistration}
              isCheckingRegistration={
                isSignedIn && !!user?.id && isRegistrationStatusPending
              }
              isRegistered={!!registrationStatus?.isRegistered}
              needsCompleteRegistration={
                !!registrationStatus?.isPaidButIncomplete
              }
            />

            {/* Contact Details (Hidden on desktop because it's usually in about or we can keep it here if sidebar is too long) */}
            <div id="contact-details-desktop" className="scroll-mt-24 hidden lg:block">
              {/* Optional: Add anything else here if needed */}
            </div>
          </div>

          {/* RIGHT COLUMN: Info, Action, Content */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-8 order-1 lg:order-2 px-2 sm:px-0 flex flex-col">
            {/* Title (Matches CompetitionDetails Client style) */}
            <h1 className="hidden lg:block text-neutral-900 text-3xl font-semibold px-1 pl-4 mb-2 break-all line-clamp-2">
              {event.name}
            </h1>

            <div className="space-y-6">
              <EventTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title={event.name}
                slug={event.slug}
              />

              <div className="space-y-8">
                <section id="about-event" className="scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                    About Event
                  </h2>
                  <div className="ProseMirror max-w-none text-neutral-600 inter">
                    {event.description ? (
                      <div
                        className="html-content whitespace-pre-line wrap-break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    ) : (
                      <p>No description available.</p>
                    )}
                  </div>

                  {event.isRecruitmentEvent && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      This is a recruitment event. Registrants may be contacted for opportunities.
                    </div>
                  )}
                </section>

                <section id="prizes" className="scroll-mt-24">
                  {event.prizeBreakdown && event.prizeBreakdown.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                        Prizes
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {event.prizeBreakdown.map((prize: any) => (
                          <div
                            key={prize.id}
                            className="p-4 border border-neutral-200 rounded-xl hover:border-purple-200 transition-colors bg-white"
                          >
                            <h4 className="font-bold text-foreground">
                              {prize.position}
                            </h4>
                            <p className="text-xl font-bold text-primary mt-1">
                              {event.currency} {prize.amount.toLocaleString()}
                            </p>
                            {prize.description && (
                              <p className="text-sm text-neutral-500 mt-2 wrap-break-word">
                                {prize.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Placeholder for Speaker Tab if we add it */}
              </div>
            </div>

            {/* Contact Details Section (Always visible, at the bottom of main content) */}
            <section id="contact-details" className="scroll-mt-24 space-y-6 pt-10">
              <h2 className="text-2xl font-bold text-foreground poppins">
                Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Owner / Organizer */}
                <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4 hover:border-purple-200 transition-colors">
                  {event.owner.imageUrl ? (
                    <Image
                      src={ensureAbsoluteUrl(event.owner.imageUrl)}
                      alt={`${event.owner.firstName || ""} ${event.owner.lastName || ""}`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg shrink-0">
                      {getInitials(event.owner.firstName, event.owner.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mb-0.5">
                      Organizer
                    </p>
                    <h4 className="font-bold text-foreground truncate">
                      {(() => {
                        const orgName =
                          event?.organizationName ?? event?.organization_name;
                        const ownerName = [event?.owner?.firstName, event?.owner?.lastName]
                          .filter(Boolean)
                          .join(" ");
                        return orgName || ownerName || "Organizer";
                      })()}
                    </h4>
                    {event.owner.email && (
                      <p className="text-xs text-neutral-500 truncate">{event.owner.email}</p>
                    )}
                  </div>
                </div>

                {/* Designated contact from Additional info (saved as contactName / contactEmail / contactPhone) */}
                {(() => {
                  const name = typeof event.contactName === "string" ? event.contactName.trim() : "";
                  const email = typeof event.contactEmail === "string" ? event.contactEmail.trim() : "";
                  const phone = typeof event.contactPhone === "string" ? event.contactPhone.trim() : "";
                  const hasContact = Boolean(name || email || phone);
                  if (!hasContact) return null;
                  return (
                    <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4 hover:border-purple-200 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg shrink-0">
                        {(name.charAt(0) || email.charAt(0) || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mb-0.5">
                          Event contact
                        </p>
                        <h4 className="font-bold text-foreground truncate">
                          {name || "Contact"}
                        </h4>
                        {phone ? (
                          <p className="text-xs text-neutral-500 truncate">{phone}</p>
                        ) : null}
                        {email ? (
                          <p className="text-xs text-neutral-500 truncate">{email}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        competition={event}
        type="EVENT"
        completionMode={!!registrationStatus?.isPaidButIncomplete}
        onSuccess={async () => {
          await refetchRegistrationStatus();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
