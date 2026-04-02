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

function mapTeamSize(participantType: string): string {
  switch (participantType) {
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

export function mapMaxSize(participantType: string): number {
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

function mapPrizeIcon(position: number): "trophy" | "coin" | "gift" | "star" {
  if (position === 1) return "trophy";
  if (position === 2) return "coin";
  if (position === 3) return "gift";
  return "star";
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
    startDate: format(new Date(r.startsAt), "MMM d, yyyy h:mm a"),
    endDate: format(new Date(r.endsAt), "MMM d, yyyy h:mm a"),
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
