"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CreateTeamForm } from "@/components/CreateTeamForm";
import { JoinTeamList } from "@/components/JoinTeamList";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import {
  checkMyHackathonTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import { getMe } from "@/lib/api/usersApi";
import Link from "next/link";

type RegistrationMode = "CREATE" | "JOIN";

interface HackathonData {
  id: string;
  name: string;
  slug: string;
  participantType: string;
  isRegistrationPaused: boolean;
  registrationDeadline: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  chargeMode: "PER_TEAM" | "PER_USER";
  registrationForm: {
    id: string;
    externalFormLink: string | null;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      options: string[];
      placeholder: string | null;
    }>;
  } | null;
}

/**
 * Get max team size from participant type.
 */
function getMaxSizeFromParticipantType(participantType: string): number {
  switch (participantType) {
    case "INDIVIDUAL":
      return 1;
    case "TEAM_OF_2":
      return 2;
    case "TEAM_OF_3":
      return 3;
    case "TEAM_OF_4":
      return 4;
    case "TEAM_OF_5":
      return 5;
    case "TEAM_OF_6":
      return 6;
    case "MORE_THAN_6":
      return 10;
    case "TEAM_OF_2_3":
      return 3;
    case "TEAM_OF_2_4":
      return 4;
    case "TEAM_OF_3_4":
      return 4;
    case "TEAM_OF_3_5":
      return 5;
    case "TEAM_OF_4_5":
      return 5;
    case "TEAM_OF_4_6":
      return 6;
    case "TEAM_OF_5_6":
      return 6;
    default:
      return 4;
  }
}

function getMinSizeFromParticipantType(participantType: string): number {
  switch (participantType) {
    case "INDIVIDUAL":
      return 1;
    case "TEAM_OF_2":
      return 2;
    case "TEAM_OF_3":
      return 3;
    case "TEAM_OF_4":
      return 4;
    case "TEAM_OF_5":
      return 5;
    case "TEAM_OF_6":
      return 6;
    case "MORE_THAN_6":
      return 10;
    case "TEAM_OF_2_3":
      return 2;
    case "TEAM_OF_2_4":
      return 2;
    case "TEAM_OF_3_4":
      return 3;
    case "TEAM_OF_3_5":
      return 3;
    case "TEAM_OF_4_5":
      return 4;
    case "TEAM_OF_4_6":
      return 4;
    case "TEAM_OF_5_6":
      return 5;
    default:
      return 4;
  }
}

