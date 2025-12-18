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

export interface BasicQuestion {
  id: string;
  label: string;
  required: boolean;
  isStatic: boolean;
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
  minTeamSize?: number;
  maxTeamSize?: number;
  questions: BasicQuestion[];
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
    registrationQuestions: [],
    rounds,
    registrationSettings: {
      candidateTypes: [],
      startDate: undefined,
      startTime: "09:00",
      endDate: registrationDeadline,
      endTime: registrationDeadline
        ? toTimeHHmm(registrationDeadline)
        : "23:59",
      eventDate: startDate,
      eventTime: startDate ? toTimeHHmm(startDate) : "09:00",
      maxTeamsNoLimit: true,
      questions: [
        { id: "name", label: "Name", required: true, isStatic: true },
        { id: "email", label: "Email", required: true, isStatic: true },
        {
          id: "mobile",
          label: "Mobile Number",
          required: true,
          isStatic: true,
        },
        { id: "gender", label: "Gender", required: true, isStatic: true },
        {
          id: "college",
          label: "Current College/ Organization",
          required: true,
          isStatic: true,
        },
        { id: "userType", label: "User Type", required: true, isStatic: true },
      ],
    },
    prizes: {
      description: "",
      certificateProvided: null,
      list: [],
    },
    additionalInfo: {
      contacts: [],
      attachments: [],
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
      questions: [
        { id: "name", label: "Name", required: true, isStatic: true },
        { id: "email", label: "Email", required: true, isStatic: true },
        {
          id: "mobile",
          label: "Mobile Number",
          required: true,
          isStatic: true,
        },
        { id: "gender", label: "Gender", required: true, isStatic: true },
        {
          id: "college",
          label: "Current College/ Organization",
          required: true,
          isStatic: true,
        },
        { id: "userType", label: "User Type", required: true, isStatic: true },
      ],
    },
    prizes: { description: "", certificateProvided: null, list: [] },
    additionalInfo: { contacts: [], attachments: [] },
  }));

  useEffect(() => {
    if (hasHydratedFromBackend) return;
    const hackathon = extractHackathon(hackathonRaw);
    if (!hackathon) return;
    setFormData(mapHackathonToFormData(hackathon));
    setHasHydratedFromBackend(true);
  }, [hackathonRaw, hasHydratedFromBackend]);

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
