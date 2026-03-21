"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Users,
  Sparkles,
  Clock,
  IndianRupee,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  checkMyHackathonTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import { getApiErrorMessage } from "@/lib/utils";
import { format } from "date-fns";
import type { CompetitionDetails } from "./types";

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, getToken } = useAuth();
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isStartingRegistration, setIsStartingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [myTeam, setMyTeam] = useState<TeamDetailResponse | null>(null);

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
        setMyTeam(team);
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsAlreadyRegistered(false);
        setMyTeam(null);
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [isSignedIn, competition.id, getToken, justRegistered]);

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

  const paidPricingModeLabel =
    competition.chargeMode === "PER_TEAM"
      ? "Per Team"
      : competition.chargeMode === "PER_USER"
        ? "Per User"
        : null;

  const handleRegisterClick = async () => {
    if (!isSignedIn) {
      return;
    }

    setIsStartingRegistration(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to register.");
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
      console.error("Error starting registration:", error);
      toast.error(
        getApiErrorMessage(error, "Something went wrong. Please try again.")
      );
    } finally {
      setIsStartingRegistration(false);
    }
  };

  const renderRegisterButton = () => {
    // If checking registration status
    if (isCheckingRegistration) {
      return (
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
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
          className="w-full bg-green-600 text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          disabled
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Registered
        </Button>
      );
    }

    // If registration is closed
    if (isRegistrationClosed) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
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
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
          disabled
        >
          Teams Full
        </Button>
      );
    }

    const rawEntryFee = competition.entryFeeAmount as number | string | null | undefined;
    const baseAmount =
      typeof rawEntryFee === "number"
        ? rawEntryFee
        : Number(rawEntryFee ?? 0) || 0;
    const isPaid = competition.isFree === false && baseAmount > 0;
    const processingFee = Math.ceil(baseAmount * 0.0236 * 100) / 100;
    const totalAmount = competition.feeBearer === "PARTICIPANT"
      ? baseAmount + processingFee
      : baseAmount;
    const currency = competition.currency || "INR";
    const registerLabel = isPaid
      ? `Register for ${currency} ${totalAmount.toFixed(2)}`
      : "Register for free";

    // If not signed in, show sign-in button
    if (!isSignedIn) {
      return (
        <div className="space-y-2">
          <SignInButton mode="modal">
            <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm">
              {registerLabel}
            </Button>
          </SignInButton>
          {isPaid && competition.feeBearer === "PARTICIPANT" && (
            <div className="text-center space-y-0.5">
              <p className="text-xs text-neutral-500">
                ₹{baseAmount.toFixed(2)} + ₹{processingFee.toFixed(2)} Transaction Charges
              </p>
              <p className="text-[10px] text-neutral-400 px-2">
                Charged by payment partners to process your transaction.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Default: show register button
    return (
      <div className="space-y-2">
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          onClick={handleRegisterClick}
          disabled={isStartingRegistration}
        >
          {isStartingRegistration ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            registerLabel
          )}
        </Button>
        {isPaid && competition.feeBearer === "PARTICIPANT" && !isStartingRegistration && (
          <div className="text-center space-y-0.5">
            <p className="text-xs text-neutral-500">
              ₹{baseAmount.toFixed(2)} + ₹{processingFee.toFixed(2)} Transaction Charges
            </p>
            <p className="text-[10px] text-neutral-400 px-2">
              Charged by payment partners to process your transaction.
            </p>
          </div>
        )}
      </div>
    );
  };

  const getDeterministicPseudoImpressions = (
    registrationCount: number | null | undefined,
    createdAt: Date
  ): number => {
    if (!registrationCount || registrationCount <= 0) return 0;

    console.log(registrationCount, createdAt);

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
    const finalCount = Math.min(Math.floor(impressions), softCap);
    return finalCount;
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Featured In Pill */}
      {competition.featuredIn && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-200  rounded-md text-sm text-neutral-600 ">
          <span className="font-normal text-neutral-600">Featured in</span>
          <span className="font-semibold text-neutral-800 ">
            {competition.featuredIn}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-800" />
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
            <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-neutral-400  flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                {competition.startDate ? format(competition.startDate, "MMM") : "TBD"}
              </span>
              <span className="text-lg font-bold text-neutral-900  leading-none">
                {competition.startDate ? format(competition.startDate, "dd") : "--"}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900  text-[15px]">
                {(() => {
                  if (competition.startDate && competition.endDate) {
                    const isSameDay = competition.startDate.toDateString() === competition.endDate.toDateString();
                    if (isSameDay) {
                      return format(competition.startDate, "EEEE, d MMMM yyyy");
                    } else {
                      return `${format(competition.startDate, "MMM d")} - ${format(competition.endDate, "MMM d, yyyy")}`;
                    }
                  }
                  return competition.specificDate || "Date TBD";
                })()}
              </h4>
              <p className="text-sm text-neutral-500">
                {(() => {
                  if (competition.startDate && competition.endDate) {
                    const isSameDay = competition.startDate.toDateString() === competition.endDate.toDateString();
                    if (isSameDay) {
                      return `${format(competition.startDate, "h:mm a")} - ${format(competition.endDate, "h:mm a")}`;
                    } else {
                      // For different days, maybe showing time is less critical or we show full range?
                      // User asked: "show starting date time and enfing date time"
                      // Since the header already shows date range, maybe detailed time here?
                      // Let's show: Starts <Time> - Ends <Time> (on respective days)
                      return `${format(competition.startDate, "h:mm a")} - ${format(competition.endDate, "h:mm a")}`;
                    }
                  }
                  return competition.specificTime || "Time TBD";
                })()}
              </p>
            </div>
          </div>


          {/* Location Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
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

          {/* Team Status Card - shown when registered */}
          {isAlreadyRegistered && myTeam && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-800">
                  Your Team
                </span>
                <Link
                  href={`/hackathons/${competition.slug}/team`}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  View Details
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {myTeam.leader && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                      title={`${myTeam.leader.firstName || ""} ${myTeam.leader.lastName || ""} (Leader)`}
                    >
                      {myTeam.leader.imageUrl ? (
                        <Image
                          src={myTeam.leader.imageUrl}
                          alt="Leader"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (
                          myTeam.leader.firstName?.[0] ||
                          myTeam.leader.email?.[0] ||
                          "L"
                        ).toUpperCase()
                      )}
                    </div>
                  )}
                  {Array.isArray(myTeam.members) &&
                    myTeam.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-white bg-neutral-400 flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                        title={`${member.user.firstName || ""} ${member.user.lastName || ""}`}
                      >
                        {member.user.imageUrl ? (
                          <Image
                            src={member.user.imageUrl}
                            alt="Member"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (
                            member.user.firstName?.[0] ||
                            member.user.email?.[0] ||
                            "M"
                          ).toUpperCase()
                        )}
                      </div>
                    ))}
                  {Array.isArray(myTeam.members) &&
                    myTeam.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-neutral-300 flex items-center justify-center text-neutral-600 text-xs font-medium">
                        +{myTeam.members.length - 3}
                      </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {myTeam.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    Led by{" "}
                    {myTeam.leader?.firstName ||
                      myTeam.leader?.email?.split("@")[0] ||
                      "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-neutral-100  w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Team Size */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm shadow-sm">
                <Users className="w-5 h-5 text-neutral-800 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.teamSize || "1-2 Members"}
                </div>
                <div className="text-xs text-neutral-500">Team Size</div>
              </div>
            </div>

            {/* Pricing Mode (only for paid hackathons) */}
            {!competition.isFree && paidPricingModeLabel && (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
                  <IndianRupee className="w-5 h-5 text-neutral-800 " />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900  text-sm">
                    {paidPricingModeLabel}
                  </div>
                  <div className="text-xs text-neutral-500">Pricing Mode</div>
                </div>
              </div>
            )}

            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-neutral-800 " />
              </div>
              <div>
                <div className="font-semibold text-neutral-900  text-sm">
                  {competition.impressions ||
                    getDeterministicPseudoImpressions(
                      competition.registrationCount,
                      competition.createdAt
                    )}
                </div>
                <div className="text-xs text-neutral-500">Impressions</div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-neutral-800 " />
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
