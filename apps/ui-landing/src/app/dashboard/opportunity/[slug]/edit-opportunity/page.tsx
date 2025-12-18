"use client";

import {
  FileEdit,
  Trophy,
  LayoutTemplate,
  CheckCircle2,
  FileText,
  Settings,
} from "lucide-react";
import { RegistrationQuestion } from "@/components/ui/hackathon/RegistrationQuestionsModal";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useHackathonBySlug } from "@/hooks/useHackathonBySlug";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
} from "@oppskills/types";
import {
  updateHackathon,
  updateHackathonAdditionalInfo,
  updateHackathonMaxTeams,
  updateHackathonPrizeBreakdown,
  updateHackathonRegistrationForm,
  updateHackathonRounds,
} from "@/lib/api/hackathonApi";

// Import new components
import BasicDetails from "./_components/BasicDetails";
import RoundsAndStages from "./_components/RoundsAndStages";
import AdditionalInfo from "./_components/AdditionalInfo";
import Prizes from "./_components/Prizes";
import RegistrationSettings from "./_components/RegistrationSettings";
import CompetitionDetailsPage from "@/app/competitions/[slug]/page";

/**
 * Shared Types
 */
export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
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
  eventLocation: string;
  eventTimeFrom: string;
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
  | undefined {
  if (label === "Individual") return "INDIVIDUAL";
  if (label === "Team of 2") return "TEAM_OF_2";
  if (label === "Team of 3") return "TEAM_OF_3";
  if (label === "Team of 4") return "TEAM_OF_4";
  if (label === "Team of 5") return "TEAM_OF_5";
  if (label === "Team of 6") return "TEAM_OF_6";
  if (label === "More than 6") return "MORE_THAN_6";
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

function mapHackathonToFormData(hackathon: Record<string, unknown>): FormData {
  const festival = isRecord(hackathon["festival"])
    ? hackathon["festival"]
    : null;

  const startDate = getDate(hackathon["startDate"]);
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
      return {
        id,
        name: getString(r, "name") ?? "Round",
        description: getString(r, "description") ?? "",
        startDate: startsAt,
        endDate: endsAt,
        startTime: toTimeHHmm(startsAt),
        endTime: toTimeHHmm(endsAt),
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
      return {
        id: getString(f, "id") ?? crypto.randomUUID(),
        label,
        type: fromRegistrationFieldType(getString(f, "type")),
        required: typeof required === "boolean" ? required : false,
        fixed: false,
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
    eventLocation: location,
    eventTimeFrom: startDate ? toTimeHHmm(startDate) : "09:00",
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
    eventLocation: "",
    eventTimeFrom: "09:00",
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
          ? combineDateAndTimeToIso(formData.eventDate, formData.eventTimeFrom)
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

      if (formData.rounds.length > 0) {
        const roundsDto: UpdateHackathonRoundsDto = {
          rounds: formData.rounds.map((r, idx) => ({
            name: r.name,
            description:
              r.description.trim().length > 0 ? r.description : undefined,
            startsAt: combineDateAndTimeToIso(r.startDate, r.startTime),
            endsAt: combineDateAndTimeToIso(r.endDate, r.endTime),
            order: idx,
            roundType: "ONLINE",
            submissionConfig: undefined,
          })),
        };
        await updateHackathonRounds(token, hackathonId, roundsDto);
      }

      const customRegistrationQuestions = formData.registrationQuestions.filter(
        (q) => q.fixed !== true && q.label.trim().length > 0
      );
      if (customRegistrationQuestions.length > 0) {
        const registrationForm = mapRegistrationQuestionsToRegistrationForm(
          customRegistrationQuestions
        );
        await updateHackathonRegistrationForm(token, hackathonId, {
          registrationForm,
        });
      }

      const prizeItems: PrizeBreakdownDto[] = formData.prizes.list
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

      if (prizeItems.length > 0) {
        await updateHackathonPrizeBreakdown(token, hackathonId, {
          prizeBreakdown: prizeItems,
        });
      }

      if (formData.additionalInfo.contacts.length > 0) {
        const first = formData.additionalInfo.contacts[0];
        const payload: UpdateHackathonAdditionalInfoDto = {
          contact: {
            name: first.name.trim().length > 0 ? first.name : undefined,
            email: first.email.trim().length > 0 ? first.email : undefined,
            phone: first.phone.trim().length > 0 ? first.phone : undefined,
          },
          attachments: undefined,
        };
        await updateHackathonAdditionalInfo(token, hackathonId, payload);
      }
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(err);
    },
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const lastSavedSnapshotRef = React.useRef<string | null>(null);
  const savingSnapshotRef = React.useRef<string | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveQueuedRef = React.useRef<boolean>(false);
  const lastErrorToastAtRef = React.useRef<number>(0);
  const latestFormDataRef = React.useRef<FormData>(formData);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  // Establish the initial "saved" snapshot once we hydrate from backend.
  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (hackathonId === null) return;
    if (lastSavedSnapshotRef.current !== null) return;
    lastSavedSnapshotRef.current = serializeFormData(formData);
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

          const nowSnapshot = serializeFormData(latestFormDataRef.current);
          if (nowSnapshot === lastSavedSnapshotRef.current) {
            setAutoSaveStatus("saved");
          } else {
            setAutoSaveStatus("dirty");
          }

          if (saveQueuedRef.current) {
            saveQueuedRef.current = false;
            // The effect will run again on the next render and schedule a new save.
          }
        },
        onError: () => {
          setAutoSaveStatus("error");
          savingSnapshotRef.current = null;
          const now = Date.now();
          if (now - lastErrorToastAtRef.current > 10_000) {
            lastErrorToastAtRef.current = now;
            toast.error("Autosave failed. Please check your connection.");
          }
        },
      });
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
  ]);

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
        <div className="w-full max-w-3xl text-destructive">
          Failed to load opportunity.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center p-6 gap-6 bg-background">
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

      <div className="w-full flex justify-end px-2">
        <div className="text-xs text-muted-foreground">
          {autoSaveStatus === "saving"
            ? "Saving…"
            : autoSaveStatus === "dirty"
              ? "Unsaved changes"
              : autoSaveStatus === "error"
                ? "Autosave error"
                : "Saved"}
        </div>
      </div>

      <div className="w-full">
        {activeTab === "basic-details" && (
          <BasicDetails formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "registration-settings" && (
          <RegistrationSettings formData={formData} setFormData={setFormData} />
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

        {/* Placeholders for other tabs */}
        {activeTab === "preview" && <CompetitionDetailsPage />}
      </div>
    </div>
  );
}
