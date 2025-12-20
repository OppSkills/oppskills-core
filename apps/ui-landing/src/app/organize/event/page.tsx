"use client";

import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  Clock,
  FileEdit,
  Globe,
  Lock,
  MapPin,
  Plus,
  University,
  Upload,
  Users,
  Wand2,
} from "lucide-react";
import EventCard from "@/components/ui/derived/EventCard";
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
  { ssr: false }
);
import { format } from "date-fns";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type {
  CreateFestivalDto,
  CreateHackathonDto,
  RegistrationFieldDto,
  RegistrationFieldTypeValue,
  RegistrationFormDto,
  HackathonLocationDto,
  FestivalLocationDto,
  HackathonModeValue,
  HackathonTypeValue,
  ParticipantTypeValue,
  VisibilityValue,
} from "@oppskills/types/frontend";
import {
  createHackathon,
  updateHackathonRegistrationForm,
} from "@/lib/api/hackathonApi";
import { createFestival, getFestivals } from "@/lib/api/festivalApi";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

/**
 * Organizer page: creates festivals and hackathons.
 *
 * Image upload is intentionally NOT implemented yet (S3 integration later).
 */
export default function Page() {
  const InputBlock = ({
    icon,
    label,
    subLabel,
    children,
    className,
  }: {
    icon?: React.ReactNode;
    label: React.ReactNode;
    subLabel?: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`bg-muted-foreground/5 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group ${className}`}
    >
      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
        <span className="font-medium text-lg">{label}</span>
      </div>
      {subLabel && (
        <p className="text-muted-foreground/60 text-sm pl-9">{subLabel}</p>
      )}
      {children}
    </div>
  );

  interface FormData {
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
  }

  const [formData, setFormData] = useState<FormData>({
    eventFestName: "",
    festivalId: undefined,
    eventFestVisibility: "",
    eventName: "",
    eventDate: undefined,
    eventLocation: "",
    eventTimeFrom: "",
    eventDescription: "",
    eventThumbnail: "",
    hackathonType: "",
    participantType: "",
    eventRegisterBy: undefined,
    registrationQuestions: [],
  });

  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showFestivalDescriptionModal, setShowFestivalDescriptionModal] =
    useState(false);

  const [showFestivalModal, setShowFestivalModal] = useState(false);

  interface FestivalFormData {
    poster: string;
    website: string;
    name: string;
    location: string;
    description: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }

  const [festivalFormData, setFestivalFormData] = useState<FestivalFormData>({
    poster: "",
    website: "",
    name: "",
    location: "",
    description: "",
    startDate: undefined,
    endDate: undefined,
  });

  const { getToken } = useAuth();

  /**
   * Minimal festival shape used for the dropdown.
   */
  type FestivalListItem = { id: string; name: string };

  const [festivals, setFestivals] = useState<ReadonlyArray<FestivalListItem>>(
    []
  );
  const [isLoadingFestivals, setIsLoadingFestivals] = useState<boolean>(false);
  const [isSubmittingHackathon, setIsSubmittingHackathon] =
    useState<boolean>(false);
  const [isSubmittingFestival, setIsSubmittingFestival] =
    useState<boolean>(false);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const bannerInputId = useMemo(
    () => `organizer-banner-upload-${crypto.randomUUID()}`,
    []
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
    input: unknown
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
    try {
      // eslint-disable-next-line no-new
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
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
    type: RegistrationQuestion["type"]
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
    questions: ReadonlyArray<RegistrationQuestion>
  ): ReadonlyArray<RegistrationFieldDto> {
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
    input: string
  ): HackathonLocationDto | FestivalLocationDto | undefined {
    const trimmed = input.trim();
    if (trimmed.length === 0) return undefined;

    if (isValidUrl(trimmed)) {
      return { type: "VIRTUAL", virtualLink: trimmed };
    }
    return { type: "PHYSICAL", address: trimmed };
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
    label: string
  ): ParticipantTypeValue | undefined {
    if (label === "Individual Participants") return "INDIVIDUAL";
    if (label === "Team of 2") return "TEAM_OF_2";
    if (label === "Team of 3") return "TEAM_OF_3";
    if (label === "Team of 4") return "TEAM_OF_4";
    if (label === "Team of 5") return "TEAM_OF_5";
    if (label === "Team of 6") return "TEAM_OF_6";
    if (label === "More than 6") return "MORE_THAN_6";
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
      const res = await getFestivals(token);
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

  return (
    <div className="w-full flex justify-center py-8 px-6 md:px-0">
      <div className="w-full xl:max-w-[1161px] flex flex-col lg:flex-row p-2 gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
          <h2 className="text-3xl font-semibold">Hackathon Details</h2>
          <div className="w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted">
            <Image
              width={371}
              height={371}
              src={
                typeof formData.eventThumbnail === "string" &&
                formData.eventThumbnail.trim().length > 0
                  ? formData.eventThumbnail.trim()
                  : "/tmp/hackathon.jpg"
              }
              alt="Hackathon Thumbnail"
              className="w-full h-full object-cover"
            />
            <label
              htmlFor={bannerInputId}
              className={cn(
                "absolute bottom-2 right-2 rounded-full bg-background/20 backdrop-blur-xl shadow-lg ring-1 ring-white/20 hover:bg-background/40 transition-colors cursor-pointer",
                isUploadingBanner ? "opacity-60 cursor-not-allowed" : ""
              )}
              aria-disabled={isUploadingBanner}
            >
              <p className="text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
                <Upload className="w-4 h-4" />
                {isUploadingBanner ? "Uploading…" : "Upload"}
              </p>
            </label>

            <input
              id={bannerInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={isUploadingBanner}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                void handleBannerSelected(f);
              }}
            />
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              How your card will look
            </p>
            <div className="pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
              <EventCard
                thumbnail={formData.eventThumbnail}
                title={formData.eventName}
                location={formData.eventLocation}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
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
                    setFormData({
                      ...formData,
                      eventFestName: "Individual Hackathon",
                      festivalId: undefined,
                    })
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
                        setFormData({
                          ...formData,
                          eventFestName: festival.name,
                          festivalId: festival.id,
                        })
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
                  <div className="flex items-center gap-2 text-primary font-medium w-full">
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
                      <Globe className="w-4 h-4" />
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
              <Popover>
                <PopoverTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<CalendarIcon className="w-6 h-6" />}
                      label={
                        formData.eventDate
                          ? format(formData.eventDate, "PPP")
                          : "Select Date"
                      }
                      subLabel="Hackathon Date"
                      className="bg-muted h-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Date</label>

                    <div className="not-prose border rounded-md p-2">
                      <Calendar
                        mode="single"
                        selected={formData.eventDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, eventDate: date })
                        }
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location and Time */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<MapPin className="w-6 h-6" />}
                      label={formData.eventLocation || "Add Hackathon Location"}
                      subLabel="Offline location or virtual link"
                      className="h-full"
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
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.eventLocation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventLocation: e.target.value,
                          })
                        }
                        placeholder="e.g. San Francisco, CA or https://zoom.us/..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="bg-muted-foreground/5 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Clock className="w-6 h-6" />
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
                </div>
                <p className="text-muted-foreground/60 text-sm pl-9">
                  Hackathon Time
                </p>
              </div>
            </div>

            {/* Description */}
            <div
              onClick={() => setShowDescriptionModal(true)}
              className="cursor-pointer"
            >
              <div className="h-full">
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
              title="Event Description"
            />

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-full">
                    <InputBlock
                      icon={<Wand2 className="w-5 h-5" />}
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
                  <div className="h-full">
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
                  <div className="h-full">
                    <InputBlock
                      icon={<CalendarDays className="w-5 h-5" />}
                      label={
                        formData.eventRegisterBy
                          ? format(formData.eventRegisterBy, "PPP")
                          : "Select Date"
                      }
                      subLabel="Last Date"
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
                if (!formData.eventDate) {
                  toast.error("Event Date is required");
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
                if (formData.eventRegisterBy > formData.eventDate) {
                  toast.error(
                    "Registration Last Date must be before the Event Date"
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

                  const payload: CreateHackathonDto = {
                    name: formData.eventName,
                    description:
                      formData.eventDescription.trim().length > 0
                        ? formData.eventDescription
                        : undefined,
                    festivalId: formData.festivalId,
                    bannerImageUrl: isValidUrl(formData.eventThumbnail)
                      ? formData.eventThumbnail.trim()
                      : undefined,
                    startDate: toIsoDateOnly(formData.eventDate),
                    endDate: toIsoDateOnly(formData.eventDate),
                    mode: inferredMode,
                    visibility: toVisibilityValue(formData.eventFestVisibility),
                    hackathonType: toHackathonTypeValue(formData.hackathonType),
                    participantType: toParticipantTypeValue(
                      formData.participantType
                    ),
                    location: toLocationDto(formData.eventLocation) as
                      | HackathonLocationDto
                      | undefined,
                    registrationDeadline: toIsoDateOnly(
                      formData.eventRegisterBy
                    ),
                  };

                  // Pre-validate registration questions (so we don't create a hackathon and then fail saving fields).
                  const registrationFields =
                    mapRegistrationQuestionsToRegistrationFields(
                      formData.registrationQuestions
                    );
                  const invalidOptions = registrationFields.some((f) => {
                    if (f.type !== "OPTIONS") return false;
                    return !Array.isArray(f.options) || f.options.length === 0;
                  });
                  if (invalidOptions) {
                    toast.error(
                      "Please add at least one option for every Options question."
                    );
                    return;
                  }

                  const created = await createHackathon(token, payload);
                  const hackathonId = extractHackathonId(created);
                  if (!hackathonId) {
                    toast.error(
                      "Event was created but we couldn't read its id from the server response."
                    );
                    return;
                  }

                  // Persist custom registration questions as internal registration form fields.
                  // Note: fixed questions are intentionally NOT stored to avoid redundancy.
                  // If organizer configured any questions, save them right away.
                  if (registrationFields.length > 0) {
                    const registrationForm: RegistrationFormDto = {
                      fields: [...registrationFields],
                    };

                    await updateHackathonRegistrationForm(token, hackathonId, {
                      registrationForm,
                    });
                  }

                  toast.success("Event listed successfully!");
                } catch (err: unknown) {
                  toast.error("Failed to list event. Please try again.");
                  // eslint-disable-next-line no-console
                  console.error(err);
                } finally {
                  setIsSubmittingHackathon(false);
                }
              }}
              disabled={isSubmittingHackathon}
            >
              {isSubmittingHackathon ? "Listing..." : "List Event"}
            </Button>
          </div>
        </div>
      </div>
      {/* Create Festival Modal */}
      <Dialog open={showFestivalModal} onOpenChange={setShowFestivalModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Festivals Details
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 mt-4">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Add Festival Poster
                </Label>
                <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden group cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                  {festivalFormData.poster ? (
                    <Image
                      src={festivalFormData.poster}
                      alt="Poster"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Image
                        src="/tmp/hackathon.jpg"
                        alt="Preview"
                        fill
                        className="object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="z-10 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-white/20">
                        <Upload className="w-4 h-4" /> Upload
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Input
                placeholder="Website"
                className="rounded-full h-12 px-6 bg-muted/50 border-transparent focus:bg-background transition-colors"
                value={festivalFormData.website}
                onChange={(e) =>
                  setFestivalFormData({
                    ...festivalFormData,
                    website: e.target.value,
                  })
                }
              />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-muted-foreground mb-1 block">
                  Festival Name
                </Label>
                <input
                  value={festivalFormData.name}
                  onChange={(e) =>
                    setFestivalFormData({
                      ...festivalFormData,
                      name: e.target.value,
                    })
                  }
                  className="text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full"
                  placeholder="Festival Name"
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <InputBlock
                      icon={<MapPin className="w-6 h-6" />}
                      label={
                        festivalFormData.location || "Add Festival Location"
                      }
                      subLabel="Offline location or virtual link"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Festival Location</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={festivalFormData.location}
                    onChange={(e) =>
                      setFestivalFormData({
                        ...festivalFormData,
                        location: e.target.value,
                      })
                    }
                    placeholder="Enter location"
                  />
                </DialogContent>
              </Dialog>

              <div
                onClick={() => setShowFestivalDescriptionModal(true)}
                className="cursor-pointer"
              >
                <div>
                  <InputBlock
                    icon={<AlignLeft className="w-6 h-6" />}
                    label={
                      festivalFormData.description
                        ? "Description"
                        : "Add Description"
                    }
                    subLabel={
                      festivalFormData.description
                        ? festivalFormData.description
                            .replace(/<[^>]*>?/gm, "")
                            .substring(0, 50) + "..."
                        : undefined
                    }
                  />
                </div>
              </div>

              <DescriptionEditorModal
                open={showFestivalDescriptionModal}
                onOpenChange={setShowFestivalDescriptionModal}
                initialValue={festivalFormData.description}
                onSave={(val) =>
                  setFestivalFormData({ ...festivalFormData, description: val })
                }
                title="Festival Description"
              />

              <div className="grid grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <div>
                      <InputBlock
                        icon={<CalendarIcon className="w-6 h-6" />}
                        label={
                          festivalFormData.startDate
                            ? format(festivalFormData.startDate, "PPP")
                            : "Start Date"
                        }
                        subLabel="Start Date"
                        className="bg-muted"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={festivalFormData.startDate}
                      onSelect={(date) =>
                        setFestivalFormData({
                          ...festivalFormData,
                          startDate: date,
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <div>
                      <InputBlock
                        icon={<CalendarIcon className="w-6 h-6" />}
                        label={
                          festivalFormData.endDate
                            ? format(festivalFormData.endDate, "PPP")
                            : "End Date"
                        }
                        subLabel="End Date"
                        className="bg-muted"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={festivalFormData.endDate}
                      onSelect={(date) =>
                        setFestivalFormData({
                          ...festivalFormData,
                          endDate: date,
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                className="w-full rounded-full mt-4 font-semibold text-lg h-12"
                onClick={async () => {
                  if (!festivalFormData.name.trim()) {
                    toast.error("Festival Name is required");
                    return;
                  }
                  if (!festivalFormData.startDate) {
                    toast.error("Start Date is required");
                    return;
                  }
                  if (!festivalFormData.endDate) {
                    toast.error("End Date is required");
                    return;
                  }
                  if (festivalFormData.endDate < festivalFormData.startDate) {
                    toast.error("End Date must be after Start Date");
                    return;
                  }

                  setIsSubmittingFestival(true);
                  try {
                    const token = await getToken();
                    if (
                      typeof token !== "string" ||
                      token.trim().length === 0
                    ) {
                      toast.error("Please sign in to list a festival.");
                      return;
                    }

                    const payload: CreateFestivalDto = {
                      name: festivalFormData.name.trim(),
                      description:
                        festivalFormData.description.trim().length > 0
                          ? festivalFormData.description
                          : undefined,
                      websiteUrl: isValidUrl(festivalFormData.website)
                        ? festivalFormData.website.trim()
                        : undefined,
                      posterImageUrl: isValidUrl(festivalFormData.poster)
                        ? festivalFormData.poster.trim()
                        : undefined,
                      location: toLocationDto(festivalFormData.location) as
                        | FestivalLocationDto
                        | undefined,
                      startDate: toIsoDateOnly(festivalFormData.startDate),
                      endDate: toIsoDateOnly(festivalFormData.endDate),
                    };

                    const res = await createFestival(token, payload);
                    toast.success("Festival listed!");
                    setShowFestivalModal(false);

                    // Refresh dropdown list; ensures the new festival appears.
                    setFestivals(
                      extractFestivalList(res).length > 0
                        ? extractFestivalList(res)
                        : festivals
                    );
                    await loadFestivals();
                  } catch (err: unknown) {
                    toast.error("Failed to list festival. Please try again.");
                    // eslint-disable-next-line no-console
                    console.error(err);
                  } finally {
                    setIsSubmittingFestival(false);
                  }
                }}
                disabled={isSubmittingFestival}
              >
                {isSubmittingFestival ? "Listing..." : "List Festival"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
