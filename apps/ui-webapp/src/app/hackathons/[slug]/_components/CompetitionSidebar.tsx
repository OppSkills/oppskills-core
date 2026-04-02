"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { SquareShareLine } from '@solar-icons/react'
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Users,
  Sparkles,
  Clock,
  IndianRupee,
  Loader2,
  Activity,
  CheckCircle,
  ShareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  checkMyHackathonTeam,
  createDraftTeam,
  joinDraftTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import {
  getHackathonRegistrationStatus,
  submitRegistration,
  type HackathonRegistrationStatus,
} from "@/lib/api/paymentsApi";
import { withRetry } from "@/lib/utils/retry";
import {
  readPendingHackathonRegistration,
  clearPendingHackathonRegistration,
} from "@/lib/registration/pendingHackathonRegistration";
import { TeamDetailsCard } from "./TeamDetailsCard";
import { getApiErrorMessage } from "@/lib/utils";
import { format } from "date-fns";
import type { CompetitionDetails } from "./types";
import { RegistrationModal } from "./RegistrationModal";

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [, setAuthMode] = useQueryState("auth");
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(!!isSignedIn);
  const [isStartingRegistration, setIsStartingRegistration] = useState(false);
  const [myTeam, setMyTeam] = useState<TeamDetailResponse | null>(null);
  const [registrationStatus, setRegistrationStatus] =
    useState<HackathonRegistrationStatus | null>(null);

  const [registration, setRegistration] = useQueryState("registration");
  const [invitation, setInvitation] = useQueryState("invitation");

  const isOrganizer = !!user && !!competition.organizers?.some((o) => o.id === user.id);

  const hasTeam = !!myTeam;
  const isFullyRegistered = registrationStatus?.hasSubmitted === true;
  const needsCompleteRegistration =
    hasTeam &&
    registrationStatus?.canCompleteRegistrationWithoutPayment === true;

  const isCompletionFlow = registration === "complete";
  const isRegistrationModalOpen =
    !!registration &&
    !isCheckingRegistration &&
    !isOrganizer &&
    ((!hasTeam && (registration === "create" || registration === "join")) ||
      (needsCompleteRegistration && isCompletionFlow));

  const initialMode = registration === "join" ? "JOIN" : "CREATE";

  // Force re-check when redirected back from registration with ?registered=true
  const justRegistered = searchParams.get("registered") === "true";

  // Check if user is already registered when signed in
  useEffect(() => {
    async function checkRegistration() {
      // Don't act until auth is loaded
      if (!isLoaded) return;

      // If user is not signed in but has registration params, redirect to login
      if (!isSignedIn) {
        if (registration) {
          setRegistration(null);
          setInvitation(null);
          setAuthMode("login");
        }
        setIsCheckingRegistration(false);
        return;
      }

      if (!competition.id) return;

      setIsCheckingRegistration(true);
      try {
        const token = await getToken();
        if (!token) return;

        const team = await checkMyHackathonTeam(token, competition.id);
        setMyTeam(team);

        let status: HackathonRegistrationStatus | null = null;
        if (team) {
          try {
            status = await getHackathonRegistrationStatus(
              token,
              competition.slug,
            );
          } catch (statusErr) {
            console.error("Error loading registration status:", statusErr);
          }
        }
        setRegistrationStatus(status);

        const canComplete =
          !!team &&
          status?.canCompleteRegistrationWithoutPayment === true;

        if (team && registration) {
          if (status?.hasSubmitted) {
            setRegistration(null);
            setInvitation(null);
          } else if (
            canComplete &&
            (registration === "create" || registration === "join")
          ) {
            setRegistration(null);
            setInvitation(null);
          }
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setMyTeam(null);
        setRegistrationStatus(null);
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [
    isLoaded,
    isSignedIn,
    competition.id,
    competition.slug,
    getToken,
    justRegistered,
    registration,
    setRegistration,
    setInvitation,
    setAuthMode,
  ]);

  const pendingRecoveryTriedRef = useRef(false);

  /** Recover registration answers if payment succeeded but Razorpay handler never ran (common on mobile). */
  useEffect(() => {
    if (pendingRecoveryTriedRef.current) return;
    if (!isLoaded || !isSignedIn || !competition.slug || !user?.id) return;
    if (!registrationStatus || isCheckingRegistration) return;

    const pending = readPendingHackathonRegistration(competition.slug);
    if (!pending || pending.userId !== user.id || pending.answers.length === 0) {
      return;
    }

    if (registrationStatus.hasSubmitted) {
      clearPendingHackathonRegistration(competition.slug);
      return;
    }

    if (competition.isFree) {
      clearPendingHackathonRegistration(competition.slug);
      return;
    }

    if (!registrationStatus.paymentCompleted) return;

    pendingRecoveryTriedRef.current = true;

    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          pendingRecoveryTriedRef.current = false;
          return;
        }

        if (
          registrationStatus.hasTeam &&
          registrationStatus.canCompleteRegistrationWithoutPayment
        ) {
          await withRetry(() =>
            submitRegistration(token, competition.slug, pending.answers),
          );
          clearPendingHackathonRegistration(competition.slug);
          toast.success("Your registration form was saved.");
          window.location.reload();
          return;
        }

        if (!registrationStatus.hasTeam) {
          if (pending.invitationCode) {
            await withRetry(() =>
              joinDraftTeam(token, competition.slug, {
                invitationCode: pending.invitationCode!.toUpperCase(),
              }),
            );
          } else if (pending.teamName) {
            await withRetry(() =>
              createDraftTeam(token, competition.slug, {
                name: pending.teamName!,
                maxSize: pending.maxSize,
              }),
            );
          } else {
            pendingRecoveryTriedRef.current = false;
            return;
          }
          await withRetry(() =>
            submitRegistration(token, competition.slug, pending.answers),
          );
          clearPendingHackathonRegistration(competition.slug);
          toast.success("Your registration form was saved.");
          window.location.reload();
        } else {
          pendingRecoveryTriedRef.current = false;
        }
      } catch (e) {
        pendingRecoveryTriedRef.current = false;
        console.error("Pending registration recovery failed:", e);
        toast.error(
          getApiErrorMessage(
            e,
            "Could not restore your registration. Try Register again — you will not be charged twice.",
          ),
        );
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    competition.slug,
    competition.isFree,
    user?.id,
    registrationStatus,
    isCheckingRegistration,
    getToken,
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

      if (isFullyRegistered) {
        toast.info("You are already registered for this competition!");
        return;
      }

      if (needsCompleteRegistration) {
        setRegistration("complete");
        return;
      }

      setRegistration("create");
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

    if (isOrganizer) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
          disabled
        >
          You are the organizer
        </Button>
      );
    }

    if (needsCompleteRegistration) {
      return (
        <div className="space-y-2">
          <Button
            className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
            onClick={async () => {
              setIsStartingRegistration(true);
              try {
                setRegistration("complete");
              } finally {
                setIsStartingRegistration(false);
              }
            }}
            disabled={
              isStartingRegistration || Boolean(isRegistrationClosed)
            }
          >
            {isStartingRegistration ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Complete registration"
            )}
          </Button>
        </div>
      );
    }

    // Team exists and form submitted
    if (isFullyRegistered && myTeam) {
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

    // Team exists but cannot complete without payment (edge case)
    if (hasTeam && myTeam && !isFullyRegistered) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
          disabled
        >
          Registration incomplete
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
          <Button
            className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
            onClick={() => setAuthMode("login")}
          >
            {registerLabel}
          </Button>
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
          className="w-full py-6 rounded-full shadow-sm"
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
      {/* Mobile Title */}
      <h1 className="lg:hidden text-neutral-900 text-3xl font-semibold mb-4 break-all px-1">
        {competition.title}
      </h1>

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
        {competition.thumbnail ? (
          <Image
            src={competition.thumbnail}
            alt={competition.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
            <span className="text-white font-bold opacity-20 text-4xl">
              {competition.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
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

          {/* Team Status Card - shown when user has a team */}
          {hasTeam && myTeam && user && (
            <TeamDetailsCard
              team={myTeam}
              currentUserId={user.id}
              hackathonSlug={competition.slug}
              needsCompleteRegistration={needsCompleteRegistration}
              onCompleteRegistration={() => setRegistration("complete")}
              onUpdate={() => {
                const checkReg = async () => {
                  const token = await getToken();
                  if (token) {
                    const team = await checkMyHackathonTeam(token, competition.id);
                    setMyTeam(team);
                    if (team) {
                      try {
                        const status = await getHackathonRegistrationStatus(
                          token,
                          competition.slug,
                        );
                        setRegistrationStatus(status);
                      } catch {
                        setRegistrationStatus(null);
                      }
                    } else {
                      setRegistrationStatus(null);
                    }
                  }
                };
                void checkReg();
              }}
            />
          )}

          {/* Divider */}
          <div className="h-px bg-neutral-100  w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Participation Capacity */}
            {competition.maxTeams && (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5 text-neutral-800 " />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900  text-sm">
                    {competition.registrationCount || 0}/{competition.maxTeams} Teams
                  </div>
                  <div className="text-xs text-neutral-500">Capacity</div>
                </div>
              </div>
            )}

            {/* Team Size Members */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-neutral-400  flex items-center justify-center shadow-sm">
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

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => {
          setRegistration(null);
          setInvitation(null);
        }}
        competition={competition}
        initialMode={initialMode as any}
        initialInvitationCode={invitation || undefined}
        completionMode={isCompletionFlow}
        onSuccess={async (updatedTeam) => {
          setMyTeam(updatedTeam);
          setRegistration(null);
          setInvitation(null);
          const token = await getToken();
          if (token) {
            try {
              const status = await getHackathonRegistrationStatus(
                token,
                competition.slug,
              );
              setRegistrationStatus(status);
            } catch {
              setRegistrationStatus(null);
            }
          }
        }}
      />
    </div>
  );
}