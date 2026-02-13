"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { EventRegistrationCard } from "./EventRegistrationCard";
import { EventTabs } from "./EventTabs";
import {
  EventRegistrationModal,
  RegistrationField,
  UserDataForPrefill,
  OnboardingValues,
  UserCategory as UserCategoryEnum,
  ExperienceLevel,
  TeamPreference,
  Gender,
} from "./EventRegistrationModal";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, isSameYear } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  joinEvent,
  checkMyRegistration,
  createEventPaymentOrder,
  verifyEventPayment,
  submitMissingRegistrationAnswers,
} from "@/lib/api/eventApi";
import { getMe, submitOnboarding } from "@/lib/api/usersApi";
import { CreateOnboardingDto } from "@oppskills/types/frontend";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  userCategory?: string,
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
      !identityFieldLabels.has(f.label.toLowerCase()),
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userDataForPrefill, setUserDataForPrefill] = useState<
    UserDataForPrefill | undefined
  >(undefined);
  const [registrationFields, setRegistrationFields] = useState<
    RegistrationField[]
  >([]);
  const [discountCode, setDiscountCode] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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
  const isPaidButIncomplete = !!registrationStatus?.isPaidButIncomplete;

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

      // Always show onboarding fields to allow user to verify/update details
      setShowOnboarding(true);

      const onboardingProfile = meData.onboardingProfile;
      const fullName =
        [meData.firstName, meData.lastName].filter(Boolean).join(" ") ||
        undefined;

      const prefillData: UserDataForPrefill = {
        name: fullName,
        email: meData.email ?? undefined,
        phone: user?.primaryPhoneNumber?.phoneNumber,
        gender: onboardingProfile?.gender,
        userCategory:
          onboardingProfile?.userCategory as unknown as UserCategoryEnum,

        schoolName: onboardingProfile?.schoolName ?? undefined,
        schoolClass: onboardingProfile?.schoolClass ?? undefined,
        schoolAddress: onboardingProfile?.schoolAddress ?? undefined,

        collegeId: onboardingProfile?.collegeId ?? undefined,
        collegeName: onboardingProfile?.college?.name ?? undefined,
        collegeSkipped: onboardingProfile?.collegeSkipped ?? false,
        collegeCurrentYear: onboardingProfile?.collegeCurrentYear ?? undefined,
        collegePassoutYear: onboardingProfile?.collegePassoutYear ?? undefined,

        companyName: onboardingProfile?.companyName ?? undefined,
        jobTitle: onboardingProfile?.jobTitle ?? undefined,

        locationCity: onboardingProfile?.locationCity ?? undefined,
        locationState: onboardingProfile?.locationState ?? undefined,
        locationCountry: onboardingProfile?.locationCountry ?? undefined,

        interests: onboardingProfile?.interests,
        skills: onboardingProfile?.skills,

        experienceLevel:
          onboardingProfile?.experienceLevel as unknown as ExperienceLevel,
        teamPreference:
          onboardingProfile?.teamPreference as unknown as TeamPreference,
      };

      setUserDataForPrefill(prefillData);

      const customFields = (event.registrationForm?.fields ??
        []) as RegistrationField[];
      const mergedFields = mergeDefaultAndCustomFields(
        customFields,
        onboardingProfile?.userCategory,
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
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    onboardingData?: OnboardingValues
  ) => {
    if (!event) return;

    setIsRegistering(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to register.");
        return;
      }

      // Submit onboarding data first if provided
      if (onboardingData) {
        await submitOnboarding(
          token,
          onboardingData as unknown as CreateOnboardingDto
        );
      }

      // If user has paid but registration form is incomplete, just submit the answers
      if (isPaidButIncomplete) {
        await submitMissingRegistrationAnswers(token, event.id, answers);
        toast.success("Registration form submitted successfully!");
        setIsModalOpen(false);
        await refetchRegistrationStatus();
        return;
      }

      // Check if event is paid
      const isPaidEvent = !event.isFree && event.entryFeeAmount && event.entryFeeAmount > 0;

      if (isPaidEvent) {
        // Process payment flow for paid events
        await processPaymentAndRegistration(token, answers);
      } else {
        // Free event - direct registration
        await joinEvent(token, event.id, { answers });
        toast.success("Successfully registered for the event!");
        setIsModalOpen(false);
        await refetchRegistrationStatus();
      }
    } catch (err: unknown) {
      handleRegistrationError(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const processPaymentAndRegistration = async (
    token: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>
  ) => {
    try {
      // Create payment order
      const orderResponse = await createEventPaymentOrder(token, event.slug, {
        discountCode: discountCode || undefined,
      });

      // Handle zero-amount payment (free college or 100% discount)
      if (orderResponse.zeroAmountPayment) {
        // For zero-amount, backend has already created the participant
        // Just need to join with answers
        await joinEvent(token, event.id, { answers });
        toast.success("Successfully registered for the event!");
        setIsModalOpen(false);
        setDiscountCode("");
        await refetchRegistrationStatus();
        return;
      }

      // Require Razorpay for real payment
      if (!window.Razorpay || !razorpayLoaded) {
        toast.error("Payment system is loading. Please try again.");
        return;
      }

      const razorpayKey = orderResponse.razorpayKey;
      const razorpayOrderId = orderResponse.razorpayOrderId;

      if (!razorpayKey || !razorpayOrderId) {
        throw new Error("Payment configuration error");
      }

      // Open Razorpay modal
      const options = {
        key: razorpayKey,
        amount: orderResponse.amountPaise,
        currency: orderResponse.currency,
        name: event.name,
        description: "Event Registration",
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            setIsRegistering(true);
            const verifyToken = await getToken();
            if (!verifyToken) throw new Error("Authentication required");

            const responseOrderId = response?.razorpay_order_id;
            const responsePaymentId = response?.razorpay_payment_id;
            const responseSignature = response?.razorpay_signature;

            if (!responseOrderId || !responsePaymentId || !responseSignature) {
              throw new Error(
                "Payment verification failed (missing Razorpay fields). Please try again."
              );
            }

            // Verify payment - this also creates the participant
            await verifyEventPayment(verifyToken, event.slug, {
              razorpayOrderId: responseOrderId,
              razorpayPaymentId: responsePaymentId,
              razorpaySignature: responseSignature,
              answers,
            });

            toast.success("Payment successful! You are now registered.");
            setDiscountCode("");
            await refetchRegistrationStatus();
          } catch (err) {
            console.error("Payment verification error:", err);
            toast.error(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support."
            );
          } finally {
            setIsRegistering(false);
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          contact: user?.primaryPhoneNumber?.phoneNumber || "",
        },
        theme: {
          color: "#5B2E63",
        },
        modal: {
          ondismiss: () => {
            setIsRegistering(false);
            toast.info("Payment cancelled");
          },
        },
      };

      // Close the registration modal BEFORE opening Razorpay.
      // This prevents the Radix UI Dialog from blocking interaction with the Razorpay iframe
      // (focus trapping and pointer-events: none on body).
      setIsModalOpen(false);

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleRegistrationError = (err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to register. Please try again.";

    if (typeof err === "object" && err !== null && "response" in err) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: {
            message?: string | string[];
            error?: string;
            statusCode?: number;
          };
        };
      };

      // Handle eligibility errors (403 Forbidden)
      if (axiosErr.response?.status === 403) {
        const errorMessage = Array.isArray(axiosErr.response?.data?.message)
          ? axiosErr.response.data.message[0]
          : axiosErr.response?.data?.message ||
          axiosErr.response?.data?.error ||
          "Registration is not allowed for this event.";
        toast.error(errorMessage, { duration: 5000 });
        return;
      }

      // Handle array of messages (typical NestJS validation pipe)
      if (Array.isArray(axiosErr.response?.data?.message)) {
        toast.error(axiosErr.response.data.message[0]);
        return;
      }

      // Handle single message
      if (axiosErr.response?.data?.message) {
        toast.error(axiosErr.response.data.message as string);
        return;
      }
    }
    toast.error(message);
  };

  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const sameDay = isSameDay(startDate, endDate);

  // Format date display
  let formattedDate: string;
  if (sameDay) {
    formattedDate = format(startDate, "EEEE, d MMM yyyy");
  } else {
    // Check if same year
    if (isSameYear(startDate, endDate)) {
      formattedDate = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    } else {
      formattedDate = `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
  }

  const formattedTime = format(startDate, "h:mm a") + " Onwards";
  const monthShort = format(startDate, "MMM");
  const dayNum = format(startDate, "dd");

  const { venueName, venueAddress } = formatLocation(event);

  const tickets = [
    {
      id: "standard",
      name: event.isFree ? "Free Entry" : "Standard Ticket",
      price: event.isFree ? 0 : (event.entryFeeAmount ?? 0),
      description: "Don’t miss out, FOMO is real! 🚀",
    },
  ];

  const effectiveSelectedTicketId = selectedTicketId ?? tickets[0]?.id ?? null;

  const cardUser = user
    ? {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar: user.imageUrl,
    }
    : undefined;

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

          {/* LEFT COLUMN: Banner & Contact Details */}
          <div className="lg:col-span-4 space-y-8">
            {/* Festival Badge (Mobile Only - usually nice to have on top) */}
            {event.festival && (
              <div className="lg:hidden flex flex-wrap gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-xs text-neutral-600">
                  <span className="font-normal text-muted-foreground">
                    Featured in
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {event.festival.name}
                  </span>
                  <span className="text-neutral-400">&gt;</span>
                </div>
              </div>
            )}

            {/* Banner Image */}
            {event.bannerImageUrl && (
              <div className="relative m-0 lg:mb-4 aspect-[16/9] w-full overflow-hidden lg:rounded-2xl lg:shadow-sm border border-neutral-100">
                <Image
                  src={event.bannerImageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Contact Details Section */}
            <div id="contact-details-desktop" className="scroll-mt-24 hidden lg:block">
              <h3 className="text-xl font-semibold text-neutral-800 mb-4">Contact Details</h3>
              <div className="space-y-4">
                {/* Event Owner / Organizer */}
                <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4">
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
                      {getInitials(event.owner.firstName, event.owner.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate">
                      {(() => {
                        const orgName = event?.organization_name;
                        const ownerName = [event?.owner?.firstName, event?.owner?.lastName]
                          .filter(Boolean)
                          .join(" ");
                        return orgName || ownerName || "Organizer";
                      })()}
                    </h4>
                    {event.contactPhone && (
                      <p className="text-xs text-neutral-500 truncate">{event.contactPhone}</p>
                    )}
                    {event.owner.email && (
                      <p className="text-xs text-neutral-500 truncate">{event.owner.email}</p>
                    )}
                  </div>
                </div>

                {/* Additional Contact Person */}
                {event.contactName && (
                  <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {event.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">{event.contactName}</h4>
                      {event.contactPhone && (
                        <p className="text-xs text-neutral-500 truncate">{event.contactPhone}</p>
                      )}
                      {event.contactEmail && (
                        <p className="text-xs text-neutral-500 truncate">{event.contactEmail}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Info, Action, Content */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2 px-2 sm:px-0">
            {/* Festival Badge (Desktop) */}
            {event.festival && (
              <div className="hidden lg:flex flex-wrap gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-xs text-neutral-600">
                  <span className="font-normal text-muted-foreground">
                    Featured in
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {event.festival.name}
                  </span>
                  <span className="text-neutral-400">&gt;</span>
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-neutral-900 text-3xl lg:text-4xl font-semibold">
              {event.name}
            </h1>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="flex gap-4 items-center">
                <div>
                  <div className="flex flex-col items-center justify-center shadow-sm overflow-hidden rounded-lg">
                    <div className="bg-neutral-200 min-w-12 flex justify-center items-center py-0.5">
                      <span className="text-neutral-700  text-xs">
                        {monthShort}
                      </span>
                    </div>
                    <span className="text-base font-medium text-neutral-900 py-0.5">
                      {dayNum}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-neutral-800 text-BASE">
                    {formattedDate}
                  </p>
                  <p className="text-xs text-neutral-600">{formattedTime}</p>
                </div>
              </div>

              <div className="flex w-full gap-2 items-center">
                <div className="border-0.5 shadow-sm border-neutral-400 rounded-lg p-3">
                  <MapPin className="w-6 h-6 text-neutral-700" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-base text-neutral-800">
                    {event.locationAddress}
                  </p>
                  <p className="text-xs text-neutral-600">{event.locationCity}</p>
                </div>
              </div>
            </div>

            {/* Replaced Hardcoded Card with Component */}
            <EventRegistrationCard
              tickets={tickets}
              user={cardUser}
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
              onRegister={handleRegistration}
              isRegistering={isRegistering || isCheckingOnboarding}
              isRegistered={isUserRegistered}
              isPaidButIncomplete={isPaidButIncomplete}
              registrationDeadline={event.registrationDeadline}
            />

            {/* Tabs & Content */}
            <div className="space-y-6">
              <EventTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <div className="space-y-8">
                <section id="about-event" className="scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                    About Event
                  </h2>
                  <div className="ProseMirror max-w-none text-neutral-600 inter">
                    {event.description ? (
                      <div
                        className="html-content whitespace-pre-line break-words leading-relaxed"
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
                              <p className="text-sm text-neutral-500 mt-2 break-words">
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
            <div id="contact-details-mobile" className="scroll-mt-24 lg:hidden">
              <h3 className="text-xl font-semibold text-neutral-800 mb-4">Contact Details</h3>
              <div className="space-y-4">
                {/* Event Owner / Organizer */}
                <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4">
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
                      {getInitials(event.owner.firstName, event.owner.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate">
                      {(() => {
                        const orgName = event?.organization_name;
                        const ownerName = [event?.owner?.firstName, event?.owner?.lastName]
                          .filter(Boolean)
                          .join(" ");
                        return orgName || ownerName || "Organizer";
                      })()}
                    </h4>
                    {event.contactPhone && (
                      <p className="text-xs text-neutral-500 truncate">{event.contactPhone}</p>
                    )}
                    {event.owner.email && (
                      <p className="text-xs text-neutral-500 truncate">{event.owner.email}</p>
                    )}
                  </div>
                </div>

                {/* Additional Contact Person */}
                {event.contactName && (
                  <div className="p-4 bg-[#FDF2FF] rounded-xl border border-purple-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {event.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">{event.contactName}</h4>
                      {event.contactPhone && (
                        <p className="text-xs text-neutral-500 truncate">{event.contactPhone}</p>
                      )}
                      {event.contactEmail && (
                        <p className="text-xs text-neutral-500 truncate">{event.contactEmail}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
        showOnboarding={showOnboarding}
      />
    </div>
  );
}
