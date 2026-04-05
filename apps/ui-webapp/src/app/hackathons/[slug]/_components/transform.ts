import { format, formatDistanceToNow } from "date-fns";
import type {
  CompetitionDetails,
  Round,
  RoundStatus,
  Organizer,
  Prize,
} from "./types";

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
  chargeMode?: "PER_TEAM" | "PER_USER";
  feeBearer?: "ORGANISER" | "PARTICIPANT";
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
  prizeCertificate: boolean;
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

function mapTeamSize(participantType?: string | null): string {
  const type = (participantType || "").toUpperCase().trim();
  switch (type) {
    case "INDIVIDUAL":
      return "Individual";
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

export function mapMaxSize(participantType?: string | null): number {
  const type = (participantType || "").toUpperCase().trim();
  switch (type) {
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
    default: {
      const matches = type.match(/\d+/g);
      if (!matches || matches.length === 0) return 4;
      return Math.max(...matches.map(Number));
    }
  }
}

function mapPrizeIcon(position: number): "trophy" | "coin" | "gift" | "star" {
  if (position === 1) return "trophy";
  if (position === 2) return "coin";
  if (position === 3) return "gift";
  return "star";
}

/**
 * Formats a date to Indian Standard Time (IST, UTC+5:30)
 * Format: MMM d, yyyy h:mm a (e.g., Apr 8, 2026 9:00 AM)
 */
export function formatToIST(dateInput: string | Date, formatType: "datetime" | "date" | "time" | "short_month" | "day" = "datetime"): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  if (formatType === "short_month") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
    }).format(date);
  }

  if (formatType === "day") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
    }).format(date);
  }
  
  if (formatType === "date") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (formatType === "time") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  
  // Construct "MMM d, yyyy h:mm a (IST)"
  return `${getPart("month")} ${getPart("day")}, ${getPart("year")} ${getPart("hour")}:${getPart("minute")} ${getPart("dayPeriod")} (IST)`;
}

export function transformApiData(data: HackathonApiData): CompetitionDetails {
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
    startDate: formatToIST(r.startsAt),
    endDate: formatToIST(r.endsAt),
    status: mapRoundStatus(r.startsAt, r.endsAt, r.status),
    roundType: (r.roundType as any) ?? "ONLINE",
    submissionConfig: r.submissionConfig
      ? {
        ...r.submissionConfig,
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

  const prizes: Prize[] = data.prizeBreakdown.map((p, index) => {
    const amountValue = p.amount ?? 0;
    const positionNum = Number(p.position) || 0;
    
    // For the first three prizes, use fixed icons/images based on their order in the array
    const rank = index + 1;
    
    return {
      id: p.id,
      title:
        p.position === 1 || rank === 1
          ? "Winner"
          : p.position === 2 || rank === 2
            ? "1st Runner Up"
            : p.position === 3 || rank === 3
              ? "2nd Runner Up"
              : `Position ${p.position}`,
      amount: `${data.currency} ${amountValue.toLocaleString()}`,
      description: p.description || "",
      icon: mapPrizeIcon(rank <= 3 ? rank : positionNum),
      image:
        rank === 1
          ? "trophy.svg"
          : rank === 2
            ? "coin.svg"
            : rank === 3
              ? "gift.svg"
              : "star.svg",
      tags: data.prizeCertificate ? ["Appreciation Certificate"] : [],
    };
  });

  // Add Participation prize if certificate is enabled and not already in breakdown
  const hasParticipation = prizes.some(
    (p) =>
      p.title?.toLowerCase().includes("participation") ||
      p.description?.toLowerCase().includes("participation")
  );

  if (data.prizeCertificate && !hasParticipation) {
    prizes.push({
      id: "participation-prize",
      title: "Participation",
      amount: "Goodies",
      description: "For all participants",
      image: "star.svg",
      tags: ["Participation Certificate"],
      icon: "star",
    });
  }

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
    specificDate: formatToIST(startDate, "date"),
    specificTime: `${formatToIST(startDate, "time")} - ${formatToIST(endDate, "time")}`,
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
    chargeMode: data.chargeMode,
    currency: data.currency,
    feeBearer: data.feeBearer,
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
