"use client";
import { CompetitionSidebar } from "./_components/CompetitionSidebar";
import { CompetitionTabs } from "./_components/CompetitionTabs";
import { RoundsTimeline } from "./_components/RoundsTimeline";
import { AboutSection } from "./_components/AboutSection";
import { Organizers } from "./_components/Organizers";
import { Prizes } from "./_components/Prizes";
import { CompetitionDetails } from "./_components/types";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHackathonBySlug } from "@/hooks/useHackathonBySlug";

/**
 * Type guard: checks if a value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const value = obj[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(
  obj: Record<string, unknown>,
  key: string
): number | undefined {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function normalizeSlug(input: unknown): string | null {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(input) && typeof input[0] === "string") {
    const trimmed = input[0].trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function extractHackathon(input: unknown): Record<string, unknown> | null {
  if (!isRecord(input)) return null;
  const maybeData = input["data"];
  return isRecord(maybeData) ? maybeData : input;
}

function formatDateRange(
  start: Date | undefined,
  end: Date | undefined
): string {
  if (!start && !end) return "—";
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  if (start && end) {
    if (start.toDateString() === end.toDateString()) return fmt(start);
    return `${fmt(start)} - ${fmt(end)}`;
  }
  return fmt(start ?? end ?? new Date());
}

function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeRegistrationDeadlineLabel(deadline: Date | undefined): string {
  if (!deadline) return "—";
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Closed";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${days} Days`;
}

function formatMoney(
  amountDecimal: string,
  currency: string | undefined
): string {
  const safeCurrency = (currency ?? "INR").trim().toUpperCase();
  const n = Number(amountDecimal);
  if (!Number.isFinite(n)) return amountDecimal;
  const formatted = n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
  if (safeCurrency === "INR") return `₹ ${formatted}`;
  return `${safeCurrency} ${formatted}`;
}

export default function CompetitionDetailsPage() {
  const params = useParams();
  const slug = useMemo(
    () => normalizeSlug(isRecord(params) ? params["slug"] : params),
    [params]
  );

  const { data: hackathonRaw, isLoading, error } = useHackathonBySlug(slug);

  const [curTab, setCurTab] = useState<string | null>(null);
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

  const competition = useMemo<CompetitionDetails | null>(() => {
    const hackathon = extractHackathon(hackathonRaw);
    if (!hackathon) return null;

    const startDate = getDate(hackathon["startDate"]);
    const endDate = getDate(hackathon["endDate"]);
    const registrationDeadline = getDate(hackathon["registrationDeadline"]);

    const locationVirtualLink = getString(hackathon, "locationVirtualLink");
    const locationAddress = getString(hackathon, "locationAddress");
    const locationCity = getString(hackathon, "locationCity");
    const location = locationVirtualLink
      ? locationVirtualLink
      : [locationAddress, locationCity]
          .filter((v): v is string => typeof v === "string" && v.length > 0)
          .join(", ");

    const owner = isRecord(hackathon["owner"]) ? hackathon["owner"] : null;
    const ownerName =
      owner &&
      (getString(owner, "firstName") ||
        getString(owner, "email") ||
        getString(owner, "id"))
        ? [getString(owner, "firstName"), getString(owner, "lastName")]
            .filter((v): v is string => typeof v === "string" && v.length > 0)
            .join(" ")
            .trim() ||
          (getString(owner, "email") ?? "Organizer")
        : "Organizer";

    const festival = isRecord(hackathon["festival"])
      ? hackathon["festival"]
      : null;
    const featuredIn = festival ? getString(festival, "name") : undefined;

    const hackathonType = getString(hackathon, "hackathonType");
    const participantType = getString(hackathon, "participantType");
    const mode = getString(hackathon, "mode");

    const tags = [hackathonType, participantType, mode]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .slice(0, 6);

    const roundsRaw = Array.isArray(hackathon["rounds"])
      ? (hackathon["rounds"] as ReadonlyArray<unknown>)
      : [];
    const rounds = roundsRaw
      .map((r, idx) => {
        if (!isRecord(r)) return null;
        const startsAt = getDate(r["startsAt"]);
        const endsAt = getDate(r["endsAt"]);
        if (!startsAt || !endsAt) return null;
        const now = Date.now();
        const status =
          endsAt.getTime() < now
            ? "completed"
            : startsAt.getTime() <= now
              ? "live"
              : "upcoming";
        return {
          id: getString(r, "id") ?? `${idx}`,
          name: getString(r, "name") ?? `Round ${idx + 1}`,
          description: getString(r, "description") ?? "",
          startDate: formatDateTime(startsAt),
          endDate: formatDateTime(endsAt),
          status,
        } as const;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const prizesRaw = Array.isArray(hackathon["prizeBreakdown"])
      ? (hackathon["prizeBreakdown"] as ReadonlyArray<unknown>)
      : [];
    const currency = getString(hackathon, "currency");
    const prizes = prizesRaw
      .map((p, idx) => {
        if (!isRecord(p)) return null;
        const position = getString(p, "position");
        const amount = getString(p, "amount");
        if (!position || !amount) return null;
        const icon = idx === 0 ? "trophy" : idx === 1 ? "medal" : "star";
        return {
          id: getString(p, "id") ?? `${idx}`,
          title: position,
          amount: formatMoney(amount, currency),
          description: getString(p, "description") ?? "",
          icon,
        } as const;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const impressions = getNumber(hackathon, "impressions");

    return {
      id: getString(hackathon, "id") ?? "unknown",
      slug: getString(hackathon, "slug") ?? slug ?? "unknown",
      title: getString(hackathon, "name") ?? "Untitled",
      thumbnail: getString(hackathon, "bannerImageUrl") ?? "/tmp/hackathon.jpg",
      location: location.length > 0 ? location : "—",
      dateRange: formatDateRange(startDate, endDate),
      tags,
      about:
        getString(hackathon, "description") ??
        "<p>No description provided yet.</p>",
      rounds,
      organizers: [
        {
          id: owner ? (getString(owner, "id") ?? "owner") : "owner",
          name: ownerName,
          role: "Organizer",
          avatar: owner ? (getString(owner, "imageUrl") ?? "") : "",
          company: undefined,
        },
      ],
      prizes,
      featuredIn,
      specificDate: startDate
        ? startDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "2-digit",
          })
        : undefined,
      specificTime: startDate
        ? startDate.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
      venueName: undefined,
      venueAddress: locationAddress ?? locationCity,
      teamSize: participantType ?? undefined,
      impressions,
      registrationDeadline:
        computeRegistrationDeadlineLabel(registrationDeadline),
    };
  }, [hackathonRaw, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="p-6 text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load competition.";
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="p-6 text-destructive-foreground">{message}</div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="p-6 text-muted-foreground">No data found.</div>
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

            <CompetitionTabs setCurTab={setCurTab} />

            <div className="space-y-12">
              <section id="rounds" className="scroll-mt-24">
                <RoundsTimeline rounds={competition.rounds} />
              </section>

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
                <div className="p-12 text-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900 border border-dashed rounded-xl">
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
