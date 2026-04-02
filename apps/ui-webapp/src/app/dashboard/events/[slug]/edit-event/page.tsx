"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  FileEdit,
  CheckCircle2,
  FileText,
  Settings,
  Trophy,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  AlignLeft,
} from "lucide-react";
import InputBlock from "@/components/ui/derived/InputBlock";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import { cn } from "@/lib/utils";
import RegistrationQuestionsModal, { RegistrationQuestion } from "@/components/ui/hackathon/RegistrationQuestionsModal";
// import BasicDetails from "./_components/BasicDetails"; // Removed
import RegistrationSettings from "./_components/RegistrationSettings";
import AdditionalInfo from "./_components/AdditionalInfo";
import Prizes from "./_components/Prizes";
import PassSettings from "./_components/PassSettings";
import { useQueryState } from "nuqs";
import { useEventBySlug } from "@/hooks/useEventBySlug";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import dynamic from "next/dynamic";
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

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);
import type {
  UpdateEventDto,
  EventLocationDto,
} from "@oppskills/types/frontend";
import {
  updateEvent,
  updateEventAdditionalInfo,
  updateEventMaxUsers,
  updateEventPrizeBreakdown,
  updateEventRegistrationForm,
} from "@/lib/api/eventApi";
import { EventPreview } from "./_components/EventPreview";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

