"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { checkMyHackathonTeam } from "@/lib/api/teamApi";
import type { CompetitionDetails } from "./types";

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string } | null>(
    null,
  );

  // Check if user is already registered when signed in
  useEffect(() => {
    async function checkRegistration() {
      if (!isSignedIn || !competition.id) return;

      setIsCheckingRegistration(true);
      try {
        const token = await getToken();
        if (!token) return;

        const team = await checkMyHackathonTeam(token, competition.id);
        if (team) {
          setIsAlreadyRegistered(true);
          setMyTeam({ id: team.id, name: team.name });
        }
      } catch (error) {
        // Silently ignore - user is not registered
        console.error("Error checking registration:", error);
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [isSignedIn, competition.id, getToken]);

  // Check if registration is closed
  const isRegistrationClosed =
    competition.isRegistrationPaused ||
    (competition.registrationDeadlineDate &&
      new Date() > competition.registrationDeadlineDate);

  const handleRegisterClick = async () => {
    // If not signed in, the SignInButton will handle it
    if (!isSignedIn) {
      return;
    }

    // Check if user is onboarded
    const isOnboarded = user?.publicMetadata?.onboarded === true;
    if (!isOnboarded) {
      // Redirect to onboarding with return URL
      const returnUrl = `/competitions/${competition.slug}`;
      router.push(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check if registration is closed
    if (isRegistrationClosed) {
      toast.error("Registration is currently closed for this competition.");
      return;
    }

    // Check if already registered
    if (isAlreadyRegistered) {
      toast.info("You are already registered for this competition!");
      return;
    }

    // Redirect to team registration page
    router.push(
      `/team-register?hackathonId=${competition.id}&slug=${competition.slug}`,
    );
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
              `/team-register?hackathonId=${competition.id}&slug=${competition.slug}`,
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

    // If not signed in, show sign-in button
    if (!isSignedIn) {
      return (
        <SignInButton mode="modal">
          <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm">
            Register for free
          </Button>
        </SignInButton>
      );
    }

    // Default: show register button
    return (
      <Button
        className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm"
        onClick={handleRegisterClick}
      >
        Register for free
      </Button>
    );
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
                  {competition.impressions || "206"}
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
