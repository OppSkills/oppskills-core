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
} from "@/lib/api/eventApi";
import { getMe, submitOnboarding } from "@/lib/api/usersApi";
import { CreateOnboardingDto } from "@oppskills/types/frontend";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/utils";

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
            setIsModalOpen(false);
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

  return (
    <div className="min-h-screen bg-transparent py-8 font-sans">
      {/* Load Razorpay SDK for paid events */}
      {!event.isFree && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
      )}
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Mobile: Banner first, then header, then registration card */}
        {/* Desktop: Header first, then grid with banner and registration card */}

        {/* Mobile flex container for ordering */}
        <div className="flex flex-col lg:contents">
          {/* Banner - appears first on mobile, inside grid on desktop */}
          {event.bannerImageUrl && (
            <div className="lg:hidden mb-8 order-1">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm">
                <Image
                  src={event.bannerImageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* TOP HEADER SECTION */}
          <div className="mb-8 order-2 lg:order-none">
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

            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6 poppins tracking-tight break-words">
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
                  <h4 className="font-semibold text-neutral-900  text-[15px] break-words">
                    {venueName}
                  </h4>
                  <p className="text-sm text-neutral-500 break-words">{venueAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Card - appears after header on mobile, in grid on desktop */}
          <div className="lg:hidden mb-8 order-3">
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

          {/* Desktop Grid Layout */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
            <div className="lg:col-span-2 space-y-8">
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
                  <div className="ProseMirror  max-w-none text-neutral-600  inter">
                    {event.description ? (
                      <div
                        className="html-content whitespace-pre-line break-words"
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
                          alt={`${event.owner.firstName || ""} ${event.owner.lastName || ""
                            }`}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {getInitials(
                            event.owner.firstName,
                            event.owner.lastName,
                          )}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-foreground break-words">
                          {event.organization_name || event.owner.firstName + " " + event.owner.lastName}
                        </h4>
                        {event.owner.email && (
                          <p className="text-xs text-neutral-500 break-all">
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
                          <h4 className="font-bold text-foreground break-words">
                            {event.contactName}
                          </h4>
                          {event.contactPhone && (
                            <p className="text-xs text-neutral-500">
                              {event.contactPhone}
                            </p>
                          )}
                          {event.contactEmail && (
                            <p className="text-xs text-neutral-500 break-all">
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
                            <p className="text-sm text-neutral-500 mt-2 break-words">
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

            <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
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

          {/* Mobile Content Section - appears after registration card */}
          <div className="lg:hidden order-4 space-y-8">
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
                <div className="ProseMirror  max-w-none text-neutral-600  inter">
                  {event.description ? (
                    <div
                      className="html-content whitespace-pre-line break-words"
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
                        alt={`${event.owner.firstName || ""} ${event.owner.lastName || ""
                          }`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {getInitials(
                          event.owner.firstName,
                          event.owner.lastName,
                        )}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground break-words">
                        {event.owner.firstName || ""}{" "}
                        {event.owner.lastName || "Organizer"}
                      </h4>
                      {event.owner.email && (
                        <p className="text-xs text-neutral-500 break-all">
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
                        <h4 className="font-bold text-foreground break-words">
                          {event.contactName}
                        </h4>
                        {event.contactPhone && (
                          <p className="text-xs text-neutral-500">
                            {event.contactPhone}
                          </p>
                        )}
                        {event.contactEmail && (
                          <p className="text-xs text-neutral-500 break-all">
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
                          <p className="text-sm text-neutral-500 mt-2 break-words">
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
