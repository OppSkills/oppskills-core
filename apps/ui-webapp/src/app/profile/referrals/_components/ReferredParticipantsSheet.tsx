'use client';

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getReferralRegistrations } from "@/lib/api/referralApi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Building2, Mail, MapPin, GraduationCap, PencilLine, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferredParticipantsSheetProps {
  referralId: string | null;
  onClose: () => void;
  opportunityTitle: string;
}

export function ReferredParticipantsSheet({
  referralId,
  onClose,
  opportunityTitle,
}: ReferredParticipantsSheetProps) {
  const { getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["referral-registrations", referralId],
    enabled: !!referralId,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getReferralRegistrations(token, referralId!);
    },
  });

  return (
    <Sheet open={!!referralId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-white p-0 flex flex-col gap-0 border-l border-neutral-200">
        <SheetHeader className="p-4 border-b border-neutral-300 bg-neutral-100 flex flex-row items-center gap-4 space-y-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-200 text-neutral-600"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <SheetTitle className="text-xl font-normal text-neutral-900">Participant Details</SheetTitle>
          <SheetDescription className="sr-only">
            List of participants for {opportunityTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-8 bg-neutral-200">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 rounded-[32px] border border-neutral-100 bg-neutral-50/20 space-y-6">
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-8 w-48 rounded-md" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="h-6 w-full rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="space-y-6">
              {data.data.map((participant: any) => (
                <div key={participant.id} className="flex flex-col gap-6 p-6 sm:p-10 rounded-[32px] bg-white border border-neutral-200 shadow-sm hover:border-neutral-300 transition-all group">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-lg ring-1 ring-neutral-100 shrink-0">
                      <AvatarImage src={participant.avatarUrl} alt={participant.name} className="object-cover" />
                      <AvatarFallback className="bg-primary-50 text-primary-600 text-3xl font-bold">
                        {participant.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-3xl sm:text-4xl font-medium text-neutral-900 tracking-tight">{participant.name}</h3>
                  </div>

                  <div className="flex flex-col gap-4 pl-1 sm:pl-2">
                    <div className="flex items-start gap-4 text-[#8A8A8A]">
                      <Building2 className="size-6 shrink-0 mt-0.5" />
                      <span className="text-lg sm:text-xl font-normal tracking-tight">{participant.institution}</span>
                    </div>

                    <div className="flex items-start gap-4 text-[#8A8A8A]">
                      <Mail className="size-6 shrink-0 mt-0.5" />
                      <span className="text-lg sm:text-xl font-normal tracking-tight">{participant.email}</span>
                    </div>

                    <div className="flex items-start gap-4 text-[#8A8A8A]">
                      <MapPin className="size-6 shrink-0 mt-0.5" />
                      <span className="text-lg sm:text-xl font-normal tracking-tight">{participant.location}</span>
                    </div>

                    <div className="flex items-start gap-4 text-[#8A8A8A]">
                      <GraduationCap className="size-6 shrink-0 mt-0.5" />
                      <span className="text-lg sm:text-xl font-normal tracking-tight leading-snug">{participant.profession}</span>
                    </div>

                    <div className="flex items-start gap-4 text-[#8A8A8A]">
                      <PencilLine className="size-6 shrink-0 mt-0.5" />
                      <span className="text-lg sm:text-xl font-normal tracking-tight">
                        Registered on: {format(new Date(participant.registrationDate), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 pt-12">
              <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-800">No Participants Yet</h3>
              <p className="text-lg text-neutral-500 mt-2 max-w-[320px]">
                Once users register through your link, they will appear here.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
