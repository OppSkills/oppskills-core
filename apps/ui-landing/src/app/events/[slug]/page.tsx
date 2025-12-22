"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventRegistrationCard } from "./_components/EventRegistrationCard";
import { EventTabs } from "./_components/EventTabs";
import { EventRegistrationModal, RegistrationField, UserDataForPrefill } from "./_components/EventRegistrationModal";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePublicEventBySlug } from "@/hooks/usePublicEventBySlug";
import { useAuth, useClerk } from "@clerk/nextjs";
import { joinEvent, checkMyRegistration } from "@/lib/api/eventApi";
import { getMe } from "@/lib/api/usersApi";
import { useQuery } from "@tanstack/react-query";

/**
 * Get initials from a name for avatar fallback.
 */
function getInitials(firstName: string | null, lastName: string | null): string {
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

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { isSignedIn, getToken } = useAuth();
  const { openSignIn, user } = useClerk();

  const { data: event, isLoading, error, refetch } = usePublicEventBySlug(slug);

  const [activeTab, setActiveTab] = useState("About Event");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userDataForPrefill, setUserDataForPrefill] = useState<UserDataForPrefill | undefined>(undefined);

  // Fetch registration status if logged in
  const { data: registrationStatus, refetch: refetchRegistrationStatus } = useQuery({
    queryKey: ["event-registration-status", event?.id, user?.id],
    enabled: !!event?.id && !!user?.id && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !event?.id) return null;
      return checkMyRegistration(token, event.id);
    },
  });

  const isUserRegistered = !!registrationStatus?.isRegistered;

  const TABS = ["About Event", "Contact Details"];

  const handleRegistration = async () => {
    if (!event) return;

    // If not signed in, open Clerk sign-in modal
    if (!isSignedIn) {
      openSignIn({
        afterSignInUrl: window.location.href,
        afterSignUpUrl: window.location.href,
      });
      return;
    }

    // Check if user is onboarded
    setIsCheckingOnboarding(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to register.");
        return;
      }

      const meData = await getMe(token);
      
      if (!meData.onboarded) {
        // User not onboarded - redirect to onboarding with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        router.push(`/onboarding?returnUrl=${returnUrl}`);
        return;
      }

      // Build prefill data from user profile and onboarding data
      const onboardingProfile = meData.onboardingProfile;
      const fullName = [meData.firstName, meData.lastName].filter(Boolean).join(" ") || undefined;
      
      const prefillData: UserDataForPrefill = {
        name: fullName,
        email: meData.email,
        phone: user?.primaryPhoneNumber?.phoneNumber,
        gender: onboardingProfile?.gender,
        // Note: College name would need to be added to the backend response
        // Currently only collegeId is available
      };
      
      setUserDataForPrefill(prefillData);

      // User is onboarded - proceed with registration
      const hasFields = event.registrationForm && event.registrationForm.fields.length > 0;
      if (hasFields) {
        setIsModalOpen(true);
      } else {
        // No registration form - join directly
        handleJoinEvent([]);
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleJoinEvent = async (
    answers: Array<{ fieldId: string; value: string | number | string[] }>
  ) => {
    if (!event) return;

    setIsRegistering(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to register.");
        return;
      }

      await joinEvent(token, event.id, { answers });
      
      toast.success("Successfully registered for the event!");
      setIsModalOpen(false);
      // Refetch both event details and registration status
      refetch();
      await refetchRegistrationStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register. Please try again.";
      // Check for axios error response
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          toast.error(axiosErr.response.data.message);
          return;
        }
      }
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
        <p className="text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

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

  // Default to first ticket
  const effectiveSelectedTicketId = selectedTicketId ?? tickets[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-transparent py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* TOP HEADER SECTION */}
        <div className="mb-8">
          {/* Festival badge if applicable */}
          {event.festival && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-normal text-muted-foreground">
                  Featured in
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {event.festival.name}
                </span>
                <span className="text-zinc-400">&gt;</span>
              </div>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6 poppins tracking-tight">
            {event.name}
          </h1>

          <div className="flex flex-wrap gap-6 md:gap-12">
            {/* Date Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase text-zinc-500 font-medium leading-none mb-0.5">
                  {monthShort}
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {dayNum}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                  {formattedDate}
                </h4>
                <p className="text-sm text-zinc-500">{formattedTime}</p>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                  {venueName}
                </h4>
                <p className="text-sm text-zinc-500">{venueAddress}</p>
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
                <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 inter">
                  {event.description ? (
                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
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
                  <div className="p-4 bg-[#FDF2FF] dark:bg-[#3E1A45]/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-4">
                    {event.owner.imageUrl ? (
                      <Image
                        src={event.owner.imageUrl}
                        alt={`${event.owner.firstName || ""} ${event.owner.lastName || ""}`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {getInitials(event.owner.firstName, event.owner.lastName)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground">
                        {event.owner.firstName || ""} {event.owner.lastName || "Organizer"}
                      </h4>
                      {event.contactPhone && (
                        <p className="text-xs text-zinc-500">{event.contactPhone}</p>
                      )}
                      {event.contactEmail && (
                        <p className="text-xs text-zinc-500">
                          {event.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact person card (if different from owner) */}
                  {event.contactName && (
                    <div className="p-4 bg-[#FDF2FF] dark:bg-[#3E1A45]/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {event.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{event.contactName}</h4>
                        {event.contactPhone && (
                          <p className="text-xs text-zinc-500">{event.contactPhone}</p>
                        )}
                        {event.contactEmail && (
                          <p className="text-xs text-zinc-500">{event.contactEmail}</p>
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
                        className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                      >
                        <h4 className="font-bold text-foreground">{prize.position}</h4>
                        <p className="text-xl font-bold text-primary">
                          {event.currency} {prize.amount.toLocaleString()}
                        </p>
                        {prize.description && (
                          <p className="text-sm text-zinc-500 mt-2">{prize.description}</p>
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
              selectedTicketId={effectiveSelectedTicketId}
              onSelectTicket={setSelectedTicketId}
              onRegister={handleRegistration}
              isRegistering={isRegistering || isCheckingOnboarding}
              isRegistered={isUserRegistered}
              user={user ? {
                name: user.firstName ?? user.username ?? "User",
                email: user.primaryEmailAddress?.emailAddress ?? "",
                avatar: user.imageUrl ?? "",
              } : undefined}
            />
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleJoinEvent}
        fields={(event?.registrationForm?.fields ?? []) as RegistrationField[]}
        eventName={event?.name ?? ""}
        isSubmitting={isRegistering}
        userData={userDataForPrefill}
      />
    </div>
  );
}
