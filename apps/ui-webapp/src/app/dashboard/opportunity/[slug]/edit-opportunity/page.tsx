"use client";

import {
  FileEdit,
  Trophy,
  LayoutTemplate,
  CheckCircle2,
  FileText,
  Settings,
  Calendar as CalendarIcon,
  Clock,
  AlignLeft,
  MapPin,
  ChevronDown,
  Wand2,
  Users,
  Globe,
} from "lucide-react";
import InputBlock from "@/components/ui/derived/InputBlock";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import RegistrationQuestionsModal, { RegistrationQuestion } from "@/components/ui/hackathon/RegistrationQuestionsModal";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useHackathonBySlug } from "@/hooks/useHackathonBySlug";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);
import type {
  HackathonAttendeeEligibilityValue,
  HackathonLocationDto,
  HackathonModeValue,
  PrizeBreakdownDto,
  RegistrationFieldTypeValue,
  RegistrationFormDto,
  UpdateHackathonAdditionalInfoDto,
  UpdateHackathonDto,
  UpdateHackathonRoundsDto,
} from "@oppskills/types/frontend";
import {
  updateHackathon,
  updateHackathonAdditionalInfo,
  updateHackathonMaxTeams,
  updateHackathonPrizeBreakdown,
  updateHackathonRegistrationForm,
  updateHackathonRounds,
} from "@/lib/api/hackathonApi";

// Import new components
// import BasicDetails from "./_components/BasicDetails"; // Removed
import RoundsAndStages from "./_components/RoundsAndStages";
import AdditionalInfo from "./_components/AdditionalInfo";
import Prizes from "./_components/Prizes";
import RegistrationSettings from "./_components/RegistrationSettings";
import { CompetitionDetailsClient } from "@/app/hackathons/[slug]/CompetitionDetailsClient";
import { presignImageUpload } from "@/lib/api/mediaApi";

/**
 * Shared Types
 */
export interface RoundSubmissionConfig {
  enabled: boolean;
  allowedFileTypes: ("pdf" | "ppt" | "image")[];
  maxFiles: number;
  maxFileSizeBytes: number;
  allowResubmission: boolean;
  instructions?: string;
}

export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  roundType: "ONLINE" | "OFFLINE" | "PRESENTATION";
  submissionConfig?: RoundSubmissionConfig;
}

export interface RegistrationSettingsData {
  candidateTypes: string[];
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  eventDate: Date | undefined;
  eventTime: string;
  maxTeamsNoLimit: boolean;
  maxTeams?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
}

export interface Prize {
  id: string;
  name: string;
  amount: string;
  description: string;
}

