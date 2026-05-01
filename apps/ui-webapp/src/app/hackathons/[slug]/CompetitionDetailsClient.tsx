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
import { AlertTriangle } from "lucide-react";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { HackathonDetailFallback } from "@/components/boneyard/loading-fallbacks";
import { useAuth } from "@clerk/nextjs";
import { transformApiData, type HackathonApiData } from "./_components/transform";

// Functions moved to transform.ts

export function CompetitionDetailsClient({
  initialData,
}: {
  initialData?: CompetitionDetails;
}) {
  const { slug } = useParams();
  const { getToken, isSignedIn, userId } = useAuth();
  const [competition, setCompetition] = useState<CompetitionDetails | null>(
    initialData || null
  );
  const [isLoading, setIsLoading] = useState(!initialData);
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
      if (competition?.slug === slug && !isDraft) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsDraft(false);

      try {
        const data = (await getPublicHackathonBySlug(slug)) as HackathonApiData;
        setCompetition(transformApiData(data));
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

  if (error || (!isLoading && !competition)) {
    return (
      <div className="min-h-screen bg-transparent py-8 px-0 sm:px-6 lg:px-8 pb-8 sm:pt-12 xl:px-25">
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
    <BoneyardSkeleton
      loading={isLoading}
      name="hackathon-competition-detail"
      className="min-h-screen w-full bg-transparent pb-8 sm:pt-12"
      fallback={<HackathonDetailFallback />}
    >
      {competition ? (
        <div className="container mx-auto max-w-7xl p-4">
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
            <div className="lg:col-span-1 lg:sticky lg:top-24">
              <CompetitionSidebar competition={competition} />
            </div>

            <div className="lg:col-span-2">
              <h1 className="hidden lg:block text-4xl font-semibold text-neutral-900 leading-tight mb-6">
                {competition.title}
              </h1>

              <CompetitionTabs
                setCurTab={setCurTab}
                hasRounds={competition.rounds.length > 0}
                hasAttachments={
                  !!competition.attachments && competition.attachments.length > 0
                }
                title={competition.title}
                slug={competition.slug}
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
      ) : null}
    </BoneyardSkeleton>
  );
}
