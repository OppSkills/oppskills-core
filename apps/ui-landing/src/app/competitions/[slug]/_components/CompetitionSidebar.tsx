"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Users,
  Sparkles,
  Clock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { checkMyHackathonTeam } from "@/lib/api/teamApi";
import { getMe } from "@/lib/api/usersApi";
import type { CompetitionDetails } from "./types";

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, getToken } = useAuth();
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string } | null>(
    null
  );

  // Force re-check when redirected back from registration with ?registered=true
  const justRegistered = searchParams.get("registered") === "true";

  // Check if user is already registered when signed in
  useEffect(() => {
    async function checkRegistration() {
      if (!isSignedIn || !competition.id) return;

      setIsCheckingRegistration(true);
      try {
        const token = await getToken();
        if (!token) return;

        const team = await checkMyHackathonTeam(token, competition.id);
        setIsAlreadyRegistered(!!team);
        setMyTeam(team ? { id: team.id, name: team.name } : null);

        // Clear the query param after successful check to avoid re-triggering
        if (justRegistered && team) {
          router.replace(`/competitions/${competition.slug}`, {
            scroll: false,
          });
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsAlreadyRegistered(false);
        setMyTeam(null);
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [
    isSignedIn,
    competition.id,
    competition.slug,
    getToken,
    justRegistered,
    router,
  ]);

  // Check if registration is closed
  const isRegistrationClosed =
    competition.isRegistrationPaused ||
    (competition.registrationDeadlineDate &&
      new Date() > competition.registrationDeadlineDate);

  const isMaxTeamsReached =
    competition.maxTeams !== null &&
    competition.maxTeams !== undefined &&
    competition.registrationCount !== undefined &&
    competition.registrationCount >= competition.maxTeams;

  const handleRegisterClick = async () => {
    if (!isSignedIn) {
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
        const returnUrl = `/competitions/${competition.slug}`;
        router.push(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      if (isRegistrationClosed) {
        toast.error("Registration is currently closed for this competition.");
        return;
      }

      if (isAlreadyRegistered) {
        toast.info("You are already registered for this competition!");
        return;
      }

      router.push(
        `/team-register?hackathonId=${competition.id}&slug=${competition.slug}`
      );
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const renderRegisterButton = () => {
    // If checking registration status
    if (isCheckingRegistration) {
      return (
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm"
          disabled
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Checking...
        </Button>
      );
    }

    // If already registered
    if (isAlreadyRegistered && myTeam) {
      return (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm"
          onClick={() =>
            router.push(
              `/team-register?hackathonId=${competition.id}&slug=${competition.slug}`
            )
          }
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Registered: {myTeam.name}
        </Button>
      );
    }

    // If registration is closed
    if (isRegistrationClosed) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm cursor-not-allowed"
          disabled
        >
          Registration Closed
        </Button>
      );
    }

    // If max teams reached
    if (isMaxTeamsReached) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm cursor-not-allowed"
          disabled
        >
          Teams Full
        </Button>
      );
    }

    // If not signed in, show sign-in button
    if (!isSignedIn) {
      return (
        <SignInButton mode="modal">
          <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm">
            {competition.isFree === false && competition.entryFeeAmount
              ? `Register for ${competition.currency || "INR"} ${competition.entryFeeAmount}`
              : "Register for free"}
          </Button>
        </SignInButton>
      );
    }

    // Default: show register button
    return (
      <Button
        className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm"
        onClick={handleRegisterClick}
        disabled={isCheckingOnboarding}
      >
        {isCheckingOnboarding ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : competition.isFree === false && competition.entryFeeAmount ? (
          `Register for ${competition.currency || "INR"} ${competition.entryFeeAmount}`
        ) : (
          "Register for free"
        )}
      </Button>
    );
  };

  const getDeterministicPseudoImpressions = (
    registrationCount: number | null | undefined,
    createdAt: Date | undefined
  ): number => {
    if (!registrationCount || registrationCount <= 0 || !createdAt) return 0;

    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();

    const hoursOld = Math.max(
      1,
      Math.floor((now - createdTime) / (1000 * 60 * 60))
    );

    const registrationBase = registrationCount * 6;

    let timeExposure = 0;

    if (hoursOld <= 24) {
      timeExposure = hoursOld * 35;
    } else if (hoursOld <= 72) {
      timeExposure = 24 * 35 + (hoursOld - 24) * 12;
    } else {
      timeExposure = 24 * 35 + 48 * 12 + Math.log2(hoursOld - 72 + 1) * 25;
    }

    const softCap = registrationCount * 120;

    const impressions = registrationBase + timeExposure;

    return Math.min(Math.floor(impressions), softCap);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Featured In Pill */}
      {competition.featuredIn && (
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-100  rounded-full text-sm text-neutral-600 ">
          <span className="font-normal text-muted-foreground">Featured in</span>
          <span className="font-semibold text-neutral-900 ">
            {competition.featuredIn}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      )}

      {/* Banner Component */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm">
        <Image
          src={competition.thumbnail || "/competition_placeholder.png"}
          alt={competition.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Info Card */}
      <div className="bg-background  rounded-2xl border border-neutral-200  p-6 shadow-sm">
        <p className="text-neutral-600  text-[15px] mb-6">
          Welcome! to join event please register below.
        </p>

        <div className="space-y-5">
          {/* Date Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                Jan
              </span>
              <span className="text-lg font-bold text-neutral-900  leading-none">
                05
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900  text-[15px]">
                {competition.specificDate || "Monday, 5 January 2026"}
              </h4>
              <p className="text-sm text-neutral-500">
                {competition.specificTime || "8:00 - 20:00 GMT-8"}
              </p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
              <MapPin className="w-5 h-5 text-neutral-700 " />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900  text-[15px]">
                {competition.venueName || "College/University Name"}
              </h4>
              <p className="text-sm text-neutral-500">
                {competition.venueAddress || "City, State"}
              </p>
            </div>
          </div>

          {/* Register Button */}
          {renderRegisterButton()}

          {/* Divider */}
          <div className="h-px bg-neutral-100  w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Team Size */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Users className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.teamSize || "1-2 Members"}
                </div>
                <div className="text-xs text-neutral-500">Team Size</div>
              </div>
            </div>

            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.impressions ||
                    getDeterministicPseudoImpressions(
                      competition.registrationCount,
                      competition.createdAt
                    ) ||
                    "746"}
                </div>
                <div className="text-xs text-neutral-500">Impressions</div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-neutral-50  rounded-xl border border-neutral-100  flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-600 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.registrationDeadline || "8 Days"}
                </div>
                <div className="text-xs text-neutral-500">
                  Registration Deadline
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
