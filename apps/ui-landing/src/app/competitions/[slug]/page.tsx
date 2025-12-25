"use client";
import { CompetitionSidebar } from "./_components/CompetitionSidebar";
import { CompetitionTabs } from "./_components/CompetitionTabs";
import { RoundsTimeline } from "./_components/RoundsTimeline";
import { AboutSection } from "./_components/AboutSection";
import { Organizers } from "./_components/Organizers";
import { Prizes } from "./_components/Prizes";
import type {
  CompetitionDetails,
  Round,
  RoundStatus,
  Organizer,
  Prize,
} from "./_components/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

/**
 * Map API round status to UI status.
 */
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

/**
 * Map participant type to team size display.
 */
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
    default:
      return "1+ Members";
  }
}

/**
 * Map prize icon based on position.
 */
function mapPrizeIcon(position: number): "trophy" | "medal" | "star" {
  if (position === 1) return "trophy";
  if (position === 2) return "medal";
  return "star";
}

export default function CompetitionDetailsPage() {
  const { slug } = useParams();
  const [competition, setCompetition] = useState<CompetitionDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curTab, setCurTab] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompetition() {
      if (!slug || typeof slug !== "string") return;

      setIsLoading(true);
      setError(null);

      try {
        const data = (await getPublicHackathonBySlug(slug)) as {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          bannerImageUrl: string | null;
          startDate: string;
          endDate: string;
          mode: string;
          locationType: string | null;
          locationCity: string | null;
          locationAddress: string | null;
          locationVirtualLink: string | null;
          hackathonType: string;
          participantType: string;
          impressions: number;
          registrationDeadline: string | null;
          prizeTotalWorthAmount: number | null;
          currency: string;
          organizationName: string | null;
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
          }>;
          prizeBreakdown: Array<{
            id: string;
            position: number;
            amount: number;
            description: string | null;
          }>;
        };

        // Map API data to CompetitionDetails
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        // Build location string
        let location = "Online";
        if (
          data.locationType === "PHYSICAL" ||
          data.locationType === "OFFLINE"
        ) {
          location = data.locationCity || data.locationAddress || "In-Person";
        } else if (data.locationType === "HYBRID") {
          location = data.locationCity
            ? `${data.locationCity} + Online`
            : "Hybrid";
        }

        // Build date range string
        const dateRange =
          startDate.toDateString() === endDate.toDateString()
            ? format(startDate, "MMMM d, yyyy")
            : `${format(startDate, "MMMM d")} - ${format(endDate, "d, yyyy")}`;

        // Map rounds
        const rounds: Round[] = data.rounds.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          startDate: format(new Date(r.startsAt), "MMM d, yyyy h:mm a"),
          endDate: format(new Date(r.endsAt), "MMM d, yyyy h:mm a"),
          status: mapRoundStatus(r.startsAt, r.endsAt, r.status),
        }));

        // Map organizers (owner + organization)
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

        // Map prizes
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

        // Calculate registration deadline display
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

        // Build tags from hackathon type
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

        const competitionDetails: CompetitionDetails = {
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
          impressions: data.impressions,
          registrationDeadline,
        };

        setCompetition(competitionDetails);
      } catch (err) {
        console.error("Failed to fetch competition:", err);
        setError("Competition not found or not available.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompetition();
  }, [slug]);

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

  // Loading state
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

  // Error state
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <CompetitionSidebar competition={competition} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-6">
              {competition.title}
            </h1>

            <CompetitionTabs
              setCurTab={setCurTab}
              hasRounds={competition.rounds.length > 0}
            />

            <div className="space-y-12">
              {competition.rounds.length > 0 && (
                <section id="rounds" className="scroll-mt-24">
                  <RoundsTimeline rounds={competition.rounds} />
                </section>
              )}

              <section id="details" className="scroll-mt-24">
                <AboutSection content={competition.about} />
              </section>

              <section className="scroll-mt-24">
                {/* Note: In image, this is 'Organizers' visualized after about, 
                      though image labels it 'Rounds Timeline' again erroneously. 
                      I am placing it here to match flow. */}
                <Organizers organizers={competition.organizers} />
              </section>

              <section id="prizes" className="scroll-mt-24">
                <Prizes prizes={competition.prizes} />
              </section>

              <section id="reviews" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Reviews
                </h2>
                <div className="p-12 text-center text-muted-foreground bg-neutral-50  border border-dashed rounded-xl">
                  Reviews coming soon...
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
