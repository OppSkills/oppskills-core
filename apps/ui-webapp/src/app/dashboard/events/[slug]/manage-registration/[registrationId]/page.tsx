"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ClipboardList, UserCircle2 } from "lucide-react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";
import { Button } from "@/components/ui/button";
import {
  getParticipantRegistrationAnswers,
  getEventBySlug,
} from "@/lib/api/eventApi";
import {
  RegistrationInfoCard,
  ParticipantInfo,
} from "../../../../_components/registration/RegistrationInfoCard";
import {
  RegistrationAnswersView,
  Respondent,
} from "../../../../_components/registration/RegistrationAnswersView";
import { Badge } from "@/components/ui/badge";

export default function EventRegistrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const registrationId = params.registrationId as string;
  const { getToken } = useAuth();

  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event-details", slug],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return null;
      return getEventBySlug(token, slug);
    },
    enabled: !!slug,
  });

  const { data: registrationData, isLoading: isLoadingRegistration } = useQuery(
    {
      queryKey: ["participant-registration-answers", slug, registrationId],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return null;
        return getParticipantRegistrationAnswers(token, slug, registrationId);
      },
      enabled: !!slug && !!registrationId,
    },
  );

  const participant = registrationData?.participant;

  const participantInfo: ParticipantInfo | null = participant
    ? {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        avatarUrl: participant.avatarUrl || undefined,
        registeredOn: "—", // This info isn't in ParticipantRegistrationAnswersResponse, but we could fetch it if needed from registrations list
        // college: participant.university, // Also missing in this specific API response, but let's see what we have
      }
    : null;

  // Map respondents for RegistrationAnswersView
  const respondents: Respondent[] = participant
    ? [
        {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          avatarUrl: participant.avatarUrl || undefined,
          answers: registrationData.answers,
        },
      ]
    : [];

  const handleBack = () => {
    router.back();
  };

  const detailLoading = isLoadingEvent || isLoadingRegistration;

  if (!detailLoading && !registrationData) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px] bg-surface">
        <div className="text-center">
          <p className="text-destructive font-medium">Registration not found</p>
          <Button variant="link" onClick={handleBack}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const eventName = (eventData as any)?.name || "Event";

  return (
    <BoneyardSkeleton
      loading={detailLoading}
      name="dashboard-event-registration-detail"
      className="w-full bg-[#F8F9FA]"
      fallback={<TableBlockFallback className="min-h-[400px] bg-surface p-8" />}
    >
      {registrationData ? (
        <div className="min-h-screen bg-[#F8F9FA] p-2 sm:p-4 md:p-6 lg:p-10 w-full space-y-6 font-inter">
          {/* Header Section */}
          <div className="flex items-center gap-4 bg-background p-4 rounded-xl shadow-sm border border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-gray-100 rounded-full h-10 w-10"
            >
              <ChevronLeft className="h-6 w-6 text-gray-500" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 font-poppins">
                  {eventName}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-primary-100 text-primary-700 border-primary-200"
                >
                  Registration Detail
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Managing registration for {participant?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Left Column: Participant Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-2 px-2">
                <UserCircle2 className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-foreground poppins">
                  Participant Profile
                </h2>
              </div>
              {participantInfo && (
                <RegistrationInfoCard participant={participantInfo} />
              )}
            </div>

            {/* Right Column: Registration Answers */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 px-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-foreground poppins">
                  Registration Answers
                </h2>
              </div>
              <div className="bg-background rounded-[20px] p-6 lg:p-10 shadow-sm border border-gray-100">
                <RegistrationAnswersView
                  fields={registrationData.fields}
                  respondents={respondents}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </BoneyardSkeleton>
  );
}
