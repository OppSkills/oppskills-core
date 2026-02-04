"use client";
import { CompetitionSidebar } from "./_components/CompetitionSidebar";
import { CompetitionTabs } from "./_components/CompetitionTabs";
import { RoundsTimeline } from "./_components/RoundsTimeline";
import { AboutSection } from "./_components/AboutSection";
import { Organizers } from "./_components/Organizers";
import { Prizes } from "./_components/Prizes";
import { Attachments } from "./_components/Attachments";
import type {
  CompetitionDetails,
  Round,
  RoundStatus,
  Organizer,
  Prize,
} from "./_components/types";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  getPublicHackathonBySlug,
  getHackathonBySlug,
  getMyTeamSubmissions,
  type MyTeamSubmissionsResponse,
  type RoundSubmissionInfo,
} from "@/lib/api/hackathonApi";
import { checkMyHackathonTeam } from "@/lib/api/teamApi";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

function mapRoundStatus(
  startsAt: string,
  endsAt: string,
  status?: string
): RoundStatus {
  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (status === "COMPLETED" || now > end) return "completed";
  if (status === "ONGOING" || (now >= start && now <= end)) return "live";
  return "upcoming";
}

function mapTeamSize(participantType: string): string {
  switch (participantType) {
    case "INDIVIDUAL":
      return "1 Member";
    case "TEAM_OF_2":
      return "2 Members";
    case "TEAM_OF_3":
      return "3 Members";
    case "TEAM_OF_4":
      return "4 Members";
    case "TEAM_OF_5":
      return "5 Members";
    case "TEAM_OF_6":
      return "6 Members";
    case "MORE_THAN_6":
      return "6+ Members";
    case "TEAM_OF_2_3":
      return "2-3 Members";
    case "TEAM_OF_2_4":
      return "2-4 Members";
    case "TEAM_OF_3_4":
      return "3-4 Members";
    case "TEAM_OF_3_5":
      return "3-5 Members";
    case "TEAM_OF_4_5":
      return "4-5 Members";
    case "TEAM_OF_4_6":
      return "4-6 Members";
    case "TEAM_OF_5_6":
      return "5-6 Members";
    default:
      return "1+ Members";
  }
}

function mapPrizeIcon(position: number): "trophy" | "medal" | "star" {
  if (position === 1) return "trophy";
  if (position === 2) return "medal";
  return "star";
}