export default function RegistrationPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();

  const hackathonId = params.get("hackathonId");
  const slug = params.get("slug");

  const [mode, setMode] = useState<RegistrationMode>("CREATE");
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [isLoadingHackathon, setIsLoadingHackathon] = useState(true);
  const [myTeam, setMyTeam] = useState<TeamDetailResponse | null>(null);
  const [isCheckingTeam, setIsCheckingTeam] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setIsLoadingHackathon(false);
        setIsCheckingTeam(false);
        return;
      }

      if (!slug) return;

      setIsCheckingOnboarding(true);
      try {
        const token = await getToken();
        if (!token) return;

        const meData = await getMe(token);
        if (!meData.onboarded) {
          const returnUrl = `/team-register?hackathonId=${hackathonId}&slug=${slug}`;
          router.push(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }
      } catch (err) {
        console.error("Failed to check onboarding:", err);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }

    checkOnboarding();
  }, [isLoaded, isSignedIn, getToken, hackathonId, slug, router]);

  // Fetch hackathon data
  useEffect(() => {
    async function fetchHackathon() {
      if (!slug) return;

      setIsLoadingHackathon(true);
      try {
        const data = (await getPublicHackathonBySlug(slug)) as HackathonData;
        setHackathon(data);
      } catch (err) {
        console.error("Failed to fetch hackathon:", err);
        setError("Failed to load hackathon details.");
      } finally {
        setIsLoadingHackathon(false);
      }
    }

    fetchHackathon();
  }, [slug]);

  // Check if user is already in a team
  useEffect(() => {
    async function checkTeam() {
      const idToCheck = hackathon?.id || hackathonId;
      if (!isSignedIn || !idToCheck) {
        setIsCheckingTeam(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setIsCheckingTeam(false);
          return;
        }

        const team = await checkMyHackathonTeam(token, idToCheck);
        setMyTeam(team);
      } catch (err) {
        console.error("Failed to check team:", err);
      } finally {
        setIsCheckingTeam(false);
      }
    }

    checkTeam();
  }, [isSignedIn, hackathonId, hackathon?.id, getToken]);

  // Loading state
  if (
    !isLoaded ||
    isLoadingHackathon ||
    isCheckingTeam ||
    isCheckingOnboarding
  ) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center">Sign In Required</h1>
        <p className="text-center text-gray-600">
          Please sign in to register for this hackathon.
        </p>
        <div className="flex justify-center">
          <SignInButton mode="modal">
            <Button className="bg-[#9333ea] hover:bg-[#7e22ce] text-white">
              Sign In to Continue
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Missing hackathon ID
  if (!hackathonId || !slug) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center text-red-500">
          Invalid Registration Link
        </h1>
        <p className="text-center text-gray-600">
          This registration link is invalid. Please go back to the competition
          page and try again.
        </p>
        <div className="flex justify-center">
          <Link href="/hackathons">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Competitions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !hackathon) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center text-red-500">Error</h1>
        <p className="text-center text-gray-600">
          {error || "Failed to load hackathon details."}
        </p>
        <div className="flex justify-center">
          <Link href={`/competitions/${slug}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Competition
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Already registered
  if (myTeam) {
    const memberCount = (myTeam.members?.length || 0) + 1; // +1 for leader
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold">Already Registered!</h1>
          <p className="text-gray-600">
            You are already registered for{" "}
            <span className="font-semibold">{hackathon.name}</span>
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Your Team</p>
            <p className="text-xl font-bold">{myTeam.name}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-semibold">
                {memberCount} / {myTeam.maxSize}
              </p>
            </div>
            {myTeam.invitationCode && (
              <div>
                <p className="text-sm text-muted-foreground">Invite Code</p>
                <p className="font-mono font-semibold">
                  {myTeam.invitationCode}
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Team Leader</p>
            <p className="font-semibold">
              {myTeam.leader?.firstName} {myTeam.leader?.lastName}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link href={`/competitions/${slug}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Competition
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if registration is closed
  const isRegistrationClosed =
    hackathon.isRegistrationPaused ||
    (hackathon.registrationDeadline &&
      new Date() > new Date(hackathon.registrationDeadline));

  if (isRegistrationClosed) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center">Registration Closed</h1>
        <p className="text-center text-gray-600">
          Registration for{" "}
          <span className="font-semibold">{hackathon.name}</span> is currently
          closed.
        </p>
        <div className="flex justify-center">
          <Link href={`/competitions/${slug}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Competition
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const maxSize = getMaxSizeFromParticipantType(hackathon.participantType);
  const isIndividual = hackathon.participantType === "INDIVIDUAL";

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
      {/* Back Link */}
      <Link
        href={`/competitions/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to {hackathon.name}
      </Link>

      <h1 className="text-3xl font-bold text-center">
        Register for {hackathon.name}
      </h1>

      {isIndividual ? (
        <p className="text-center text-gray-600">
          This is an individual competition. Create your registration below.
        </p>
      ) : (
        <p className="text-center text-gray-600">
          Choose to create a new team or join an existing one for this
          hackathon.
        </p>
      )}

      {!isIndividual && (
        <div className="flex justify-center gap-4 my-6">
          <Button
            variant={mode === "CREATE" ? "default" : "outline"}
            onClick={() => setMode("CREATE")}
          >
            Create New Team
          </Button>
          <Button
            variant={mode === "JOIN" ? "default" : "outline"}
            onClick={() => setMode("JOIN")}
          >
            Join Existing Team
          </Button>
        </div>
      )}

      <Separator />

      {mode === "CREATE" || isIndividual ? (
        <CreateTeamForm
          hackathonId={hackathon.id}
          hackathonSlug={slug}
          hackathonName={hackathon.name}
          maxSize={maxSize}
          isIndividual={isIndividual}
          registrationForm={hackathon.registrationForm}
          isFree={hackathon.isFree}
          entryFeeAmount={hackathon.entryFeeAmount}
          currency={hackathon.currency}
          chargeMode={hackathon.chargeMode}
        />
      ) : (
        <JoinTeamList
          hackathonId={hackathon.id}
          hackathonSlug={slug}
          hackathonName={hackathon.name}
          registrationForm={hackathon.registrationForm}
          isFree={hackathon.isFree}
          entryFeeAmount={hackathon.entryFeeAmount}
          currency={hackathon.currency}
          chargeMode={hackathon.chargeMode}
        />
      )}
    </div>
  );
}