// Types
export interface RegistrationSettingsData {
  candidateTypes: string[];
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  eventDate: Date | undefined;
  eventTime: string;
  maxTeamsNoLimit: boolean;
  maxUsers?: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
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

export interface Attachment {
  id: string;
  title: string;
  type: string;
  mimeType?: string;
  url?: string;
  size?: number;
  storageKey?: string;
}

export interface AdditionalInfoData {
  contacts: Contact[];
  attachments: Attachment[];
}

export interface PassSettingsData {
  passSendingMode: "IMMEDIATE" | "APPROVAL";
  collegeRestrictionEnabled: boolean;
  allowedCollegeIds: string[];
  allowedEmailDomains: string[];
  collegeMatchMode: "PROFILE_ONLY" | "EMAIL_ONLY" | "EITHER_OR" | "BOTH_REQUIRED";
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
  eventType: string;
  participantType: string;
  registrationQuestions: RegistrationQuestion[];
  registrationSettings: RegistrationSettingsData;
  prizes: PrizesData;
  additionalInfo: AdditionalInfoData;
  passSettings: PassSettingsData;
  maxUsers: number | undefined;
  organizationName: string;
  // New fields mapped from backend
  visibility?: string;
  attendeeEligibility?: string[];
}

// Helper functions
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(
  obj: Record<string, unknown>,
  key: string,
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
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function toLocationDto(input: string): EventLocationDto | undefined {
  const trimmed = input.trim();
  if (trimmed.length === 0) return undefined;
  if (isValidUrl(trimmed)) return { type: "VIRTUAL", virtualLink: trimmed };
  return { type: "PHYSICAL", address: trimmed };
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

function serializeFormData(value: FormData): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

function serializeAdditionalInfo(value: AdditionalInfoData): string {
  return JSON.stringify(value);
}

function serializePrizes(value: PrizesData): string {
  return JSON.stringify(value);
}

function serializeRegistrationQuestions(value: RegistrationQuestion[]): string {
  return JSON.stringify(value);
}

type AutoSaveUiStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function mapEventToFormData(event: Record<string, unknown>): FormData {
  const festival = isRecord(event["festival"]) ? event["festival"] : null;
  const startDate = getDate(event["startDate"]);
  const registrationDeadline = getDate(event["registrationDeadline"]);
  const maxUsersRaw = event["maxUsers"];
  const maxUsersValue =
    typeof maxUsersRaw === "number" ? maxUsersRaw : undefined;

  const locationVirtualLink = getString(event, "locationVirtualLink");
  const locationAddress = getString(event, "locationAddress");
  const locationCity = getString(event, "locationCity");
  const location = locationVirtualLink
    ? locationVirtualLink
    : [locationAddress, locationCity]
      .filter((v): v is string => typeof v === "string")
      .join(", ");

  // Map visibility from backend
  const visibilityRaw = getString(event, "visibility");
  const visibility = visibilityRaw ?? "PUBLIC";
  const eventFestVisibility = visibility === "PUBLIC" ? "Public" : "Private";

  // Map event type from backend
  const eventTypeRaw = getString(event, "eventType");
  const eventTypeMap: Record<string, string> = {
    WORKSHOP: "Workshop",
    CONFERENCE: "Conference",
    MEETUP: "Meetup",
    NETWORKING: "Networking",
    SEMINAR: "Seminar",
    WEBINAR: "Webinar",
    OTHER: "Other",
  };
  const eventType = eventTypeRaw
    ? (eventTypeMap[eventTypeRaw] ?? "Conference")
    : "Conference";

  // Map attendee eligibility from backend
  const attendeeEligibilityRaw = event["attendeeEligibility"];
  const attendeeEligibility = Array.isArray(attendeeEligibilityRaw)
    ? attendeeEligibilityRaw.filter((v): v is string => typeof v === "string")
    : [];
  const candidateTypeMap: Record<string, string> = {
    EVERYONE_CAN_APPLY: "Everyone can apply",
    SCHOOL_STUDENTS: "School students",
    COLLEGE_STUDENTS: "College students",
    FRESHERS: "Freshers",
    PROFESSIONALS: "Professionals",
  };
  const candidateTypes =
    attendeeEligibility.length > 0
      ? attendeeEligibility.map((v) => candidateTypeMap[v] ?? v)
      : ["Everyone can apply"];

  // Map contact from backend
  const contactName = getString(event, "contactName");
  const contactEmail = getString(event, "contactEmail");
  const contactPhone = getString(event, "contactPhone");
  const contacts: Contact[] =
    contactName || contactEmail || contactPhone
      ? [
        {
          id: "primary",
          name: contactName ?? "",
          email: contactEmail ?? "",
          phone: contactPhone ?? "",
        },
      ]
      : [];

  // Map attachments from backend
  const attachmentsRaw = event["attachments"];
  const attachments: Attachment[] = Array.isArray(attachmentsRaw)
    ? attachmentsRaw
      .filter((a): a is Record<string, unknown> => isRecord(a))
      .map((a) => ({
        id: getString(a, "id") ?? crypto.randomUUID(),
        title: getString(a, "fileName") ?? "Attachment",
        type: getString(a, "mimeType") ?? "file",
        url: getString(a, "publicUrl"),
        size: typeof a["sizeBytes"] === "number" ? a["sizeBytes"] : undefined,
        storageKey: getString(a, "storageKey") ?? undefined,
      }))
    : [];

  // Map prizes from backend
  const prizeBreakdownRaw = event["prizeBreakdown"];
  const prizeList: Prize[] = Array.isArray(prizeBreakdownRaw)
    ? prizeBreakdownRaw
      .filter((p): p is Record<string, unknown> => isRecord(p))
      .map((p) => ({
        id: getString(p, "id") ?? crypto.randomUUID(),
        name: getString(p, "position") ?? "Winner",
        amount: getString(p, "amount") ?? "₹ 0",
        description: getString(p, "description") ?? "",
      }))
    : [];

  const prizeDescriptionRaw = event["prizeDescription"];
  const prizeDescription =
    isRecord(prizeDescriptionRaw) &&
      typeof prizeDescriptionRaw["summary"] === "string"
      ? prizeDescriptionRaw["summary"]
      : typeof prizeDescriptionRaw === "string"
        ? prizeDescriptionRaw
        : "";

  const prizes: PrizesData = {
    description: prizeDescription,
    certificateProvided:
      typeof event["prizeCertificate"] === "boolean"
        ? event["prizeCertificate"]
        : null,
    list: prizeList,
  };

  // Map registration form from backend
  const regFormRaw = event["registrationForm"];
  const regForm = isRecord(regFormRaw) ? regFormRaw : null;
  const fieldsRaw = regForm?.["fields"];
  const backToUiTypeMap: Record<string, RegistrationQuestion["type"]> = {
    TEXT: "Text",
    PHONE_NO: "Phone No.",
    EMAIL: "Email",
    ATTACHMENTS: "Attachments",
    NUMBER: "Number",
    OPTIONS: "Options",
  };
  const fixedLabels = ["Name", "Phone No.", "Email", "Gender", "College Name"];

  const registrationQuestions: RegistrationQuestion[] = Array.isArray(fieldsRaw)
    ? fieldsRaw
      .filter((f): f is Record<string, unknown> => isRecord(f))
      .map((f, idx) => {
        const label = getString(f, "label") ?? "";
        const isFixed = fixedLabels.includes(label);
        return {
          id:
            getString(f, "id") ??
            (isFixed ? `fixed-${idx}` : `custom-${idx}-${Date.now()}`),
          label,
          type: backToUiTypeMap[getString(f, "type") ?? "TEXT"] ?? "Text",
          required: typeof f["required"] === "boolean" ? f["required"] : true,
          fixed: isFixed,
          options: Array.isArray(f["options"])
            ? f["options"].filter((o): o is string => typeof o === "string")
            : undefined,
        };
      })
    : [];

  return {
    eventFestName: festival
      ? (getString(festival, "name") ?? "Standalone Event")
      : "Standalone Event",
    festivalId: festival ? getString(festival, "id") : undefined,
    eventFestVisibility,
    eventName: getString(event, "name") ?? "",
    eventDate: startDate,
    eventLocation: location,
    eventTimeFrom: startDate ? toTimeHHmm(startDate) : "09:00",
    eventDescription: getString(event, "description") ?? "",
    eventThumbnail: getString(event, "bannerImageUrl") ?? "",
    eventRegisterBy: registrationDeadline,
    eventType,
    participantType: "Individual",
    registrationQuestions,
    registrationSettings: {
      candidateTypes,
      startDate: undefined,
      startTime: "09:00",
      endDate: registrationDeadline,
      endTime: registrationDeadline
        ? toTimeHHmm(registrationDeadline)
        : "23:59",
      eventDate: startDate,
      eventTime: startDate ? toTimeHHmm(startDate) : "09:00",
      maxTeamsNoLimit: maxUsersValue === undefined,
      maxUsers: maxUsersValue,
    },
    prizes,
    additionalInfo: {
      contacts,
      attachments,
    },
    passSettings: {
      passSendingMode:
        (getString(event, "passSendingMode") as "IMMEDIATE" | "APPROVAL") ??
        "IMMEDIATE",
      collegeRestrictionEnabled:
        typeof event["collegeRestrictionEnabled"] === "boolean"
          ? event["collegeRestrictionEnabled"]
          : false,
      allowedCollegeIds: Array.isArray(event["allowedCollegeIds"])
        ? event["allowedCollegeIds"].filter(
          (id): id is string => typeof id === "string"
        )
        : [],
      allowedEmailDomains: Array.isArray(event["allowedEmailDomains"])
        ? event["allowedEmailDomains"].filter(
          (d): d is string => typeof d === "string"
        )
        : [],
      collegeMatchMode:
        (getString(event, "collegeMatchMode") as
          | "PROFILE_ONLY"
          | "EMAIL_ONLY"
          | "EITHER_OR"
          | "BOTH_REQUIRED") ?? "EITHER_OR",
    },
    maxUsers: maxUsersValue,
    organizationName: getString(event, "organizationName") ?? "",
    visibility,
    attendeeEligibility,
  };
}

export default function EditEventPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const slugParam = useMemo(() => {
    const raw = isRecord(params) ? params["slug"] : undefined;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
    return null;
  }, [params]);

  const {
    data: eventRaw,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useEventBySlug(slugParam);

  const [hasHydratedFromBackend, setHasHydratedFromBackend] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<string>("DRAFT");

  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "basic-details",
  });

  const tabs = [
    {
      id: "preview",
      label: "Preview",
      icon: <CheckCircle2 className="w-4 h-4" />,
      draftOnly: false,
    },
    {
      id: "basic-details",
      label: "Basic Details",
      icon: <FileEdit className="w-4 h-4" />,
      draftOnly: false,
    },
    {
      id: "additional-info",
      label: "Additional Info",
      icon: <FileText className="w-4 h-4" />,
      draftOnly: false,
    },
    {
      id: "pass-settings",
      label: "Pass Settings",
      icon: <Settings className="w-4 h-4" />,
      draftOnly: false,
    },
  ];

  const availableTabs = tabs;

  const [formData, setFormData] = useState<FormData>(() => ({
    eventFestName: "Standalone Event",
    festivalId: undefined,
    eventFestVisibility: "Public",
    eventName: "",
    eventDate: undefined,
    eventLocation: "",
    eventTimeFrom: "09:00",
    eventDescription: "",
    eventThumbnail: "",
    eventRegisterBy: undefined,
    eventType: "Conference",
    participantType: "Individual",
    registrationQuestions: [],
    registrationSettings: {
      candidateTypes: [],
      startDate: undefined,
      startTime: "09:00",
      endDate: undefined,
      endTime: "23:59",
      eventDate: undefined,
      eventTime: "09:00",
      maxTeamsNoLimit: true,
      maxUsers: undefined,
    },
    prizes: {
      description: "",
      certificateProvided: null,
      list: [],
    },
    additionalInfo: { contacts: [], attachments: [] },
    passSettings: {
      passSendingMode: "IMMEDIATE",
      collegeRestrictionEnabled: false,
      allowedCollegeIds: [],
      allowedEmailDomains: [],
      collegeMatchMode: "EITHER_OR",
    },
    maxUsers: undefined,
    organizationName: "",
  }));

  // Refs for auto-save state tracking
  const lastSavedAdditionalInfoSnapshotRef = React.useRef<string | null>(null);
  const savingAdditionalInfoSnapshotRef = React.useRef<string | null>(null);

  const lastSavedPrizesSnapshotRef = React.useRef<string | null>(null);
  const savingPrizesSnapshotRef = React.useRef<string | null>(null);

  const lastSavedRegistrationQuestionsSnapshotRef = React.useRef<string | null>(
    null,
  );
  const savingRegistrationQuestionsSnapshotRef = React.useRef<string | null>(
    null,
  );

  // Hydrate form from backend
  useEffect(() => {
    if (hasHydratedFromBackend) return;
    if (!eventRaw) return;

    const event = isRecord(eventRaw) ? eventRaw : null;
    if (!event) return;

    const id = getString(event, "id");
    if (typeof id === "string") setEventId(id);

    // Track event status for editing restrictions
    const status = getString(event, "status");
    if (typeof status === "string") setEventStatus(status);

    setFormData(mapEventToFormData(event));
    setHasHydratedFromBackend(true);
  }, [eventRaw, hasHydratedFromBackend]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (eventId === null) {
        throw new Error("Event id is not loaded yet.");
      }
      const token = requireToken(await getToken());

      const additionalInfoSnapshot = serializeAdditionalInfo(
        formData.additionalInfo,
      );

      // Map visibility back to backend enum
      const visibilityMap: Record<string, string> = {
        Public: "PUBLIC",
        Private: "PRIVATE",
      };
      const visibility =
        visibilityMap[formData.eventFestVisibility] ?? "PUBLIC";

      // Map event type back to backend enum
      const eventTypeMap: Record<string, string> = {
        Workshop: "WORKSHOP",
        Conference: "CONFERENCE",
        Meetup: "MEETUP",
        Networking: "NETWORKING",
        Seminar: "SEMINAR",
        Webinar: "WEBINAR",
        Other: "OTHER",
      };
      const eventType = eventTypeMap[formData.eventType] ?? "CONFERENCE";

      // Map candidate types back to backend enum
      const candidateTypeMap: Record<string, string> = {
        "Everyone can apply": "EVERYONE_CAN_APPLY",
        "School students": "SCHOOL_STUDENTS",
        "College students": "COLLEGE_STUDENTS",
        Freshers: "FRESHERS",
        Professionals: "PROFESSIONALS",
      };
      const attendeeEligibility = formData.registrationSettings.candidateTypes
        .map((t) => candidateTypeMap[t])
        .filter((v): v is string => typeof v === "string");

      const payload: UpdateEventDto = {
        name:
          formData.eventName.trim().length > 0
            ? formData.eventName.trim()
            : undefined,
        description:
          formData.eventDescription.trim().length > 0
            ? formData.eventDescription
            : undefined,
        bannerImageUrl: isValidUrl(formData.eventThumbnail)
          ? formData.eventThumbnail.trim()
          : undefined,
        location: toLocationDto(formData.eventLocation),
        registrationDeadline: (() => {
          const deadlineDate =
            formData.registrationSettings.endDate ?? formData.eventRegisterBy;
          return deadlineDate
            ? combineDateAndTimeToIso(
                deadlineDate,
                formData.registrationSettings.endTime,
              )
            : undefined;
        })(),
        startDate: (() => {
          const start =
            formData.registrationSettings.eventDate ?? formData.eventDate;
          const time =
            formData.registrationSettings.eventTime.trim().length > 0
              ? formData.registrationSettings.eventTime
              : formData.eventTimeFrom;
          return start ? combineDateAndTimeToIso(start, time) : undefined;
        })(),
        endDate: (() => {
          const start =
            formData.registrationSettings.eventDate ?? formData.eventDate;
          const time =
            formData.registrationSettings.eventTime.trim().length > 0
              ? formData.registrationSettings.eventTime
              : formData.eventTimeFrom;
          return start ? combineDateAndTimeToIso(start, time) : undefined;
        })(),
        maxUsers: formData.registrationSettings.maxTeamsNoLimit
          ? undefined
          : formData.registrationSettings.maxUsers,
        organizationName:
          formData.organizationName.trim().length > 0
            ? formData.organizationName.trim()
            : undefined,
        visibility: visibility as "PUBLIC" | "PRIVATE" | "UNIVERSITY_ONLY",
        eventType: eventType as
          | "WORKSHOP"
          | "CONFERENCE"
          | "MEETUP"
          | "NETWORKING"
          | "SEMINAR"
          | "WEBINAR"
          | "OTHER",
        attendeeEligibility: attendeeEligibility as Array<
          | "EVERYONE_CAN_APPLY"
          | "SCHOOL_STUDENTS"
          | "COLLEGE_STUDENTS"
          | "FRESHERS"
          | "PROFESSIONALS"
        >,
        prizeDescription: { summary: formData.prizes.description },
        prizeCertificate: formData.prizes.certificateProvided ?? false,
        // Pass Settings
        passSendingMode: formData.passSettings.passSendingMode,
        collegeRestrictionEnabled: formData.passSettings.collegeRestrictionEnabled,
        allowedCollegeIds: formData.passSettings.allowedCollegeIds,
        allowedEmailDomains: formData.passSettings.allowedEmailDomains,
        collegeMatchMode: formData.passSettings.collegeMatchMode,
      };

      await updateEvent(token, eventId, payload);

      const currentAdditionalInfoSnapshot = serializeAdditionalInfo(
        formData.additionalInfo,
      );
      if (
        currentAdditionalInfoSnapshot !==
        lastSavedAdditionalInfoSnapshotRef.current
      ) {
        const primaryContact = formData.additionalInfo.contacts[0];
        const contact = primaryContact
          ? {
            name: primaryContact.name || undefined,
            email: primaryContact.email || undefined,
            phone: primaryContact.phone || undefined,
          }
          : undefined;

        const attachments = formData.additionalInfo.attachments.map((a) => ({
          storageKey: a.storageKey ?? a.id,
          publicUrl: a.url,
          fileName: a.title,
          mimeType: a.mimeType || a.type,
          sizeBytes: a.size,
        }));

        await updateEventAdditionalInfo(token, eventId, {
          additionalInfo: {
            contact,
            attachments,
          },
        });
        savingAdditionalInfoSnapshotRef.current =
          currentAdditionalInfoSnapshot;
      }

      const currentPrizesSnapshot = serializePrizes(formData.prizes);
      if (currentPrizesSnapshot !== lastSavedPrizesSnapshotRef.current) {
        await updateEventPrizeBreakdown(token, eventId, {
          prizeBreakdown: formData.prizes.list.map((p) => ({
            position: p.name,
            amount: p.amount,
            description: p.description,
          })),
        });
        savingPrizesSnapshotRef.current = currentPrizesSnapshot;
      }

      const currentRegQuestionsSnapshot = serializeRegistrationQuestions(
        formData.registrationQuestions,
      );
      if (
        currentRegQuestionsSnapshot !==
        lastSavedRegistrationQuestionsSnapshotRef.current
      ) {
        const typeMap: Record<
          RegistrationQuestion["type"],
          "TEXT" | "PHONE_NO" | "EMAIL" | "NUMBER" | "ATTACHMENTS" | "OPTIONS"
        > = {
          Text: "TEXT",
          "Phone No.": "PHONE_NO",
          Email: "EMAIL",
          Number: "NUMBER",
          Attachments: "ATTACHMENTS",
          Options: "OPTIONS",
        };

        await updateEventRegistrationForm(token, eventId, {
          registrationForm: {
            fields: formData.registrationQuestions.map((q, idx) => ({
              label: q.label,
              type: typeMap[q.type],
              required: q.required,
              order: idx,
              options: q.options ?? [],
            })),
          },
        });
        savingRegistrationQuestionsSnapshotRef.current =
          currentRegQuestionsSnapshot;
      }
    },
    onError: (err: unknown) => {
      console.error(err);
    },
  });

  const [autoSaveStatus, setAutoSaveStatus] =
    useState<AutoSaveUiStatus>("idle");
  const lastSavedSnapshotRef = React.useRef<string | null>(null);
  const savingSnapshotRef = React.useRef<string | null>(null);
  const lastSavedAtRef = React.useRef<number | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const saveQueuedRef = React.useRef<boolean>(false);
  const lastErrorToastAtRef = React.useRef<number>(0);
  const latestFormDataRef = React.useRef<FormData>(formData);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  /**
   * Executes a save immediately (no debounce).
   */
  const runSaveMutation = useCallback((): void => {
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

        if (typeof savingAdditionalInfoSnapshotRef.current === "string") {
          lastSavedAdditionalInfoSnapshotRef.current =
            savingAdditionalInfoSnapshotRef.current;
        }
        savingAdditionalInfoSnapshotRef.current = null;

        if (typeof savingPrizesSnapshotRef.current === "string") {
          lastSavedPrizesSnapshotRef.current = savingPrizesSnapshotRef.current;
        }
        savingPrizesSnapshotRef.current = null;

        if (
          typeof savingRegistrationQuestionsSnapshotRef.current === "string"
        ) {
          lastSavedRegistrationQuestionsSnapshotRef.current =
            savingRegistrationQuestionsSnapshotRef.current;
        }
        savingRegistrationQuestionsSnapshotRef.current = null;

        const nowSnapshot = serializeFormData(latestFormDataRef.current);
        if (nowSnapshot === lastSavedSnapshotRef.current) {
          lastSavedAtRef.current = Date.now();
          setAutoSaveStatus("saved");
        } else {
          setAutoSaveStatus("dirty");
        }

        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          setTimeout(() => {
            runSaveMutation();
          }, 0);
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
  }, [saveMutation]);

  // Establish initial "saved" snapshot once hydrated from backend
  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (eventId === null) return;
    if (lastSavedSnapshotRef.current !== null) return;
    lastSavedSnapshotRef.current = serializeFormData(formData);
    lastSavedAdditionalInfoSnapshotRef.current = serializeAdditionalInfo(
      formData.additionalInfo,
    );
    lastSavedPrizesSnapshotRef.current = serializePrizes(formData.prizes);
    lastSavedRegistrationQuestionsSnapshotRef.current =
      serializeRegistrationQuestions(formData.registrationQuestions);
    lastSavedAtRef.current = Date.now();
    setAutoSaveStatus("saved");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydratedFromBackend, eventId]);

  // Debounced autosave on any form changes
  useEffect(() => {
    if (!hasHydratedFromBackend) return;
    if (eventId === null) return;

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
    eventId,
    autoSaveStatus,
    runSaveMutation,
  ]);

  // ============================================================================
  // UI HELPERS
  // ============================================================================



  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputId = useMemo(
    () => `edit-event-banner-upload-${crypto.randomUUID()}`,
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
        purpose: "EVENT_BANNER",
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

  if (isLoadingEvent) {
    return (
      <div className="w-full flex flex-col items-center p-6 gap-6 bg-background">
        <div className="w-full max-w-3xl text-muted-foreground">
          Loading event...
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="w-full flex flex-col items-center p-6 gap-6 bg-background">
        <div className="w-full max-w-3xl text-destructive-foreground">
          Failed to load event.
        </div>
      </div>
    );
  }

  const isCompletedOrCancelled =
    eventStatus === "COMPLETED" || eventStatus === "CANCELLED";

  return (
    <div className="w-full flex flex-col items-center p-2 sm:p-4 md:p-6 lg:p-10 gap-6 bg-background">
      {isCompletedOrCancelled && (
        <div className="w-full max-w-4xl flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-amber-700">
              Editing disabled
            </span>
            <span className="text-xs text-amber-600">
              This event is {eventStatus.toLowerCase()}. Content can no longer be
              edited.
            </span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 px-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-secondary text-secondary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted",
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

      {/* Content */}
      <div className="w-full max-w-6xl flex flex-col gap-6">
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
              {/* Event Name InputBlock */}
              <div className="w-full">
                <InputBlock
                  icon={null} // No icon for name, just large text
                  label={
                    <input
                      value={formData.eventName}
                      onChange={(e) =>
                        setFormData({ ...formData, eventName: e.target.value })
                      }
                      className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full text-foreground"
                      placeholder="Event Name"
                    />
                  }
                  subLabel="Enter the name of your event"
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
                        subLabel="Event Date"
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
                  subLabel="Event Time"
                  className="h-full"
                />
              </div>

              {/* Location */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<Trophy className="w-6 h-6" />} // Using MapPin ideally but Trophy was in import. Wait, I should use MapPin.
                      // Checking imports: I didn't import MapPin in the previous step, I imported CalendarIcon etc.
                      // I need to make sure MapPin is imported.
                      // Let me check imports again.
                      // I will use FileEdit as a fallback or assume MapPin if I add it.
                      // I'll stick to what I have or standard icons.
                      // Actually, I should use standard icons.
                      // checking imports... I added CalendarIcon, Clock, AlignLeft.
                      // I missed MapPin. I will use Trophy for now as placeholder to avoid error, or just text.
                      // Actually, better to just use FileEdit which is safe.
                      label={formData.eventLocation || "Add Event Location"}
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

              {/* Registration Form */}
              <div
                onClick={() => {
                  if (!isCompletedOrCancelled) {
                    setShowRegistrationModal(true);
                  }
                }}
                className={
                  isCompletedOrCancelled ? "opacity-50 cursor-not-allowed" : ""
                }
                title={
                  isCompletedOrCancelled
                    ? "Registration form cannot be edited for this status"
                    : undefined
                }
              >
                <InputBlock
                  icon={<FileEdit className="w-6 h-6" />}
                  label="Registration Form"
                  subLabel={
                    isCompletedOrCancelled
                      ? "Editing disabled for this status"
                      : "Customize registration questions"
                  }
                />
              </div>
            </div>

            {/* Registration Questions Modal */}
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
          <RegistrationSettings formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "prizes" && (
          <Prizes formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "additional-info" && (
          <AdditionalInfo formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "pass-settings" && (
          <PassSettings formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "preview" && slugParam && (
          <div className="bg-background rounded-2xl overflow-hidden">
            <EventPreview slug={slugParam} />
          </div>
        )}
      </div>
    </div>
  );
}
