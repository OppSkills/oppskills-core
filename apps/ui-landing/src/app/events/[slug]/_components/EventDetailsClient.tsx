"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EventRegistrationCard } from "./EventRegistrationCard";
import { EventTabs } from "./EventTabs";
import {
  EventRegistrationModal,
  RegistrationField,
  UserDataForPrefill,
} from "./EventRegistrationModal";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { useAuth, useClerk } from "@clerk/nextjs";
import { joinEvent, checkMyRegistration } from "@/lib/api/eventApi";
import { getMe } from "@/lib/api/usersApi";
import { useQuery } from "@tanstack/react-query";

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
 * User category values
 */
type UserCategory =
  | "SCHOOL_STUDENT"
  | "COLLEGE_STUDENT"
  | "WORKING_PROFESSIONAL"
  | "FRESHER"
  | "PROFESSIONAL_SCHOOL_STUDENT";

function buildDefaultFields(userCategory?: string): RegistrationField[] {
  const fields: RegistrationField[] = [
    {
      id: "default-name",
      label: "Name",
      type: "TEXT",
      required: true,
      order: -50,
      options: [],
      placeholder: "Your full name",
    },
    {
      id: "default-email",
      label: "Email",
      type: "EMAIL",
      required: true,
      order: -40,
      options: [],
      placeholder: "email@example.com",
    },
    {
      id: "default-phone",
      label: "Phone No.",
      type: "PHONE_NO",
      required: true,
      order: -30,
      options: [],
      placeholder: "+91 XXXXX XXXXX",
    },
    {
      id: "default-gender",
      label: "Gender",
      type: "OPTIONS",
      required: true,
      order: -20,
      options: [],
      placeholder: "Select gender",
    },
  ];

  const category = userCategory as UserCategory | undefined;

  if (category === "SCHOOL_STUDENT") {
    fields.push({
      id: "default-school-name",
      label: "School Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your school name",
    });
  } else if (
    category === "COLLEGE_STUDENT" ||
    category === "PROFESSIONAL_SCHOOL_STUDENT" ||
    category === "FRESHER"
  ) {
    fields.push({
      id: "default-college-name",
      label: "College Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your college name",
    });
  } else if (category === "WORKING_PROFESSIONAL") {
    fields.push({
      id: "default-company-name",
      label: "Company Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your company name",
    });
  } else {
    fields.push({
      id: "default-college-name",
      label: "College Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your college/institution name",
    });
  }

  return fields;
}

function mergeDefaultAndCustomFields(
  customFields: RegistrationField[] | undefined,
  userCategory?: string
): RegistrationField[] {
  const defaults = buildDefaultFields(userCategory);
  const customs = customFields ?? [];

  const defaultLabels = new Set(defaults.map((f) => f.label.toLowerCase()));

  // Also filter out all identity fields (school/college/company) from custom fields
  // since we add the appropriate one based on userCategory
  const identityFieldLabels = new Set([
    "school name",
    "college name",
    "company name",
  ]);

  const filteredCustoms = customs.filter(
    (f) =>
      !defaultLabels.has(f.label.toLowerCase()) &&
      !identityFieldLabels.has(f.label.toLowerCase())
  );

  return [...defaults, ...filteredCustoms].sort((a, b) => a.order - b.order);
}

