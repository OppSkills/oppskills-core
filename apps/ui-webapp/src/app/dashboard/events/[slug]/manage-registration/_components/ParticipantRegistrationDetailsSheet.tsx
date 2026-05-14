"use client";

import { useMemo } from "react";
import {
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getParticipantRegistrationAnswers } from "@/lib/api/eventApi";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getSafeToken } from "@/lib/auth-utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RegistrationInfoCard, type ParticipantInfo } from "@/app/dashboard/_components/registration/RegistrationInfoCard";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { CardListFallback } from "@/components/boneyard/loading-fallbacks";

interface ParticipantRegistrationDetailsSheetProps {
  participant: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    university: string;
    course: string;
    location: string;
    registeredOn: string;
  } | null;
  slug: string;
  onClose: () => void;
}

export function ParticipantRegistrationDetailsSheet({
  participant,
  slug,
  onClose,
}: ParticipantRegistrationDetailsSheetProps) {
  const { getToken } = useAuth();

  const { data: registrationAnswersData, isLoading: isLoadingAnswers } =
    useQuery({
      queryKey: ["participant-registration-answers", slug, participant?.id],
      queryFn: async () => {
        const token = await getSafeToken(getToken);
        if (!token || !participant?.id) return null;
        return getParticipantRegistrationAnswers(token, slug, participant.id);
      },
      enabled: !!participant?.id,
    });

  const participantInfo: ParticipantInfo | null = useMemo(() => {
    if (!participant) return null;

    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      college: participant.university,
      location: participant.location,
      education: participant.course,
      registeredOn: new Date(participant.registeredOn).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatarUrl: participant.avatarUrl || undefined,
      answers: registrationAnswersData?.answers || [],
      registrationFields: registrationAnswersData?.fields || [],
      payment: registrationAnswersData?.payment ?? null,
    };
  }, [participant, registrationAnswersData]);

  return (
    <Sheet open={!!participant} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-neutral-50 p-0 flex flex-col gap-0 border-l border-neutral-200 overflow-hidden [&>button]:hidden">
        <SheetHeader className="p-4 border-b border-neutral-200 bg-white flex flex-row items-center gap-4 space-y-0 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-100 text-neutral-500"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-lg font-black text-neutral-900 poppins">
                Participant detail
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
          <BoneyardSkeleton
            loading={isLoadingAnswers}
            name="participant-details"
            fallback={<CardListFallback rows={2} className="px-0 py-0" />}
            className="w-full"
          >
            {participantInfo && (
              <RegistrationInfoCard participant={participantInfo} />
            )}
          </BoneyardSkeleton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