export interface PrizesData {
  description: string;
  certificateProvided: boolean | null;
  list: Prize[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Attachment {
  id: string;
  title: string;
  type: string;
  mimeType?: string;
  url?: string;
  size?: number;
}

export interface AdditionalInfoData {
  contacts: Contact[];
  attachments: Attachment[];
}

export interface FormData {
  eventFestName: string;
  festivalId?: string;
  eventFestVisibility: string;
  eventName: string;
  eventDate: Date | undefined;
  /**
   * Optional end date for multi-day events.
   * - When omitted, endDate falls back to `eventDate` when saving.
   */
  eventEndDate: Date | undefined;
  eventLocation: string;
  eventTimeFrom: string;
  /**
   * Optional end time (HH:mm).
   * - When omitted, endDate falls back to `eventTimeFrom` when saving.
   */
  eventTimeTo: string | undefined;
  eventDescription: string;
  eventThumbnail: string;
  eventRegisterBy: Date | undefined;
  hackathonType: string;
  participantType: string;
  registrationQuestions: RegistrationQuestion[];
  rounds: Round[];
  registrationSettings: RegistrationSettingsData;
  prizes: PrizesData;
  additionalInfo: AdditionalInfoData;
}

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
    ? value
    : undefined;
}

function getDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function pad2(input: number): string {
  return String(input).padStart(2, "0");
}

function toTimeHHmm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function toVisibilityValue(
  label: string
): "PUBLIC" | "PRIVATE" | "UNIVERSITY_ONLY" | undefined {
  if (label === "Public") return "PUBLIC";
  if (label === "Private") return "PRIVATE";
  if (label === "University only") return "UNIVERSITY_ONLY";
  return undefined;
}

function toHackathonTypeValue(
  label: string
):
  | "CODING_HACKATHON"
  | "IDEA_HACKATHON"
  | "CASE_STUDY_COMPETITION"
  | "DESIGN_HACKATHON"
  | "OPEN_HACKATHON"
  | undefined {
  if (label === "Coding Hackathon") return "CODING_HACKATHON";
  if (label === "Idea Hackathon") return "IDEA_HACKATHON";
  if (label === "Case Study Competition") return "CASE_STUDY_COMPETITION";
  if (label === "Design Hackathon") return "DESIGN_HACKATHON";
  if (label === "Open Hackathon") return "OPEN_HACKATHON";
  return undefined;
}

function toParticipantTypeValue(
  label: string
):
  | "INDIVIDUAL"
  | "TEAM_OF_2"
  | "TEAM_OF_3"
  | "TEAM_OF_4"
  | "TEAM_OF_5"
  | "TEAM_OF_6"
  | "MORE_THAN_6"
  | "TEAM_OF_2_3"
  | "TEAM_OF_2_4"
  | "TEAM_OF_3_4"
  | "TEAM_OF_3_5"
  | "TEAM_OF_4_5"
  | "TEAM_OF_4_6"
  | "TEAM_OF_5_6"
  | undefined {
  if (label === "Individual") return "INDIVIDUAL";
  if (label === "Team of 2") return "TEAM_OF_2";
  if (label === "Team of 3") return "TEAM_OF_3";
  if (label === "Team of 4") return "TEAM_OF_4";
  if (label === "Team of 5") return "TEAM_OF_5";
  if (label === "Team of 6") return "TEAM_OF_6";
  if (label === "More than 6") return "MORE_THAN_6";
  if (label === "Team of 2-3") return "TEAM_OF_2_3";
  if (label === "Team of 2-4") return "TEAM_OF_2_4";
  if (label === "Team of 3-4") return "TEAM_OF_3_4";
  if (label === "Team of 3-5") return "TEAM_OF_3_5";
  if (label === "Team of 4-5") return "TEAM_OF_4_5";
  if (label === "Team of 4-6") return "TEAM_OF_4_6";
  if (label === "Team of 5-6") return "TEAM_OF_5_6";
  return undefined;
}

function toLocationDto(input: string): HackathonLocationDto | undefined {
  const trimmed = input.trim();
  if (trimmed.length === 0) return undefined;
  if (isValidUrl(trimmed)) return { type: "VIRTUAL", virtualLink: trimmed };
  return { type: "PHYSICAL", address: trimmed };
}

function toModeValue(locationInput: string): HackathonModeValue {
  return isValidUrl(locationInput.trim()) ? "ONLINE" : "OFFLINE";
}

function combineDateAndTimeToIso(date: Date, timeHHmm: string): string {
  const time = timeHHmm.trim();
  const [hhRaw, mmRaw] = time.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) {
    throw new Error(`Invalid time value: "${timeHHmm}"`);
  }
  const d = new Date(date.getTime());
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function mapCandidateTypesToEligibility(
  input: ReadonlyArray<string>
): HackathonAttendeeEligibilityValue[] {
  const out: HackathonAttendeeEligibilityValue[] = [];
  const add = (v: HackathonAttendeeEligibilityValue) => {
    if (!out.includes(v)) out.push(v);
  };
  for (const t of input) {
    if (t === "Everyone can apply") add("EVERYONE_CAN_APPLY");
    if (t === "School students") add("SCHOOL_STUDENTS");
    if (t === "College students") add("COLLEGE_STUDENTS");
    if (t === "Freshers") add("FRESHERS");
    if (t === "Professionals") add("PROFESSIONALS");
  }
  return out.length > 0 ? out : ["EVERYONE_CAN_APPLY"];
}

function mapRegistrationQuestionsToRegistrationForm(
  questions: ReadonlyArray<RegistrationQuestion>
): RegistrationFormDto {
  const typeMap: Record<
    RegistrationQuestion["type"],
    RegistrationFieldTypeValue
  > = {
    Text: "TEXT",
    "Phone No.": "PHONE_NO",
    Email: "EMAIL",
    Attachments: "ATTACHMENTS",
    Number: "NUMBER",
    Options: "OPTIONS",
  };

  return {
    fields: questions.map((q, idx) => ({
      label: q.label,
      type: typeMap[q.type],
      required: q.required,
      order: idx,
      options: q.type === "Options" ? (q.options ?? []) : [],
      placeholder: undefined,
    })),
  };
}

function parseCurrencyToDecimalString(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (/[a-zA-Z]/.test(trimmed)) return null;
  const normalized = trimmed.replace(/[^0-9.]/g, "");
  if (normalized.length === 0) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

function serializeFormData(value: FormData): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

function serializeRounds(value: ReadonlyArray<Round>): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

function serializePrizeBreakdown(
  value: ReadonlyArray<PrizeBreakdownDto>
): string {
  return JSON.stringify(value);
}

function serializeAdditionalInfo(value: AdditionalInfoData): string {
  return JSON.stringify(value);
}

type AutoSaveUiStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function fromVisibility(value: string | undefined): string {
  const v = (value ?? "").toUpperCase();
  if (v === "PRIVATE") return "Private";
  if (v === "UNIVERSITY_ONLY") return "University only";
  return "Public";
}

function fromHackathonType(value: string | undefined): string {
  const v = (value ?? "").toUpperCase();
  if (v === "IDEA_HACKATHON") return "Idea Hackathon";
  if (v === "OPEN_HACKATHON") return "Open Hackathon";
  return "Coding Hackathon";
}

function fromParticipantType(value: string | undefined): string {
  const v = (value ?? "").toUpperCase();
  if (v === "TEAM_OF_2") return "Team of 2";
  if (v === "TEAM_OF_3") return "Team of 3";
  if (v === "TEAM_OF_4") return "Team of 4";
  if (v === "TEAM_OF_5") return "Team of 5";
  if (v === "TEAM_OF_6") return "Team of 6";
  if (v === "MORE_THAN_6") return "More than 6";
  if (v === "TEAM_OF_2_3") return "Team of 2-3";
  if (v === "TEAM_OF_2_4") return "Team of 2-4";
  if (v === "TEAM_OF_3_4") return "Team of 3-4";
  if (v === "TEAM_OF_3_5") return "Team of 3-5";
  if (v === "TEAM_OF_4_5") return "Team of 4-5";
  if (v === "TEAM_OF_4_6") return "Team of 4-6";
  if (v === "TEAM_OF_5_6") return "Team of 5-6";
  return "Individual";
}

function fromAttendeeEligibility(values: unknown): ReadonlyArray<string> {
  const raw = Array.isArray(values) ? values : [];
  const out: string[] = [];
  const add = (v: string) => {
    if (!out.includes(v)) out.push(v);
  };
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const v = item.toUpperCase();
    if (v === "EVERYONE_CAN_APPLY") add("Everyone can apply");
    if (v === "SCHOOL_STUDENTS") add("School students");
    if (v === "COLLEGE_STUDENTS") add("College students");
    if (v === "FRESHERS") add("Freshers");
    if (v === "PROFESSIONALS") add("Professionals");
  }
  return out;
}

function formatPrizeAmount(amount: unknown): string {
  if (typeof amount !== "string") return "";
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const pretty = n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
  return `₹ ${pretty}`;
}

function fromRegistrationFieldType(
  value: string | undefined
): RegistrationQuestion["type"] {
  const v = (value ?? "").toUpperCase();
  if (v === "PHONE_NO") return "Phone No.";
  if (v === "EMAIL") return "Email";
  if (v === "ATTACHMENTS") return "Attachments";
  if (v === "NUMBER") return "Number";
  if (v === "OPTIONS") return "Options";
  return "Text";
}

function extractHackathon(input: unknown): Record<string, unknown> | null {
  if (!isRecord(input)) return null;
  const maybeData = input["data"];
  if (isRecord(maybeData)) return maybeData;
  return input;
}

function getAutosaveErrorMessage(error: unknown): string {
  if (!isRecord(error)) {
    return "Autosave failed. Please check your connection.";
  }

  const response = error["response"];
  if (!isRecord(response)) {
    return "Autosave failed. Please check your connection.";
  }

  const status = response["status"];
  const data = response["data"];

  if (status === 403) {
    if (isRecord(data) && typeof data["message"] === "string") {
      const msg = data["message"];
      if (msg.includes("DRAFT") || msg.includes("status")) {
        return "Rounds can only be edited while the opportunity is in Draft status.";
      }
      if (msg.includes("permission") || msg.includes("access")) {
        return "You don't have permission to edit this opportunity. Contact the owner to get manager access.";
      }
      return msg;
    }
    return "You don't have permission to edit this opportunity.";
  }

  if (status === 400) {
    if (isRecord(data) && typeof data["message"] === "string") {
      const msg = data["message"];
      if (msg.includes("started") || msg.includes("cannot be edited")) {
        return msg;
      }
      if (
        msg.includes("endsAt") ||
        msg.includes("startsAt") ||
        (msg.includes("end") && msg.includes("start"))
      ) {
        return "Round end time must be after start time.";
      }
      return msg;
    }
    return "Invalid data. Please check your inputs.";
  }

  return "Autosave failed. Please check your connection.";
}

function mapHackathonToFormData(hackathon: Record<string, unknown>): FormData {
  const festival = isRecord(hackathon["festival"])
    ? hackathon["festival"]
    : null;

  const startDate = getDate(hackathon["startDate"]);
  const endDate = getDate(hackathon["endDate"]);
  const registrationDeadline = getDate(hackathon["registrationDeadline"]);
  const maxTeamsRaw = hackathon["maxTeams"];
  const maxTeamsValue =
    typeof maxTeamsRaw === "number" ? maxTeamsRaw : undefined;

  const locationVirtualLink = getString(hackathon, "locationVirtualLink");
  const locationAddress = getString(hackathon, "locationAddress");
  const locationCity = getString(hackathon, "locationCity");
  const location = locationVirtualLink
    ? locationVirtualLink
    : [locationAddress, locationCity]
      .filter((v): v is string => typeof v === "string")
      .join(", ");

  const roundsRaw = Array.isArray(hackathon["rounds"])
    ? (hackathon["rounds"] as ReadonlyArray<unknown>)
    : [];

  const rounds: Round[] = roundsRaw
    .map((r): Round | null => {
      if (!isRecord(r)) return null;
      const startsAt = getDate(r["startsAt"]);
      const endsAt = getDate(r["endsAt"]);
      if (!startsAt || !endsAt) return null;
      const id = getString(r, "id") ?? crypto.randomUUID();

      let submissionConfig: RoundSubmissionConfig | undefined;
      const submissionConfigRaw = r["submissionConfig"];
      if (isRecord(submissionConfigRaw)) {
        const requiresFileUpload = submissionConfigRaw["requiresFileUpload"];
        const allowedFileTypesRaw = submissionConfigRaw["allowedFileTypes"];
        const allowedFileTypes = Array.isArray(allowedFileTypesRaw)
          ? (allowedFileTypesRaw.filter(
            (t): t is "pdf" | "ppt" | "image" =>
              t === "pdf" || t === "ppt" || t === "image"
          ) as ("pdf" | "ppt" | "image")[])
          : [];
        const maxFileSizeBytes =
          typeof submissionConfigRaw["maxFileSizeBytes"] === "number"
            ? submissionConfigRaw["maxFileSizeBytes"]
            : 10 * 1024 * 1024;
        const instructions = getString(
          submissionConfigRaw as Record<string, unknown>,
          "instructions"
        );
        const maxFilesRaw = submissionConfigRaw["maxFiles"];
        const maxFiles =
          typeof maxFilesRaw === "number" && Number.isInteger(maxFilesRaw)
            ? Math.max(1, maxFilesRaw)
            : 1;
        const allowResubmissionRaw = submissionConfigRaw["allowResubmission"];
        submissionConfig = {
          enabled: requiresFileUpload === true,
          allowedFileTypes:
            allowedFileTypes.length > 0 ? allowedFileTypes : ["pdf"],
          maxFiles,
          maxFileSizeBytes,
          allowResubmission: allowResubmissionRaw === true,
          instructions,
        };
      }

      return {
        id,
        name: getString(r, "name") ?? "Round",
        description: getString(r, "description") ?? "",
        startDate: startsAt,
        endDate: endsAt,
        startTime: toTimeHHmm(startsAt),
        endTime: toTimeHHmm(endsAt),
        roundType: (getString(r, "roundType") as any) ?? "ONLINE",
        submissionConfig,
      };
    })
    .filter((v): v is Round => v !== null);

  const eligibility = fromAttendeeEligibility(hackathon["attendeeEligibility"]);

  const prizeBreakdownRaw = Array.isArray(hackathon["prizeBreakdown"])
    ? (hackathon["prizeBreakdown"] as ReadonlyArray<unknown>)
    : [];

  const prizesList: Prize[] = prizeBreakdownRaw
    .map((p): Prize | null => {
      if (!isRecord(p)) return null;
      const position = getString(p, "position");
      if (!position) return null;
      return {
        id: getString(p, "id") ?? crypto.randomUUID(),
        name: position,
        amount: formatPrizeAmount(getString(p, "amount") ?? ""),
        description: getString(p, "description") ?? "",
      };
    })
    .filter((v): v is Prize => v !== null);

  const prizeCertificate =
    typeof hackathon["prizeCertificate"] === "boolean"
      ? hackathon["prizeCertificate"]
      : null;

  const prizeDescriptionRaw = hackathon["prizeDescription"];
  const prizeDescription =
    isRecord(prizeDescriptionRaw) &&
      typeof prizeDescriptionRaw["summary"] === "string"
      ? (prizeDescriptionRaw["summary"] as string)
      : "";

  const registrationFormRaw = isRecord(hackathon["registrationForm"])
    ? hackathon["registrationForm"]
    : null;
  const regFieldsRaw =
    registrationFormRaw && Array.isArray(registrationFormRaw["fields"])
      ? (registrationFormRaw["fields"] as ReadonlyArray<unknown>)
      : [];

  const registrationQuestions: RegistrationQuestion[] = regFieldsRaw
    .map((f): RegistrationQuestion | null => {
      if (!isRecord(f)) return null;
      const label = getString(f, "label");
      if (!label) return null;
      const required = f["required"];
      
      const isDefault = [
        "name", "email", "phone no.", "gender", "school name", "college name", "company name"
      ].includes(label.toLowerCase().trim());
      
      return {
        id: getString(f, "id") ?? crypto.randomUUID(),
        label,
        type: fromRegistrationFieldType(getString(f, "type")),
        required: typeof required === "boolean" ? required : false,
        fixed: isDefault,
        options: Array.isArray(f["options"])
          ? (f["options"] as ReadonlyArray<unknown>).filter(
            (o): o is string => typeof o === "string"
          )
          : undefined,
      };
    })
    .filter((v): v is RegistrationQuestion => v !== null);

  const contactName = getString(hackathon, "contactName") ?? "";
  const contactEmail = getString(hackathon, "contactEmail") ?? "";
  const contactPhone = getString(hackathon, "contactPhone") ?? "";
  const contacts: Contact[] =
    contactName.trim().length > 0 ||
      contactEmail.trim().length > 0 ||
      contactPhone.trim().length > 0
      ? [
        {
          id: "contact-1",
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
        },
      ]
      : [];

  const attachmentsRaw = Array.isArray(hackathon["attachments"])
    ? (hackathon["attachments"] as ReadonlyArray<unknown>)
    : [];
  const attachments: Attachment[] = attachmentsRaw
    .map((a): Attachment | null => {
      if (!isRecord(a)) return null;
      const title =
        getString(a, "fileName") ?? getString(a, "storageKey") ?? "Attachment";
      const type = getString(a, "mimeType") ?? "File";
      return { id: getString(a, "id") ?? crypto.randomUUID(), title, type };
    })
    .filter((v): v is Attachment => v !== null);

  return {
    eventFestName: festival
      ? (getString(festival, "name") ?? "Individual Hackathon")
      : "Individual Hackathon",
    festivalId: festival ? getString(festival, "id") : undefined,
    eventFestVisibility: fromVisibility(getString(hackathon, "visibility")),
    eventName: getString(hackathon, "name") ?? "",
    eventDate: startDate,
    eventEndDate: endDate,
    eventLocation: location,
    eventTimeFrom: startDate ? toTimeHHmm(startDate) : "09:00",
    eventTimeTo: endDate ? toTimeHHmm(endDate) : undefined,
    eventDescription: getString(hackathon, "description") ?? "",
    eventThumbnail: getString(hackathon, "bannerImageUrl") ?? "",
    eventRegisterBy: registrationDeadline,
    hackathonType: fromHackathonType(getString(hackathon, "hackathonType")),
    participantType: fromParticipantType(
      getString(hackathon, "participantType")
    ),
    registrationQuestions,
    rounds,
    registrationSettings: {
      candidateTypes: [...eligibility],
      startDate: undefined,
      startTime: "09:00",
      endDate: registrationDeadline,
      endTime: registrationDeadline
        ? toTimeHHmm(registrationDeadline)
        : "23:59",
      eventDate: startDate,
      eventTime: startDate ? toTimeHHmm(startDate) : "09:00",
      maxTeamsNoLimit: maxTeamsValue === undefined,
      maxTeams: maxTeamsValue,
    },
    prizes: {
      description: prizeDescription,
      certificateProvided: prizeCertificate,
      list: prizesList,
    },
    additionalInfo: {
      contacts,
      attachments,
    },
  };
}

/**
 * Edit Opportunity Page
 */
export default function EditOpportunityPage() {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "basic-details",
  });

  const { getToken } = useAuth();
  const params = useParams();
  const slugParam = useMemo(() => {
    const raw = isRecord(params) ? params["slug"] : undefined;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
    return null;
  }, [params]);

  const {
    data: hackathonRaw,
    isLoading: isLoadingHackathon,
    error: hackathonError,
  } = useHackathonBySlug(slugParam);

  const [hasHydratedFromBackend, setHasHydratedFromBackend] =
    useState<boolean>(false);
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const lastSavedMaxTeamsRef = React.useRef<number | null | undefined>(
    undefined
  );
  const lastSavedRoundsSnapshotRef = React.useRef<string | null>(null);
  const savingRoundsSnapshotRef = React.useRef<string | null>(null);
  const lastSavedPrizeBreakdownSnapshotRef = React.useRef<string | null>(null);
  const savingPrizeBreakdownSnapshotRef = React.useRef<string | null>(null);
  const lastSavedAdditionalInfoSnapshotRef = React.useRef<string | null>(null);
  const savingAdditionalInfoSnapshotRef = React.useRef<string | null>(null);

  const tabs = [
    {
      id: "preview",
      label: "Preview",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: "basic-details",
      label: "Basic Details",
      icon: <FileEdit className="w-4 h-4" />,
    },
    {
      id: "registration-settings",
      label: "Registration Settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "rounds-stages",
      label: "Rounds and Stages",
      icon: <LayoutTemplate className="w-4 h-4" />,
    },
    { id: "prizes", label: "Prizes", icon: <Trophy className="w-4 h-4" /> },
    {
      id: "additional-info",
      label: "Additional Info",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const [formData, setFormData] = useState<FormData>(() => ({
    eventFestName: "Individual Hackathon",
    festivalId: undefined,
    eventFestVisibility: "Public",
    eventName: "",
    eventDate: undefined,
    eventEndDate: undefined,
    eventLocation: "",
    eventTimeFrom: "09:00",
    eventTimeTo: undefined,
    eventDescription: "",
    eventThumbnail: "",
    eventRegisterBy: undefined,
    hackathonType: "Coding Hackathon",
    participantType: "Individual",
    registrationQuestions: [],
    rounds: [],
    registrationSettings: {
      candidateTypes: [],
      startDate: undefined,
      startTime: "09:00",
      endDate: undefined,
      endTime: "23:59",
      eventDate: undefined,
      eventTime: "09:00",
      maxTeamsNoLimit: true,
      maxTeams: undefined,
    },
    prizes: { description: "", certificateProvided: null, list: [] },
    additionalInfo: { contacts: [], attachments: [] },
  }));

  useEffect(() => {
    if (hasHydratedFromBackend) return;
    const hackathon = extractHackathon(hackathonRaw);
    if (!hackathon) return;
    const id = getString(hackathon, "id");
    if (typeof id === "string") setHackathonId(id);
    const maxTeamsRaw = hackathon["maxTeams"];
    lastSavedMaxTeamsRef.current =
      typeof maxTeamsRaw === "number" ? maxTeamsRaw : null;
    setFormData(mapHackathonToFormData(hackathon));
    setHasHydratedFromBackend(true);
  }, [hackathonRaw, hasHydratedFromBackend]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (hackathonId === null) {
        throw new Error("Hackathon id is not loaded yet.");
      }
      const token = requireToken(await getToken());

      // Snapshots used to decide whether to call dedicated nested endpoints.
      const roundsSnapshot = serializeRounds(formData.rounds);
      const additionalInfoSnapshot = serializeAdditionalInfo(
        formData.additionalInfo
      );

      const base: UpdateHackathonDto = {
        name:
          formData.eventName.trim().length > 0
            ? formData.eventName.trim()
            : undefined,
        description:
          formData.eventDescription.trim().length > 0
            ? formData.eventDescription
            : undefined,
        festivalId: formData.festivalId,
        bannerImageUrl: isValidUrl(formData.eventThumbnail)
          ? formData.eventThumbnail.trim()
          : undefined,
        mode: toModeValue(formData.eventLocation),
        visibility: toVisibilityValue(formData.eventFestVisibility),
        hackathonType: toHackathonTypeValue(formData.hackathonType),
        participantType: toParticipantTypeValue(formData.participantType),
        location: toLocationDto(formData.eventLocation),
        attendeeEligibility: mapCandidateTypesToEligibility(
          formData.registrationSettings.candidateTypes
        ),
        registrationDeadline: formData.eventRegisterBy
          ? combineDateAndTimeToIso(
            formData.eventRegisterBy,
            formData.registrationSettings.endTime
          )
          : undefined,
        startDate: formData.eventDate
          ? combineDateAndTimeToIso(formData.eventDate, formData.eventTimeFrom)
          : undefined,
        endDate: formData.eventDate
          ? combineDateAndTimeToIso(
            formData.eventEndDate ?? formData.eventDate,
            formData.eventTimeTo ?? formData.eventTimeFrom
          )
          : undefined,
        prizeCertificate:
          typeof formData.prizes.certificateProvided === "boolean"
            ? formData.prizes.certificateProvided
            : undefined,
        prizeDescription:
          formData.prizes.description.trim().length > 0
            ? { summary: formData.prizes.description.trim() }
            : undefined,
      };

      await updateHackathon(token, hackathonId, base);

      const desiredMaxTeams =
        formData.registrationSettings.maxTeamsNoLimit === true
          ? null
          : typeof formData.registrationSettings.maxTeams === "number" &&
            Number.isInteger(formData.registrationSettings.maxTeams) &&
            formData.registrationSettings.maxTeams >= 1
            ? formData.registrationSettings.maxTeams
            : undefined;

      if (
        desiredMaxTeams !== undefined &&
        desiredMaxTeams !== lastSavedMaxTeamsRef.current
      ) {
        await updateHackathonMaxTeams(token, hackathonId, {
          maxTeams: desiredMaxTeams,
        });
        lastSavedMaxTeamsRef.current = desiredMaxTeams;
      }

      // Rounds: allow clearing by sending an empty array, but only when rounds changed.
      if (roundsSnapshot !== lastSavedRoundsSnapshotRef.current) {
        const roundsDto: UpdateHackathonRoundsDto = {
          rounds: formData.rounds.map((r, idx) => ({
            id: r.id.startsWith("new-") ? undefined : r.id,
            name: r.name,
            description:
              r.description.trim().length > 0 ? r.description : undefined,
            startsAt: combineDateAndTimeToIso(r.startDate, r.startTime),
            endsAt: combineDateAndTimeToIso(r.endDate, r.endTime),
            order: idx,
            roundType: r.roundType,
            submissionConfig: r.submissionConfig?.enabled
              ? {
                requiresFileUpload: true,
                allowedFileTypes: r.submissionConfig.allowedFileTypes,
                maxFileSizeBytes: r.submissionConfig.maxFileSizeBytes,
                instructions: r.submissionConfig.instructions,
              }
              : undefined,
          })),
        };
        await updateHackathonRounds(token, hackathonId, roundsDto);
        savingRoundsSnapshotRef.current = roundsSnapshot;
      }

      const customRegistrationQuestions = formData.registrationQuestions.filter(
        (q) => q.fixed !== true && q.label.trim().length > 0
      );
      const registrationForm = mapRegistrationQuestionsToRegistrationForm(
        customRegistrationQuestions
      );
      await updateHackathonRegistrationForm(token, hackathonId, {
        registrationForm,
      });

      // Prize breakdown: allow clearing by sending an empty array, but only when breakdown changed.
      const prizeItemsResult: {
        prizeItems: PrizeBreakdownDto[];
        hasInvalidAmount: boolean;
      } = formData.prizes.list.reduce(
        (
          acc: { prizeItems: PrizeBreakdownDto[]; hasInvalidAmount: boolean },
          p
        ) => {
          const amount = parseCurrencyToDecimalString(p.amount);
          if (amount === null) {
            return { ...acc, hasInvalidAmount: true };
          }
          return {
            ...acc,
            prizeItems: [
              ...acc.prizeItems,
              {
                position: p.name,
                amount,
                description:
                  p.description.trim().length > 0 ? p.description : undefined,
              },
            ],
          };
        },
        { prizeItems: [], hasInvalidAmount: false }
      );

      const prizeBreakdownSnapshot = serializePrizeBreakdown(
        prizeItemsResult.prizeItems
      );
      if (
        prizeItemsResult.hasInvalidAmount === false &&
        prizeBreakdownSnapshot !== lastSavedPrizeBreakdownSnapshotRef.current
      ) {
        await updateHackathonPrizeBreakdown(token, hackathonId, {
          prizeBreakdown: prizeItemsResult.prizeItems,
        });
        savingPrizeBreakdownSnapshotRef.current = prizeBreakdownSnapshot;
      }

      // Additional info: allow clearing attachments by sending [] and clearing contact by sending "".
      // We only send when the section changed.
      if (
        additionalInfoSnapshot !== lastSavedAdditionalInfoSnapshotRef.current
      ) {
        const first = formData.additionalInfo.contacts[0];
        const payload: UpdateHackathonAdditionalInfoDto = {
          contact: first
            ? {
              name: first.name.trim(),
              email:
                first.email.trim().length > 0
                  ? first.email.trim()
                  : undefined,
              phone: first.phone.trim(),
            }
            : {
              name: "",
              email: undefined,
              phone: "",
            },
          attachments: formData.additionalInfo.attachments.map((a) => ({
            storageKey: a.url ?? a.id,
            publicUrl: a.url,
            fileName: a.title,
            mimeType: a.mimeType || a.type,
            sizeBytes: a.size,
          })),
        };
        await updateHackathonAdditionalInfo(token, hackathonId, payload);
        savingAdditionalInfoSnapshotRef.current = additionalInfoSnapshot;
      }
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(err);
    },
  });

  const [autoSaveStatus, setAutoSaveStatus] =
    useState<AutoSaveUiStatus>("idle");
  const lastSavedSnapshotRef = React.useRef<string | null>(null);
  const savingSnapshotRef = React.useRef<string | null>(null);
  const lastSavedAtRef = React.useRef<number | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveQueuedRef = React.useRef<boolean>(false);
  const lastErrorToastAtRef = React.useRef<number>(0);
  const latestFormDataRef = React.useRef<FormData>(formData);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  /**
   * Executes a save immediately (no debounce).
   * - Used by the normal debounce timer.
   * - Also used to flush queued saves after an in-flight save finishes.
   */
  const runSaveMutation = React.useCallback((): void => {
    if (saveMutation.isPending) {
      saveQueuedRef.current = true;
      return;
    }

    setAutoSaveStatus("saving");
    savingSnapshotRef.current = serializeFormData(latestFormDataRef.current);

    saveMutation.mutate(undefined, {
      onSuccess: () => {
        if (typeof savingSnapshotRef.current === "string") {
          lastSavedSnapshotRef.current = savingSnapshotRef.current;
        }
        savingSnapshotRef.current = null;

        if (typeof savingRoundsSnapshotRef.current === "string") {
          lastSavedRoundsSnapshotRef.current = savingRoundsSnapshotRef.current;
        }
        savingRoundsSnapshotRef.current = null;

        if (typeof savingPrizeBreakdownSnapshotRef.current === "string") {
          lastSavedPrizeBreakdownSnapshotRef.current =
            savingPrizeBreakdownSnapshotRef.current;
        }
        savingPrizeBreakdownSnapshotRef.current = null;

        if (typeof savingAdditionalInfoSnapshotRef.current === "string") {
          lastSavedAdditionalInfoSnapshotRef.current =
            savingAdditionalInfoSnapshotRef.current;
        }
        savingAdditionalInfoSnapshotRef.current = null;

        const nowSnapshot = serializeFormData(latestFormDataRef.current);
        if (nowSnapshot === lastSavedSnapshotRef.current) {
          lastSavedAtRef.current = Date.now();
          setAutoSaveStatus("saved");
        } else {
          setAutoSaveStatus("dirty");
        }

        if (saveQueuedRef.current) {
          // Flush any changes that happened during the in-flight save.
          saveQueuedRef.current = false;
          setTimeout(() => {
            runSaveMutation();
          }, 0);
        }
      },
      onError: (error: unknown) => {
        setAutoSaveStatus("error");
        savingSnapshotRef.current = null;
        const now = Date.now();
        if (now - lastErrorToastAtRef.current > 10_000) {
          lastErrorToastAtRef.current = now;
          const errorMessage = getAutosaveErrorMessage(error);
          toast.error(errorMessage);
        }
      },
    });
  }, [saveMutation]);

  // Establish the initial "saved" snapshot once we hydrate from backend.
  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (hackathonId === null) return;
    if (lastSavedSnapshotRef.current !== null) return;
    lastSavedSnapshotRef.current = serializeFormData(formData);
    lastSavedRoundsSnapshotRef.current = serializeRounds(formData.rounds);

    // Saved prize breakdown snapshot is derived from valid numeric values only.
    const initialPrizeItems: PrizeBreakdownDto[] = formData.prizes.list
      .map((p): PrizeBreakdownDto | null => {
        const amount = parseCurrencyToDecimalString(p.amount);
        if (amount === null) return null;
        return {
          position: p.name,
          amount,
          description:
            p.description.trim().length > 0 ? p.description : undefined,
        };
      })
      .filter((v): v is PrizeBreakdownDto => v !== null);
    lastSavedPrizeBreakdownSnapshotRef.current =
      serializePrizeBreakdown(initialPrizeItems);
    lastSavedAdditionalInfoSnapshotRef.current = serializeAdditionalInfo(
      formData.additionalInfo
    );
    lastSavedAtRef.current = Date.now();
    setAutoSaveStatus("saved");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydratedFromBackend, hackathonId]);

  // Debounced autosave on any form changes.
  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (hackathonId === null) return;

    const snapshot = serializeFormData(formData);
    if (snapshot === lastSavedSnapshotRef.current) {
      if (autoSaveStatus !== "saving") setAutoSaveStatus("saved");
      return;
    }

    setAutoSaveStatus("dirty");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSaveMutation();
    }, 900);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    formData,
    hasHydratedFromBackend,
    hackathonId,
    saveMutation,
    autoSaveStatus,
    runSaveMutation,
  ]);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputId = useMemo(
    () => `edit-opp-banner-upload-${crypto.randomUUID()}`,
    [],
  );



  async function handleBannerSelected(file: File | null): Promise<void> {
    if (!file) return;
    if (isUploadingBanner) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image too large. Max size is 10MB.");
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const token = await getToken();
      if (typeof token !== "string" || token.trim().length === 0) {
        toast.error("Please sign in to upload.");
        return;
      }

      const presign = await presignImageUpload(token, {
        purpose: "HACKATHON_BANNER",
        mimeType: file.type,
      });

      await uploadImageToS3PresignedPost({ presign, file });

      setFormData((prev) => ({
        ...prev,
        eventThumbnail: presign.publicUrl,
      }));

      toast.success("Banner uploaded.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  if (isLoadingHackathon) {
    return (
      <div className="w-full flex flex-col items-center p-6 gap-6 bg-background">
        <div className="w-full max-w-3xl text-muted-foreground">
          Loading opportunity...
        </div>
      </div>
    );
  }

  if (hackathonError) {
    return (
      <div className="w-full flex flex-col items-center p-6 gap-6 bg-background">
        <div className="w-full max-w-3xl text-destructive-foreground">
          Failed to load opportunity.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center p-2 sm:p-4 md:p-6 lg:p-10 gap-6 bg-background">
      {/* Tabs Navigation */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-secondary text-secondary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Autosave Status */}
      <div className="w-full sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="w-full flex items-center justify-between px-2 py-2">
          <div className="text-xs font-medium">
            {autoSaveStatus === "saving" ? (
              <span className="text-primary">Saving…</span>
            ) : autoSaveStatus === "dirty" ? (
              <span className="text-amber-600">Unsaved changes</span>
            ) : autoSaveStatus === "error" ? (
              <span className="text-destructive-foreground">
                Autosave error
              </span>
            ) : (
              <span className="text-emerald-600">Saved</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {typeof lastSavedAtRef.current === "number"
              ? `Last saved: ${new Date(lastSavedAtRef.current).toLocaleTimeString()}`
              : ""}
          </div>
        </div>
      </div>

      <div className="w-full">
        {activeTab === "basic-details" && (
          <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Left Sidebar - Thumbnail & Banner Upload */}
            <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
              <BannerUploader
                imageUrl={
                  formData.eventThumbnail &&
                    formData.eventThumbnail.trim().length > 0
                    ? formData.eventThumbnail.trim()
                    : undefined
                }
                onUpload={(file) => void handleBannerSelected(file)}
                isUploading={isUploadingBanner}
                inputId={bannerInputId}
              />
            </div>

            {/* Main Content - Form Grid */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Context & Visibility Dropdowns */}
              <div className="flex w-full justify-between items-center bg-transparent">
                {/* Event Context Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-neutral-200 px-4 py-2 rounded-lg text-sm font-medium">
                        {formData.eventFestName || "Individual Hackathon"}
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px]">
                    <DropdownMenuLabel>Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({
                          ...formData,
                          eventFestName: "Individual Hackathon",
                        })
                      }
                    >
                      Individual Hackathon
                    </DropdownMenuItem>
                    {/* Add more items/loading logic here */}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Visibility Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-neutral-200 px-4 py-2 rounded-lg text-sm font-medium">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        {formData.eventFestVisibility || "Public"}
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({
                          ...formData,
                          eventFestVisibility: "Public",
                        })
                      }
                    >
                      Public
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setFormData({
                          ...formData,
                          eventFestVisibility: "Private",
                        })
                      }
                    >
                      Private
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Hackathon Name InputBlock */}
              <div className="w-full">
                <InputBlock
                  icon={null}
                  label={
                    <input
                      value={formData.eventName}
                      onChange={(e) =>
                        setFormData({ ...formData, eventName: e.target.value })
                      }
                      className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full text-foreground"
                      placeholder="Hackathon Name"
                    />
                  }
                  subLabel="Enter the name of your hackathon"
                  className="bg-transparent hover:bg-transparent p-0 border-none cursor-text"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="h-full">
                      <InputBlock
                        icon={<CalendarIcon className="w-6 h-6" />}
                        label={
                          formData.eventDate
                            ? formData.eventDate.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                            : "Select Date"
                        }
                        subLabel="Hackathon Date"
                        className="h-full"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.eventDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, eventDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <InputBlock
                  icon={<Clock className="w-6 h-6" />}
                  label={
                    <input
                      type="time"
                      value={formData.eventTimeFrom}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eventTimeFrom: e.target.value,
                        })
                      }
                      className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
                    />
                  }
                  subLabel="Hackathon Time"
                  className="h-full"
                />
              </div>

              {/* End Date & End Time Row (optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="h-full">
                      <InputBlock
                        icon={<CalendarIcon className="w-6 h-6" />}
                        label={
                          formData.eventEndDate
                            ? formData.eventEndDate.toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                            : "Select End Date"
                        }
                        subLabel="Hackathon End Date (optional)"
                        className="h-full"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.eventEndDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, eventEndDate: date })
                      }
                    />
                  </PopoverContent>
                </Popover>

                <InputBlock
                  icon={<Clock className="w-6 h-6" />}
                  label={
                    <input
                      type="time"
                      value={formData.eventTimeTo ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        setFormData({
                          ...formData,
                          eventTimeTo:
                            next.trim().length > 0 ? next : undefined,
                        });
                      }}
                      className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
                    />
                  }
                  subLabel="Hackathon End Time (optional)"
                  className="h-full"
                />
              </div>

              {/* Location */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<MapPin className="w-6 h-6" />}
                      label={
                        formData.eventLocation || "Add Hackathon Location"
                      }
                      subLabel="Offline location or virtual link"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Event Location</DialogTitle>
                    <DialogDescription>
                      Enter the location where the event will take place.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="location" className="text-sm font-medium">
                        Location
                      </label>
                      <input
                        id="location"
                        value={formData.eventLocation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventLocation: e.target.value,
                          })
                        }
                        placeholder="e.g. San Francisco, CA"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Description */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<AlignLeft className="w-6 h-6" />}
                      label={
                        formData.eventDescription &&
                          formData.eventDescription.replace(/<[^>]*>?/gm, "")
                            .length > 0
                          ? "Description"
                          : "Add Description"
                      }
                      subLabel={
                        formData.eventDescription
                          ? formData.eventDescription
                            .replace(/<[^>]*>?/gm, "")
                            .substring(0, 50) + "..."
                          : "Everything you need to know about..."
                      }
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Event Description</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden border rounded-md">
                    <RichTextEditor
                      value={formData.eventDescription}
                      onChange={(content: string) =>
                        setFormData({
                          ...formData,
                          eventDescription: content,
                        })
                      }
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Hackathon Type & Participant Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-full">
                      <InputBlock
                        icon={<Wand2 className="w-6 h-6" />}
                        label={formData.hackathonType || "Hackathon Type"}
                        subLabel="Select hackathon format"
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[
                      "Coding Hackathon",
                      "Idea Hackathon",
                      "Open Hackathon",
                    ].map((t) => (
                      <DropdownMenuItem
                        key={t}
                        onClick={() =>
                          setFormData({ ...formData, hackathonType: t })
                        }
                      >
                        {t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-full">
                      <InputBlock
                        icon={<Users className="w-6 h-6" />}
                        label={
                          formData.participantType || "Participant Type"
                        }
                        subLabel="Who can attend?"
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[
                      "Individual",
                      "Team of 2",
                      "Team of 3",
                      "Team of 4",
                      "Team of 5",
                      "Team of 6",
                      "More than 6",
                      "Team of 2-3",
                      "Team of 2-4",
                      "Team of 3-4",
                      "Team of 3-5",
                      "Team of 4-5",
                      "Team of 4-6",
                      "Team of 5-6",
                    ].map((t) => (
                      <DropdownMenuItem
                        key={t}
                        onClick={() =>
                          setFormData({ ...formData, participantType: t })
                        }
                      >
                        {t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Registration Form */}
              <div onClick={() => setShowRegistrationModal(true)}>
                <InputBlock
                  icon={<FileEdit className="w-6 h-6" />}
                  label="Registration Form"
                  subLabel="Customize registration questions"
                />
              </div>
            </div>

            <RegistrationQuestionsModal
              open={showRegistrationModal}
              onOpenChange={setShowRegistrationModal}
              questions={formData.registrationQuestions}
              onSave={(questions) =>
                setFormData({ ...formData, registrationQuestions: questions })
              }
            />
          </div>
        )}

        {activeTab === "registration-settings" && (
          <RegistrationSettings
            formData={formData}
            setFormData={setFormData}
            savedMaxTeams={lastSavedMaxTeamsRef.current}
          />
        )}

        {activeTab === "rounds-stages" && (
          <RoundsAndStages formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "prizes" && (
          <Prizes formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "additional-info" && (
          <AdditionalInfo formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "preview" && (
          <div className="w-full flex flex-col gap-4">
            <CompetitionDetailsClient />
          </div>
        )}
      </div>
    </div>
  );
}