export default function EventDetailsClient({ event }: EventDetailsClientProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { openSignIn, user } = useClerk();

  // We rely on initial passed 'event' mostly, but we could re-fetch dynamically if needed
  // For now, let's just use the server passed event as initial data
  // Assuming the page handles 404/loading so we always get an event here

  const [activeTab, setActiveTab] = useState("About Event");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userDataForPrefill, setUserDataForPrefill] = useState<
    UserDataForPrefill | undefined
  >(undefined);
  const [registrationFields, setRegistrationFields] = useState<
    RegistrationField[]
  >([]);

  // Fetch registration status if logged in
  const { data: registrationStatus, refetch: refetchRegistrationStatus } =
    useQuery({
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

    if (!isSignedIn) {
      openSignIn({
        fallbackRedirectUrl: window.location.href,
        signUpFallbackRedirectUrl: window.location.href,
      });
      return;
    }

    setIsCheckingOnboarding(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to register.");
        return;
      }

      const meData = await getMe(token);

      if (!meData.onboarded) {
        const returnUrl = encodeURIComponent(window.location.href);
        router.push(`/onboarding?returnUrl=${returnUrl}`);
        return;
      }

      const onboardingProfile = meData.onboardingProfile;
      const fullName =
        [meData.firstName, meData.lastName].filter(Boolean).join(" ") ||
        undefined;

      const prefillData: UserDataForPrefill = {
        name: fullName,
        email: meData.email ?? undefined,
        phone: user?.primaryPhoneNumber?.phoneNumber,
        gender: onboardingProfile?.gender,
        collegeName: onboardingProfile?.college?.name ?? undefined,
        companyName: onboardingProfile?.companyName ?? undefined,
        schoolName: onboardingProfile?.schoolName ?? undefined,
      };

      setUserDataForPrefill(prefillData);

      const customFields = (event.registrationForm?.fields ??
        []) as RegistrationField[];
      const mergedFields = mergeDefaultAndCustomFields(
        customFields,
        onboardingProfile?.userCategory
      );

      setRegistrationFields(mergedFields);
      setIsModalOpen(true);
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
      await refetchRegistrationStatus();
      // Optionally refresh the page to update attendee count if server rendered
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to register. Please try again.";
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

  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  // Use date-fns functions for reliable date comparison
  const isSameDay =
    formatInTimeZone(startDate, "UTC", "yyyy-MM-dd") ===
    formatInTimeZone(endDate, "UTC", "yyyy-MM-dd");

  // Format date display
  let formattedDate: string;
  if (isSameDay) {
    formattedDate = formatInTimeZone(startDate, "UTC", "EEEE, d MMM yyyy");
  } else {
    // Check if same month and year
    const isSameMonth =
      formatInTimeZone(startDate, "UTC", "yyyy-MM") ===
      formatInTimeZone(endDate, "UTC", "yyyy-MM");

    if (isSameMonth) {
      // e.g., "10-12 March 2026"
      const startDay = formatInTimeZone(startDate, "UTC", "d");
      const endDay = formatInTimeZone(endDate, "UTC", "d");
      const monthYear = formatInTimeZone(endDate, "UTC", "MMMM yyyy");
      formattedDate = `${startDay}-${endDay} ${monthYear}`;
    } else {
      // Different months, e.g., "30 Jan - 2 Feb 2026"
      const startFormatted = formatInTimeZone(startDate, "UTC", "d MMM");
      const endFormatted = formatInTimeZone(endDate, "UTC", "d MMM yyyy");
      formattedDate = `${startFormatted} - ${endFormatted}`;
    }
  }

  const formattedTime =
    formatInTimeZone(startDate, "UTC", "h:mm a") + " Onwards";
  const monthShort = formatInTimeZone(startDate, "UTC", "MMM");
  const dayNum = formatInTimeZone(startDate, "UTC", "dd");

  const { venueName, venueAddress } = formatLocation(event);

  const tickets = [
    {
      id: "standard",
      name: event.isFree ? "Free Entry" : "Standard Ticket",
      price: event.isFree ? 0 : (event.entryFeeAmount ?? 0),
      description: event.description || "Join this amazing event!",
    },
  ];

  const effectiveSelectedTicketId = selectedTicketId ?? tickets[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-transparent py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* TOP HEADER SECTION */}
        <div className="mb-8">
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
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-8">
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

            <EventTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="space-y-16">
              <section id="about-event" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                  About Event
                </h2>
                <div className="prose  max-w-none text-neutral-600  inter">
                  {event.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  ) : (
                    <p>No description available.</p>
                  )}
                </div>
              </section>

              <section id="contact-details" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FDF2FF]  rounded-xl border border-purple-100  flex items-center gap-4">
                    {event.owner.imageUrl ? (
                      <Image
                        src={event.owner.imageUrl}
                        alt={`${event.owner.firstName || ""} ${
                          event.owner.lastName || ""
                        }`}
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
                      {event.owner.email && (
                        <p className="text-xs text-neutral-500">
                          {event.owner.email}
                        </p>
                      )}
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

              {event.prizeBreakdown && event.prizeBreakdown.length > 0 && (
                <section id="prizes" className="scroll-mt-48">
                  <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                    Prizes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.prizeBreakdown.map((prize: any) => (
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

          <div className="lg:col-span-1 lg:sticky lg:top-24 order-1 lg:order-2 h-fit">
            <EventRegistrationCard
              tickets={tickets}
              selectedTicketId={effectiveSelectedTicketId}
              onSelectTicket={setSelectedTicketId}
              onRegister={handleRegistration}
              isRegistering={isRegistering || isCheckingOnboarding}
              isRegistered={isUserRegistered}
              user={
                user
                  ? {
                      name: user.firstName ?? user.username ?? "User",
                      email: user.primaryEmailAddress?.emailAddress ?? "",
                      avatar: user.imageUrl ?? "",
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleJoinEvent}
        fields={registrationFields}
        eventName={event?.name ?? ""}
        isSubmitting={isRegistering}
        userData={userDataForPrefill}
      />
    </div>
  );
}