export interface HackathonApiData {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  approvalStatus?: string;
  mode: string;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  hackathonType: string;
  participantType: string;
  impressions?: number;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  prizeTotalWorthAmount: number | null;
  currency: string;
  isFree: boolean;
  entryFeeAmount: number | null;
  organizationName: string | null;
  maxTeams?: number | null;
  registrationCount?: number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
  rounds: Array<{
    id: string;
    name: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    order: number;
    roundType: string;
    status: string;
    submissionConfig?: {
      enabled?: boolean;
      requiresFileUpload?: boolean;
      allowedFileTypes?: string[];
      maxFileSizeBytes?: number;
      requiresLinkSubmission?: boolean;
      requiresDescription?: boolean;
      instructions?: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    storageKey: string;
    publicUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
  }>;
  prizeBreakdown: Array<{
    id: string;
    position: number;
    amount: number;
    description: string | null;
  }>;
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

function transformApiData(data: HackathonApiData): CompetitionDetails {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  let location = "Online";
  if (data.locationType === "PHYSICAL" || data.locationType === "OFFLINE") {
    location = data.locationCity || data.locationAddress || "In-Person";
  } else if (data.locationType === "HYBRID") {
    location = data.locationCity ? `${data.locationCity} + Online` : "Hybrid";
  }

  const dateRange =
    startDate.toDateString() === endDate.toDateString()
      ? format(startDate, "MMMM d, yyyy")
      : `${format(startDate, "MMMM d")} - ${format(endDate, "d, yyyy")}`;

  const rounds: Round[] = data.rounds.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    startDate: format(new Date(r.startsAt), "MMM d, yyyy h:mm a"),
    endDate: format(new Date(r.endsAt), "MMM d, yyyy h:mm a"),
    status: mapRoundStatus(r.startsAt, r.endsAt, r.status),
    roundType: (r.roundType as any) ?? "ONLINE",
    submissionConfig: r.submissionConfig
      ? {
        ...r.submissionConfig,
        // Normalize: set enabled based on requiresFileUpload if enabled is not explicitly set
        enabled:
          r.submissionConfig.enabled ?? r.submissionConfig.requiresFileUpload,
      }
      : undefined,
  }));

  const organizers: Organizer[] = [];
  if (data.owner) {
    const ownerName = [data.owner.firstName, data.owner.lastName]
      .filter(Boolean)
      .join(" ");
    organizers.push({
      id: data.owner.id,
      name: ownerName || "Organizer",
      role: "Organizer",
      avatar: data.owner.imageUrl || "",
      company: data.organizationName || undefined,
    });
  }

  const prizes: Prize[] = data.prizeBreakdown.map((p) => {
    const amountValue = p.amount ?? 0;
    return {
      id: p.id,
      title:
        p.position === 1
          ? "Winner"
          : p.position === 2
            ? "1st Runner Up"
            : p.position === 3
              ? "2nd Runner Up"
              : `Position ${p.position}`,
      amount: `${data.currency} ${amountValue.toLocaleString()}`,
      description: p.description || "",
      icon: mapPrizeIcon(p.position),
    };
  });

  let registrationDeadline = "Open";
  if (data.registrationDeadline) {
    const deadline = new Date(data.registrationDeadline);
    if (deadline > new Date()) {
      registrationDeadline = formatDistanceToNow(deadline, {
        addSuffix: false,
      });
    } else {
      registrationDeadline = "Closed";
    }
  }

  const tags: string[] = [];
  if (data.hackathonType) {
    tags.push(
      data.hackathonType
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }
  if (data.mode) {
    tags.push(data.mode);
  }

  const attachments = (data.attachments || []).map((att) => ({
    id: att.id,
    fileName: att.fileName || "Attachment",
    publicUrl: att.publicUrl || "",
    mimeType: att.mimeType || undefined,
    sizeBytes: att.sizeBytes || undefined,
  }));

  return {
    id: data.id,
    slug: data.slug,
    title: data.name,
    thumbnail: data.bannerImageUrl || "",
    location,
    dateRange,
    tags,
    about: data.description || "",
    rounds,
    organizers,
    prizes,
    featuredIn: data.festival?.name,
    specificDate: format(startDate, "EEEE, d MMMM yyyy"),
    specificTime: `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`,
    venueName:
      data.locationType === "VIRTUAL"
        ? "Online Event"
        : data.organizationName || undefined,
    venueAddress: data.locationAddress || data.locationCity || undefined,
    teamSize: mapTeamSize(data.participantType),
    impressions: data.impressions ?? 0,
    registrationDeadline,
    participantType: data.participantType,
    registrationForm: data.registrationForm,
    isRegistrationPaused: data.isRegistrationPaused,
    registrationDeadlineDate: data.registrationDeadline
      ? new Date(data.registrationDeadline)
      : null,
    maxTeams: data.maxTeams,
    registrationCount: data.registrationCount ?? 0,
    isFree: data.isFree,
    entryFeeAmount: data.entryFeeAmount,
    currency: data.currency,
    contact:
      data.contactName || data.contactEmail || data.contactPhone
        ? {
          name: data.contactName || "",
          email: data.contactEmail || "",
          phone: data.contactPhone || "",
        }
        : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
    createdAt: data.createdAt,
    startDate,
    endDate,
  };
}

