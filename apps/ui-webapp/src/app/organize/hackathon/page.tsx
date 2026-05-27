"use client";
import TimePicker from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  Clock,
  FileEdit,
  Earth,
  Lock,
  MapPin,
  Plus,
  University,
  Upload,
  Users,
} from "lucide-react";
import InputBlock from "@/components/ui/derived/InputBlock";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import LocationInputModal from "@/components/ui/derived/LocationInputModal";
import OpportunityPreviewCard from "@/components/ui/derived/OpportunityPreviewCard";
import HackathonInput from "@/components/ui/hackathon/Input";
import RegistrationQuestionsModal, {
  RegistrationQuestion,
} from "@/components/ui/hackathon/RegistrationQuestionsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DescriptionEditorModal from "@/components/ui/derived/DescriptionEditorModal";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);
import { format } from "date-fns";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type {
  CreateFestivalDto,
  CreateHackathonDto,
  RegistrationFieldDto,
  RegistrationFieldTypeValue,
  HackathonLocationDto,
  FestivalLocationDto,
  HackathonModeValue,
  HackathonTypeValue,
  ParticipantTypeValue,
  VisibilityValue,
} from "@oppskills/types";
import { createHackathon } from "@/lib/api/hackathonApi";
import { getMyFestivals } from "@/lib/api/festivalApi";
import CreateFestivalModal from "@/components/ui/derived/CreateFestivalModal";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import { DialogClose } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { MagicStick2 } from "@solar-icons/react";

/**
 * Organizer page: creates festivals and hackathons.
 *
 * Image upload is intentionally NOT implemented yet (S3 integration later).
 */
export default function Page() {
  const timeInputRef = useRef<HTMLInputElement>(null);
  const selectedFestivalIdRef = useRef<string | undefined>(undefined);
  const [formCompleted, setFormCompleted] = useState(false);

  interface FormData {
    eventFestName: string;
    festivalId?: string;
    eventFestVisibility: string;
    eventName: string;
    eventStartDate: Date | undefined;
    eventEndDate: Date | undefined;
    eventLocation: string;
    eventLocationPlaceId: string | undefined;
    eventTimeFrom: string;
    eventDescription: string;
    eventThumbnail: string;
    eventRegisterBy: Date | undefined;
    hackathonType: string;
    participantType: string;
    registrationQuestions: RegistrationQuestion[];
  }

  const [formData, setFormData] = useState<FormData>({
    eventFestName: "",
    festivalId: undefined,
    eventFestVisibility: "",
    eventName: "",
    eventStartDate: undefined,
    eventEndDate: undefined,
    eventLocation: "",
    eventLocationPlaceId: undefined,
    eventTimeFrom: "12:00",
    eventDescription: "",
    eventThumbnail: "",
    hackathonType: "",
    participantType: "",
    eventRegisterBy: undefined,
    registrationQuestions: [],
  });

  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const [showFestivalModal, setShowFestivalModal] = useState(false);

  const { getToken } = useAuth();

  /**
   * Minimal festival shape used for the dropdown.
   */
  type FestivalListItem = { id: string; name: string };

  const [festivals, setFestivals] = useState<ReadonlyArray<FestivalListItem>>(
    [],
  );
  const [isLoadingFestivals, setIsLoadingFestivals] = useState<boolean>(false);
  const [isSubmittingHackathon, setIsSubmittingHackathon] =
    useState<boolean>(false);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const bannerInputId = useMemo(
    () => `organizer-banner-upload-${crypto.randomUUID()}`,
    [],
  );

  /**
   * Type guard: checks if a value is a non-null object.
   */
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  /**
   * Extracts hackathon id from the backend create response.
   * Backend can return either `{ data: { id } }` or `{ id }` depending on caller.
   */
  function extractHackathonId(input: unknown): string | undefined {
    if (!isRecord(input)) return undefined;
    const directId = input["id"];
    if (typeof directId === "string" && directId.trim().length > 0) {
      return directId.trim();
    }
    const data = input["data"];
    if (!isRecord(data)) return undefined;
    const nestedId = data["id"];
    if (typeof nestedId === "string" && nestedId.trim().length > 0) {
      return nestedId.trim();
    }
    return undefined;
  }

  /**
   * Extracts `[{id,name}]` from a backend response that can be either:
   * - an array directly, OR
   * - an object with a `data` array.
   */
  function extractFestivalList(
    input: unknown,
  ): ReadonlyArray<FestivalListItem> {
    const listRaw = Array.isArray(input)
      ? input
      : isRecord(input) && Array.isArray(input["data"])
        ? input["data"]
        : [];

    return listRaw
      .map((row): FestivalListItem | null => {
        if (!isRecord(row)) return null;
        const id = row["id"];
        const name = row["name"];
        if (typeof id !== "string" || id.trim().length === 0) return null;
        if (typeof name !== "string" || name.trim().length === 0) return null;
        return { id, name };
      })
      .filter((v): v is FestivalListItem => v !== null);
  }

  /**
   * Best-effort check for URL strings.
   */
  function isValidUrl(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    let url = trimmed;
    if (url.startsWith("//")) {
      url = `https:${url}`;
    } else if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("/")
    ) {
      url = `https://${url}`;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function normalizeFestivalId(value: string | undefined): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Upload banner image to S3 via backend presign, then store CloudFront URL in state.
   * This updates `formData.eventThumbnail`, which is later persisted as `bannerImageUrl`.
   */
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
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  /**
   * Converts a Date into a backend-friendly ISO date string (`YYYY-MM-DD`).
   */
  function toIsoDateOnly(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Maps modal question types to backend registration field types.
   */
  function toRegistrationFieldTypeValue(
    type: RegistrationQuestion["type"],
  ): RegistrationFieldTypeValue {
    if (type === "Text") return "TEXT";
    if (type === "Phone No.") return "PHONE_NO";
    if (type === "Email") return "EMAIL";
    if (type === "Attachments") return "ATTACHMENTS";
    if (type === "Number") return "NUMBER";
    return "OPTIONS";
  }

  /**
   * Converts modal questions (custom only) into backend registration form fields.
   * Validates labels and OPTIONS values.
   */
  function mapRegistrationQuestionsToRegistrationFields(
    questions: ReadonlyArray<RegistrationQuestion>,
  ): RegistrationFieldDto[] {
    const fields: RegistrationFieldDto[] = [];

    questions.forEach((q, index) => {
      const label = q.label.trim();
      if (label.length === 0) return;

      const fieldType = toRegistrationFieldTypeValue(q.type);

      let options: string[] | undefined = undefined;
      if (fieldType === "OPTIONS") {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const cleaned = rawOptions
          .map((o) => o.trim())
          .filter((o) => o.length > 0);
        const unique = Array.from(new Set(cleaned));
        options = unique;
      }

      fields.push({
        label,
        type: fieldType,
        required: Boolean(q.required),
        order: index,
        options,
      });
    });

    return fields;
  }

  /**
   * Converts a free-form location input into a DTO location object.
   * If the input is a URL, we treat it as VIRTUAL; otherwise PHYSICAL.
   */
  function toLocationDto(
    input: string,
    placeId?: string,
  ): HackathonLocationDto | FestivalLocationDto | undefined {
    const trimmed = input.trim();
    if (trimmed.length === 0) return undefined;

    if (trimmed.startsWith("OFFLINE:")) {
      return { type: "PHYSICAL", address: trimmed.substring(8).trim(), placeId };
    }
    if (trimmed.startsWith("VIRTUAL:")) {
      return { type: "VIRTUAL", virtualLink: trimmed.substring(8).trim() };
    }

    if (isValidUrl(trimmed)) {
      let url = trimmed;
      if (url.startsWith("//")) {
        url = `https:${url}`;
      } else if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("/")
      ) {
        url = `https://${url}`;
      }
      return { type: "VIRTUAL", virtualLink: url };
    }
    return { type: "PHYSICAL", address: trimmed, placeId };
  }

  /**
   * Maps UI visibility labels to backend enum values.
   */
  function toVisibilityValue(label: string): VisibilityValue | undefined {
    if (label === "Public") return "PUBLIC";
    if (label === "Private") return "PRIVATE";
    if (label === "University only") return "UNIVERSITY_ONLY";
    return undefined;
  }
  const router = useRouter();

  useEffect(() => {
    if (!formCompleted) return;
    toast.success("Redirecting to Dashboard....");
    router.push("/dashboard");
  }, [formCompleted]);

  useEffect(() => {
    selectedFestivalIdRef.current = normalizeFestivalId(formData.festivalId);
  }, [formData.festivalId]);

  /**
   * Maps UI hackathon type labels to backend enum values.
   */
  function toHackathonTypeValue(label: string): HackathonTypeValue | undefined {
    if (label === "Coding Hackathon") return "CODING_HACKATHON";
    if (label === "Idea Hackathon") return "IDEA_HACKATHON";
    if (label === "Case Study Competition") return "CASE_STUDY_COMPETITION";
    if (label === "Design Hackathon") return "DESIGN_HACKATHON";
    if (label === "Open Hackathon") return "OPEN_HACKATHON";
    return undefined;
  }

  /**
   * Maps UI participant type labels to backend enum values.
   */
  function toParticipantTypeValue(
    label: string,
  ): ParticipantTypeValue | undefined {
    if (label === "Individual Participants") return "INDIVIDUAL";
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

  /**
   * Hackathon mode is required by the backend.
   * We infer it from whether the location looks virtual.
   */
  const inferredMode: HackathonModeValue = useMemo(() => {
    const loc = formData.eventLocation.trim();
    return isValidUrl(loc) ? "ONLINE" : "OFFLINE";
  }, [formData.eventLocation]);

  async function loadFestivals(): Promise<void> {
    setIsLoadingFestivals(true);
    try {
      const token = await getToken();
      if (typeof token !== "string" || token.trim().length === 0) {
        setFestivals([]);
        return;
      }
      const res = await getMyFestivals(token);
      setFestivals(extractFestivalList(res));
    } catch (err: unknown) {
      setFestivals([]);
      toast.error("Failed to load festivals.");
      // Keep console log for debugging; avoids crashing the page.
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsLoadingFestivals(false);
    }
  }

  useEffect(() => {
    void loadFestivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Formats "HH:mm" 24h string to "h:mm A" 12h string.
   */
  function formatTime(time: string | undefined): string {
    if (!time) return "12:00 AM";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  }

  function formatDateRange(start: Date | undefined, end: Date | undefined) {
    if (!start) return "Select Date";
    if (!end) return format(start, "PPP");
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${format(start, "d")}-${format(end, "d")} ${format(start, "MMM yyyy")}`;
    }
    return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
  }

  return (
    <div className="w-full flex justify-center py-8 px-6 md:px-0">
      <div className="w-full xl:max-w-[1161px] flex flex-col lg:flex-row p-2 gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
          <h2 className="text-3xl font-semibold">Hackathon Details</h2>
          <BannerUploader
            imageUrl={
              typeof formData.eventThumbnail === "string" &&
              formData.eventThumbnail.trim().length > 0
                ? formData.eventThumbnail.trim()
                : "/tmp/hackathon.jpg"
            }
            onUpload={(file) => void handleBannerSelected(file)}
            isUploading={isUploadingBanner}
            inputId={bannerInputId}
          />

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              How your card will look
            </p>
            <div className="pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
              <OpportunityPreviewCard
                imageSrc={formData.eventThumbnail}
                title={formData.eventName}
                isFree={true}
                mode={
                  formData.eventLocation
                    ? isValidUrl(formData.eventLocation)
                      ? "Online"
                      : "Offline"
                    : "Online"
                }
                registrationDeadline={formData.eventRegisterBy}
                type="HACKATHON"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Header Dropdowns */}
          <div className="flex w-full justify-between items-center">
            {/* Event Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <HackathonInput>
                    {formData.eventFestName || "Individual Hackathon"}{" "}
                    <ChevronDown className="w-4 h-4" />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      eventFestName: "Individual Hackathon",
                      festivalId: undefined,
                    }))
                  }
                >
                  <span className="font-medium text-base">
                    Individual Hackathon
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Doesn’t show up under any festivals.
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {isLoadingFestivals ? (
                  <DropdownMenuItem
                    className="p-3 text-muted-foreground"
                    disabled
                  >
                    Loading festivals...
                  </DropdownMenuItem>
                ) : festivals.length === 0 ? (
                  <DropdownMenuItem
                    className="p-3 text-muted-foreground"
                    disabled
                  >
                    No festivals found.
                  </DropdownMenuItem>
                ) : (
                  festivals.map((festival) => (
                    <DropdownMenuItem
                      key={festival.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          eventFestName: festival.name,
                          festivalId: festival.id,
                        }))
                      }
                    >
                      <span className="font-medium text-base">
                        {festival.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Events will be shown under {festival.name}.
                      </span>
                    </DropdownMenuItem>
                  ))
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-2 cursor-pointer focus:bg-transparent"
                  onClick={() => setShowFestivalModal(true)}
                >
                  <div className="flex items-center gap-2 text-primary-500 font-medium w-full">
                    <span className="font-semibold text-base py-1">
                      Create New Festival
                    </span>
                    <Plus className="w-4 h-4 ml-auto" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <HackathonInput>
                    {formData.eventFestVisibility === "Public" ? (
                      <Earth className="w-4 h-4" />
                    ) : formData.eventFestVisibility === "Private" ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <University className="w-4 h-4" />
                    )}
                    {formData.eventFestVisibility || "Public"}{" "}
                    <ChevronDown className="w-4 h-4" />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  {
                    title: "Public",
                    description:
                      "Shown on platform any one can register for the event.",
                    value: "Public",
                  },
                  {
                    title: "Private",
                    description:
                      "Unlisted. Only with People with link can register",
                    value: "Private",
                  },
                  {
                    title: "University only",
                    description:
                      "Only students from your college can register for the event.",
                    value: "University only",
                  },
                ].map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        eventFestVisibility: item.value,
                      })
                    }
                  >
                    <span className="font-medium text-base">{item.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Form Grid */}
          <div className="flex flex-col gap-4">
            {/* Name and Date */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
              <div className="flex items-center min-h-[100px]">
                <input
                  value={formData.eventName}
                  onChange={(e) =>
                    setFormData({ ...formData, eventName: e.target.value })
                  }
                  className="text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full"
                  placeholder="Hackathon Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="h-full col-span-2 min-w-0">
                      <InputBlock
                        icon={<CalendarIcon className="w-6 h-6" />}
                        label={formatDateRange(
                          formData.eventStartDate,
                          formData.eventEndDate,
                        )}
                        subLabel="Hackathon Date"
                        className="bg-muted h-full"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[660px] w-full">
                    <DialogHeader>
                      <DialogTitle>Event Date</DialogTitle>
                      <DialogDescription>
                        Select the start and end dates for the event.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-start py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Start Date
                        </label>
                        <div className="border rounded-md p-2">
                          <Calendar
                            mode="single"
                            selected={formData.eventStartDate}
                            onSelect={(date) => {
                              if (
                                date &&
                                formData.eventEndDate &&
                                date > formData.eventEndDate
                              ) {
                                setFormData({
                                  ...formData,
                                  eventStartDate: date,
                                  eventEndDate: undefined,
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  eventStartDate: date,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <div className="border rounded-md p-2">
                          <Calendar
                            mode="single"
                            selected={formData.eventEndDate}
                            onSelect={(date) => {
                              if (
                                date &&
                                formData.eventStartDate &&
                                date < formData.eventStartDate
                              ) {
                                return; // Prevent selecting end date before start date
                              }
                              setFormData({ ...formData, eventEndDate: date });
                            }}
                            disabled={(date) =>
                              formData.eventStartDate
                                ? date < formData.eventStartDate
                                : false
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Save changes</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Location and Time */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
              <LocationInputModal
                value={formData.eventLocation}
                onChange={(val, placeId) =>
                  setFormData({ ...formData, eventLocation: val, eventLocationPlaceId: placeId })
                }
                label="Add Hackathon Location"
                subLabel="Offline location or virtual link"
              />

              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full min-w-0">
                    <InputBlock
                      icon={<Clock className="w-6 h-6" />}
                      label={formatTime(formData.eventTimeFrom)}
                      subLabel="Hackathon Time"
                      className="h-full"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Event Time</DialogTitle>
                    <DialogDescription>
                      Enter the time when the event will take place.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <TimePicker
                        value={formData.eventTimeFrom}
                        onChange={(val) =>
                          setFormData({ ...formData, eventTimeFrom: val })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button">Save changes</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Description */}
            {/* Description */}
            <div
              onClick={() => setShowDescriptionModal(true)}
              className="cursor-pointer"
            >
              <div className="h-full min-w-0">
                <InputBlock
                  icon={<AlignLeft className="w-6 h-6" />}
                  label={
                    formData.eventDescription
                      ? "Description"
                      : "Add Description"
                  }
                  subLabel={
                    formData.eventDescription
                      ? formData.eventDescription.replace(/<[^>]*>?/gm, "") +
                        (formData.eventDescription.length > 50 ? "..." : "")
                      : undefined
                  }
                  className="h-full"
                />
              </div>
            </div>

            <DescriptionEditorModal
              open={showDescriptionModal}
              onOpenChange={setShowDescriptionModal}
              initialValue={formData.eventDescription}
              onSave={(val) =>
                setFormData({ ...formData, eventDescription: val })
              }
              title="Opportunity Description"
            />

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-full min-w-0">
                    <InputBlock
                      icon={<MagicStick2 className="w-5 h-5" />}
                      label="Hackathon Type"
                      subLabel={formData.hackathonType}
                      className="h-full"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]">
                  {[
                    "Coding Hackathon",
                    "Idea Hackathon",
                    "Case Study Competition",
                    "Design Hackathon",
                    "Open Hackathon",
                  ].map((type) => (
                    <DropdownMenuItem
                      key={type}
                      className="cursor-pointer py-2 font-medium"
                      onClick={() =>
                        setFormData({ ...formData, hackathonType: type })
                      }
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-full min-w-0">
                    <InputBlock
                      icon={<Users className="w-5 h-5" />}
                      label="Participant Type"
                      subLabel={formData.participantType}
                      className="h-full"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]">
                  {[
                    "Individual Participants",
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
                  ].map((type) => (
                    <DropdownMenuItem
                      key={type}
                      className="cursor-pointer py-2 font-medium"
                      onClick={() =>
                        setFormData({ ...formData, participantType: type })
                      }
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="h-full min-w-0">
                    <InputBlock
                      icon={<CalendarDays className="w-5 h-5" />}
                      label={
                        formData.eventRegisterBy
                          ? format(formData.eventRegisterBy, "PPP")
                          : "Select Date"
                      }
                      subLabel="Registration Deadline"
                      className="bg-muted h-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventRegisterBy}
                    onSelect={(date) =>
                      setFormData({ ...formData, eventRegisterBy: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Registration Form Setup */}
            <div onClick={() => setShowRegistrationModal(true)}>
              <InputBlock
                icon={<FileEdit className="w-6 h-6" />}
                label="Registration Form"
                subLabel="Customize registration questions"
              />
            </div>

            <Button
              className="w-full font-semibold rounded-full"
              size={"lg"}
              onClick={async () => {
                if (!formData.eventName) {
                  toast.error("Event Name is required");
                  return;
                }
                if (!formData.eventStartDate) {
                  toast.error("Start Date is required");
                  return;
                }
                if (!formData.eventEndDate) {
                  toast.error("End Date is required");
                  return;
                }
                if (formData.eventEndDate < formData.eventStartDate) {
                  toast.error("End Date must be after Start Date");
                  return;
                }
                if (!formData.eventLocation) {
                  toast.error("Event Location is required");
                  return;
                }
                if (!formData.eventRegisterBy) {
                  toast.error("Registration Last Date is required");
                  return;
                }

                // Validate dates
                if (formData.eventRegisterBy > formData.eventStartDate) {
                  toast.error(
                    "Registration Last Date must be before the Start Date",
                  );
                  return;
                }

                setIsSubmittingHackathon(true);
                try {
                  const token = await getToken();
                  if (typeof token !== "string" || token.trim().length === 0) {
                    toast.error("Please sign in to list an event.");
                    return;
                  }

                  const selectedFestivalId = normalizeFestivalId(
                    selectedFestivalIdRef.current ?? formData.festivalId,
                  );

                  // Pre-validate registration questions (so we don't create a hackathon and then fail saving fields).
                  const registrationFields =
                    mapRegistrationQuestionsToRegistrationFields(
                      formData.registrationQuestions,
                    );
                  const invalidOptions = registrationFields.some((f) => {
                    if (f.type !== "OPTIONS") return false;
                    return !Array.isArray(f.options) || f.options.length === 0;
                  });
                  if (invalidOptions) {
                    toast.error(
                      "Please add at least one option for every Options question.",
                    );
                    return;
                  }

                  const payload: CreateHackathonDto = {
                    name: formData.eventName,
                    description:
                      formData.eventDescription.trim().length > 0
                        ? formData.eventDescription
                        : undefined,
                    festivalId: selectedFestivalId,
                    bannerImageUrl: isValidUrl(formData.eventThumbnail)
                      ? (() => {
                          let url = formData.eventThumbnail.trim();
                          if (url.startsWith("//")) {
                            url = `https:${url}`;
                          } else if (
                            !url.startsWith("http://") &&
                            !url.startsWith("https://") &&
                            !url.startsWith("/")
                          ) {
                            url = `https://${url}`;
                          }
                          return url;
                        })()
                      : undefined,
                    startDate: toIsoDateOnly(formData.eventStartDate),
                    endDate: toIsoDateOnly(formData.eventEndDate),
                    mode: inferredMode,
                    visibility: toVisibilityValue(formData.eventFestVisibility),
                    hackathonType: toHackathonTypeValue(formData.hackathonType),
                    participantType: toParticipantTypeValue(
                      formData.participantType,
                    ),
                    location: toLocationDto(formData.eventLocation, formData.eventLocationPlaceId) as
                      | HackathonLocationDto
                      | undefined,
                    registrationDeadline: toIsoDateOnly(
                      formData.eventRegisterBy,
                    ),
                    registrationForm: {
                      fields: registrationFields,
                    },
                  };

                  const created = await createHackathon(token, payload);
                  const hackathonId = extractHackathonId(created);
                  if (!hackathonId) {
                    toast.error(
                      "Event was created but we couldn't read its id from the server response.",
                    );
                    return;
                  }

                  toast.success("Event listed successfully!");
                  setFormCompleted(true);
                } catch (err: unknown) {
                  toast.error("Failed to list event. Please try again.");
                  // eslint-disable-next-line no-console
                  console.error(err);
                } finally {
                  setIsSubmittingHackathon(false);
                }
              }}
              disabled={isSubmittingHackathon || formCompleted}
            >
              {isSubmittingHackathon
                ? "Listing..."
                : formCompleted
                  ? "Redirecting to Dashboard"
                  : "List Event"}
            </Button>
          </div>
        </div>
      </div>
      {/* Create Festival Modal */}
      {/* Create Festival Modal */}
      <CreateFestivalModal
        open={showFestivalModal}
        onOpenChange={setShowFestivalModal}
        onSuccess={loadFestivals}
      />
      <RegistrationQuestionsModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        initialQuestions={formData.registrationQuestions}
        onSave={(questions) =>
          setFormData({ ...formData, registrationQuestions: questions })
        }
      />
    </div>
  );
}