export function CompetitionDetailsClient() {
  const { slug } = useParams();
  const { getToken, isSignedIn, userId } = useAuth();
  const [competition, setCompetition] = useState<CompetitionDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curTab, setCurTab] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [myTeam, setMyTeam] = useState<{
    id: string;
    name: string;
    leaderId: string;
  } | null>(null);
  const [mySubmissions, setMySubmissions] = useState<
    MyTeamSubmissionsResponse["submissions"]
  >({});
  const [myQualifications, setMyQualifications] = useState<
    MyTeamSubmissionsResponse["qualifications"]
  >({});

  const submissionsByRoundId = useMemo(() => {
    const map: Record<string, RoundSubmissionInfo> = {};
    const safeSubmissions = mySubmissions || {};
    for (const roundId in safeSubmissions) {
      map[roundId] = safeSubmissions[roundId];
    }
    return map;
  }, [mySubmissions]);

  const qualificationsByRoundId = useMemo(() => {
    const map: Record<string, { qualified: boolean; qualifiedAt?: string }> =
      {};
    const safeQualifications = myQualifications || {};
    for (const roundId in safeQualifications) {
      const qual = safeQualifications[roundId];
      map[roundId] = {
        qualified: qual.qualified,
        qualifiedAt: qual.qualifiedAt ?? undefined,
      };
    }
    return map;
  }, [myQualifications]);

  useEffect(() => {
    async function fetchCompetition() {
      if (!slug || typeof slug !== "string") return;

      setIsLoading(true);
      setError(null);
      setIsDraft(false);

      try {
        const data = (await getPublicHackathonBySlug(slug)) as HackathonApiData;
        setCompetition(transformApiData(data));
        console.log("competition data1", transformApiData(data));
      } catch (publicErr) {
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              const data = (await getHackathonBySlug(
                token,
                slug
              )) as HackathonApiData;
              setCompetition(transformApiData(data));
              console.log("competition data", transformApiData(data));
              setIsDraft(true);
              return;
            }
          } catch { }
        }
        console.error("Failed to fetch competition:", publicErr);
        setError("Competition not found or not available.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompetition();
  }, [slug, isSignedIn, getToken]);

  useEffect(() => {
    async function fetchTeamAndSubmissions() {
      if (!isSignedIn || !competition?.id || typeof slug !== "string") return;

      try {
        const token = await getToken();
        if (!token) return;

        const teamResult = await checkMyHackathonTeam(token, competition.id);
        if (teamResult) {
          setMyTeam({
            id: teamResult.id,
            name: teamResult.name,
            leaderId: teamResult.leader.id,
          });

          const submissionsResult = await getMyTeamSubmissions(token, slug);
          if (submissionsResult) {
            setMySubmissions(submissionsResult.submissions || {});
            setMyQualifications(submissionsResult.qualifications || {});
          }
        }
      } catch (err) {
        console.error("Failed to fetch team/submissions:", err);
      }
    }

    fetchTeamAndSubmissions();
  }, [isSignedIn, competition?.id, slug, getToken]);

  useEffect(() => {
    if (curTab) {
      const element = document.getElementById(curTab);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [curTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <h2 className="text-2xl font-bold text-foreground">
              Competition Not Found
            </h2>
            <p className="text-muted-foreground">
              {error ||
                "This competition may not exist or is not publicly available."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {isDraft && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-700">Draft Preview</p>
              <p className="text-sm text-yellow-600">
                This competition is not published yet. Only you and your team
                can see this page.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <CompetitionSidebar competition={competition} />
          </div>

          <div className="lg:col-span-2">
            <h1 className="text-4xl font-semibold text-neutral-900 leading-tight mb-6">
              {competition.title}
            </h1>

            <CompetitionTabs
              setCurTab={setCurTab}
              hasRounds={competition.rounds.length > 0}
              hasAttachments={
                !!competition.attachments && competition.attachments.length > 0
              }
            />

            <div className="space-y-12">
              {competition.rounds.length > 0 && (
                <section id="rounds" className="scroll-mt-24">
                  <RoundsTimeline
                    rounds={competition.rounds}
                    myTeam={myTeam}
                    submissionsByRoundId={submissionsByRoundId}
                    qualificationsByRoundId={qualificationsByRoundId}
                    competitionSlug={
                      typeof slug === "string" ? slug : undefined
                    }
                    currentUserId={userId || undefined}
                  />
                </section>
              )}

              <section id="details" className="scroll-mt-24">
                <AboutSection content={competition.about} />
              </section>



              <section className="scroll-mt-24">
                <Organizers
                  organizers={competition.organizers}
                  contact={competition.contact}
                />
              </section>

              {competition.attachments &&
                competition.attachments.length > 0 && (
                  <section id="attachments" className="scroll-mt-24">
                    <Attachments attachments={competition.attachments} />
                  </section>
                )}

              <section id="prizes" className="scroll-mt-24">
                <Prizes prizes={competition.prizes} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
