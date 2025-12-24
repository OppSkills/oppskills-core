"use client";

import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  Upload,
} from "lucide-react";
import { z } from "zod";
import EventCard from "@/components/ui/derived/EventCard";
import HackathonInput from "@/components/ui/hackathon/Input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
    ),
  }
);

import { format } from "date-fns";
import Image from "next/image";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import type {
  CreateFestivalDto,
  CreateEventDto,
  FestivalLocationDto,
  EventLocationDto,
} from "@oppskills/types/frontend";
import { createEvent } from "@/lib/api/eventApi";
import { createFestival, getFestivals } from "@/lib/api/festivalApi";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

/**
 * Organizer page for creating Events.
 * Uses TanStack Form for form state management.
 */
export default function Page() {
  const router = useRouter();
  const { getToken } = useAuth();

  // ============================================================================
  // UI COMPONENTS
  // ============================================================================

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

  // ============================================================================
  // ZOD SCHEMA
  // ============================================================================

  const eventFormSchema = z.object({
    eventFestName: z.string(),
    festivalId: z.string().optional(),
    eventName: z
      .string()
      .min(3, "Event name must be at least 3 characters")
      .max(160, "Event name must be less than 160 characters"),
    eventDate: z.date({ message: "Start date is required" }),
    eventEndDate: z.date().optional(),
    eventLocation: z.string().min(1, "Location is required"),
    eventTimeFrom: z.string(),
    eventDescription: z.string().optional(),
    eventThumbnail: z.string().optional(),
    eventRegisterBy: z.date().optional(),
    maxUsers: z.number().int().min(1).optional(),
    isFree: z.boolean(),
    entryFeeAmount: z.string().optional(),
    currency: z.string().max(8).optional(),
    organizationName: z.string().max(180).optional(),
  });

  // ============================================================================
  // TANSTACK FORM
  // ============================================================================

  // Date picker open states
  const [eventDateOpen, setEventDateOpen] = useState(false);
  const [registerByOpen, setRegisterByOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      eventFestName: "",
      festivalId: undefined as string | undefined,
      eventName: "",
      eventDate: undefined as Date | undefined,
      eventEndDate: undefined as Date | undefined,
      eventLocation: "",
      eventTimeFrom: "10:00",
      eventDescription: "",
      eventThumbnail: "",
      eventRegisterBy: undefined as Date | undefined,
      maxUsers: undefined as number | undefined,
      isFree: true,
      entryFeeAmount: "",
      currency: "INR",
      organizationName: "",
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod before submitting
      const result = eventFormSchema.safeParse(value);
      if (!result.success) {
        const firstError = result.error.issues[0];
        toast.error(firstError?.message || "Validation failed");
        return;
      }
      await handleSubmitEvent(value);
    },
  });

  const formValues = form.state.values;

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [festivalFormData, setFestivalFormData] = useState({
    poster: "",
    website: "",
    name: "",
    location: "",
    description: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  type FestivalListItem = { id: string; name: string };
  const [festivals, setFestivals] = useState<ReadonlyArray<FestivalListItem>>(
    []
  );
  const [isLoadingFestivals, setIsLoadingFestivals] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingFestival, setIsSubmittingFestival] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const bannerInputId = useMemo(
    () => `organizer-banner-upload-${crypto.randomUUID()}`,
    []
  );

  // LocalStorage persistence
  const STORAGE_KEY = "oppskills_create_event_form";
  const hasLoadedFromStorage = useRef(false);

  // ============================================================================
  // HELPERS
  // ============================================================================

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  function extractEventId(input: unknown): string | undefined {
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

  function toIsoDateOnly(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Combines a Date object and a time string (HH:mm format) into an ISO datetime string.
   * This ensures the time component is preserved in the API payload.
   */
  function combineDateAndTimeToIso(date: Date, timeHHmm: string): string {
    const [hoursRaw, minutesRaw] = timeHHmm.split(":");
    const hours = Number(hoursRaw) || 0;
    const minutes = Number(minutesRaw) || 0;
    const combined = new Date(date.getTime());
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  }

  function toLocationDto(
    input: string
  ): EventLocationDto | FestivalLocationDto | undefined {
    const trimmed = input.trim();
    if (trimmed.length === 0) return undefined;
    if (isValidUrl(trimmed)) {
      return { type: "VIRTUAL", virtualLink: trimmed };
    }
    return { type: "PHYSICAL", address: trimmed };
  }

  // ============================================================================
  // BANNER UPLOAD
  // ============================================================================

  const handleBannerSelected = useCallback(
    async (file: File | null) => {
      if (!file || isUploadingBanner) return;

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
          purpose: "HACKATHON_BANNER", // Reusing hackathon banner purpose for now
          mimeType: file.type,
        });

        await uploadImageToS3PresignedPost({ presign, file });
        form.setFieldValue("eventThumbnail", presign.publicUrl);
        toast.success("Banner uploaded.");
      } catch (err) {
        console.error(err);
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploadingBanner(false);
      }
    },
    [getToken, isUploadingBanner, form]
  );

  // ============================================================================
  // LOAD/SAVE FROM LOCALSTORAGE
  // ============================================================================

  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.eventName) form.setFieldValue("eventName", parsed.eventName);
        if (parsed.eventDescription)
          form.setFieldValue("eventDescription", parsed.eventDescription);
        if (parsed.eventThumbnail)
          form.setFieldValue("eventThumbnail", parsed.eventThumbnail);
        if (parsed.eventLocation)
          form.setFieldValue("eventLocation", parsed.eventLocation);
        if (parsed.eventTimeFrom)
          form.setFieldValue("eventTimeFrom", parsed.eventTimeFrom);
        if (parsed.eventDate)
          form.setFieldValue("eventDate", new Date(parsed.eventDate));
        if (parsed.eventRegisterBy)
          form.setFieldValue(
            "eventRegisterBy",
            new Date(parsed.eventRegisterBy)
          );
        if (parsed.organizationName)
          form.setFieldValue("organizationName", parsed.organizationName);
      }
    } catch (err) {
      console.error("Error loading saved form:", err);
    }
    hasLoadedFromStorage.current = true;
  }, [form]);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    try {
      const values = form.state.values;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...values,
          eventDate: values.eventDate?.toISOString(),
          eventRegisterBy: values.eventRegisterBy?.toISOString(),
        })
      );
    } catch (err) {
      console.error("Error saving form:", err);
    }
  }, [form.state.values]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Error clearing storage:", err);
    }
  }, []);

  // ============================================================================
  // FESTIVALS
  // ============================================================================

  const loadFestivals = useCallback(async () => {
    setIsLoadingFestivals(true);
    try {
      const token = await getToken();
      if (typeof token !== "string" || token.trim().length === 0) {
        setFestivals([]);
        return;
      }
      const res = await getFestivals(token);
      setFestivals(extractFestivalList(res));
    } catch (err) {
      setFestivals([]);
      toast.error("Failed to load festivals.");
      console.error(err);
    } finally {
      setIsLoadingFestivals(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadFestivals();
  }, [loadFestivals]);

  // ============================================================================
  // SUBMIT EVENT
  // ============================================================================

  const handleSubmitEvent = async (values: typeof formValues) => {
    if (!values.eventName) {
      toast.error("Event Name is required");
      return;
    }
    if (!values.eventDate) {
      toast.error("Event Date is required");
      return;
    }
    if (!values.eventLocation) {
      toast.error("Location is required");
      return;
    }
    if (
      values.eventRegisterBy &&
      values.eventDate &&
      values.eventRegisterBy > values.eventDate
    ) {
      toast.error("Registration deadline must be before the Event Date");
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const token = await getToken();
      if (typeof token !== "string" || token.trim().length === 0) {
        toast.error("Please sign in to list an event.");
        return;
      }

      const payload: CreateEventDto = {
        name: values.eventName,
        description:
          values.eventDescription.trim().length > 0
            ? values.eventDescription
            : undefined,
        festivalId: values.festivalId,
        bannerImageUrl: isValidUrl(values.eventThumbnail)
          ? values.eventThumbnail.trim()
          : undefined,
        // Use combineDateAndTimeToIso to preserve time component
        startDate: combineDateAndTimeToIso(
          values.eventDate,
          values.eventTimeFrom
        ),
        endDate: combineDateAndTimeToIso(
          values.eventDate,
          values.eventTimeFrom
        ),
        location: toLocationDto(values.eventLocation) as
          | EventLocationDto
          | undefined,
        // Use end of day (23:59) for registration deadline if not otherwise specified
        registrationDeadline: values.eventRegisterBy
          ? combineDateAndTimeToIso(values.eventRegisterBy, "23:59")
          : undefined,
        maxUsers: values.maxUsers,
        isFree: values.isFree,
        entryFeeAmount:
          !values.isFree && values.entryFeeAmount
            ? values.entryFeeAmount
            : undefined,
        currency:
          !values.isFree && values.currency ? values.currency : undefined,
        organizationName: values.organizationName || undefined,
      };

      const created = await createEvent(token, payload);
      const eventId = extractEventId(created);
      if (!eventId) {
        toast.error(
          "Event was created but we couldn't read its id from the server response."
        );
        return;
      }

      clearStorage();
      toast.success("Event listed successfully!");
      router.push("/dashboard/events");
    } catch (err) {
      toast.error("Failed to list event. Please try again.");
      console.error(err);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="w-full flex justify-center py-8 px-6 md:px-0">
      <div className="w-full xl:max-w-[1161px] flex flex-col lg:flex-row p-2 gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
          <h2 className="text-3xl font-semibold">Event Details</h2>
          <form.Subscribe
            selector={(state) => state.values}
            children={(values) => (
              <>
                <div className="w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted">
                  <Image
                    width={371}
                    height={371}
                    src={
                      typeof values.eventThumbnail === "string" &&
                      values.eventThumbnail.trim().length > 0
                        ? values.eventThumbnail.trim()
                        : "/tmp/hackathon.jpg"
                    }
                    alt="Event Thumbnail"
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
                      thumbnail={values.eventThumbnail}
                      title={values.eventName}
                      location={values.eventLocation}
                    />
                  </div>
                </div>
              </>
            )}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Header Dropdowns */}
          <div className="flex w-full justify-between items-center">
            {/* Festival Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <form.Subscribe
                    selector={(state) => state.values.eventFestName}
                    children={(eventFestName) => (
                      <HackathonInput>
                        {eventFestName || "Individual Event"}{" "}
                        <ChevronDown className="w-4 h-4" />
                      </HackathonInput>
                    )}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => {
                    form.setFieldValue("eventFestName", "Individual Event");
                    form.setFieldValue("festivalId", undefined);
                  }}
                >
                  <span className="font-medium text-base">
                    Individual Event
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Doesn't show up under any festivals.
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
                      onClick={() => {
                        form.setFieldValue("eventFestName", festival.name);
                        form.setFieldValue("festivalId", festival.id);
                      }}
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
          </div>

          {/* Form Grid */}
          <div className="flex flex-col gap-6">
            {/* Event Name */}
            <div className="flex items-center min-h-[80px]">
              <form.Field name="eventName">
                {(field) => (
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full"
                    placeholder="Event Name"
                  />
                )}
              </form.Field>
            </div>

            {/* Date and Time Row */}
            <div className="flex flex-wrap gap-4">
              {/* Event Date */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium text-muted-foreground">
                  Event Date
                </Label>
                <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-40 justify-between font-normal"
                    >
                      <form.Subscribe
                        selector={(state) => state.values.eventDate}
                        children={(eventDate) =>
                          eventDate ? format(eventDate, "PP") : "Select date"
                        }
                      />
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <form.Subscribe
                      selector={(state) => state.values.eventDate}
                      children={(eventDate) => (
                        <Calendar
                          mode="single"
                          selected={eventDate}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            form.setFieldValue("eventDate", date);
                            setEventDateOpen(false);
                          }}
                        />
                      )}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Event Time */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium text-muted-foreground">
                  Time
                </Label>
                <form.Field name="eventTimeFrom">
                  {(field) => (
                    <Input
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-32 h-9 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  )}
                </form.Field>
              </div>

              {/* Registration Deadline */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium text-muted-foreground">
                  Registration Deadline
                </Label>
                <Popover open={registerByOpen} onOpenChange={setRegisterByOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-40 justify-between font-normal"
                    >
                      <form.Subscribe
                        selector={(state) => state.values.eventRegisterBy}
                        children={(eventRegisterBy) =>
                          eventRegisterBy
                            ? format(eventRegisterBy, "PP")
                            : "Select date"
                        }
                      />
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <form.Subscribe
                      selector={(state) => state.values.eventRegisterBy}
                      children={(eventRegisterBy) => (
                        <Calendar
                          mode="single"
                          selected={eventRegisterBy}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            form.setFieldValue("eventRegisterBy", date);
                            setRegisterByOpen(false);
                          }}
                        />
                      )}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <Label className="px-1 text-sm font-medium text-muted-foreground">
                Location
              </Label>
              <form.Field name="eventLocation">
                {(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. San Francisco, CA or https://zoom.us/..."
                    className="bg-background"
                  />
                )}
              </form.Field>
            </div>

            {/* Description - INLINE with RichTextEditor */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-muted-foreground px-1">
                <AlignLeft className="w-5 h-5" />
                <span className="font-medium">Description</span>
              </div>
              <form.Field name="eventDescription">
                {(field) => (
                  <RichTextEditor
                    value={field.state.value}
                    onChange={(content: string) => field.handleChange(content)}
                    placeholder="Describe your event..."
                    className="min-h-[200px]"
                  />
                )}
              </form.Field>
            </div>

            {/* Additional Fields Row */}
            <div className="flex flex-wrap gap-4">
              {/* Max Users */}
              <div className="flex flex-col gap-2">
                <Label className="px-1 text-sm font-medium text-muted-foreground">
                  Max Attendees
                </Label>
                <form.Field name="maxUsers">
                  {(field) => (
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Unlimited"
                      className="w-32 bg-background"
                    />
                  )}
                </form.Field>
              </div>

              {/* Organization Name */}
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <Label className="px-1 text-sm font-medium text-muted-foreground">
                  Organization Name
                </Label>
                <form.Field name="organizationName">
                  {(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Your organization or club name"
                      className="bg-background"
                    />
                  )}
                </form.Field>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full font-semibold rounded-full mt-4"
              size="lg"
              onClick={() => form.handleSubmit()}
              disabled={isSubmittingEvent}
            >
              {isSubmittingEvent ? "Listing..." : "List Event"}
            </Button>
          </div>
        </div>
      </div>

      {/* Create Festival Modal */}
      <Dialog open={showFestivalModal} onOpenChange={setShowFestivalModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Create New Festival
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="space-y-2">
              <Label>Festival Name</Label>
              <Input
                value={festivalFormData.name}
                onChange={(e) =>
                  setFestivalFormData({
                    ...festivalFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Enter festival name"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={festivalFormData.location}
                onChange={(e) =>
                  setFestivalFormData({
                    ...festivalFormData,
                    location: e.target.value,
                  })
                }
                placeholder="City, Country"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      {festivalFormData.startDate
                        ? format(festivalFormData.startDate, "PPP")
                        : "Select date"}
                    </Button>
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
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      {festivalFormData.endDate
                        ? format(festivalFormData.endDate, "PPP")
                        : "Select date"}
                    </Button>
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
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={festivalFormData.description}
                onChange={(e) =>
                  setFestivalFormData({
                    ...festivalFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your festival..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFestivalModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!festivalFormData.name) {
                  toast.error("Festival name is required");
                  return;
                }
                if (!festivalFormData.startDate || !festivalFormData.endDate) {
                  toast.error("Start and end dates are required");
                  return;
                }

                setIsSubmittingFestival(true);
                try {
                  const token = await getToken();
                  if (!token) {
                    toast.error("Please sign in to create a festival");
                    return;
                  }

                  const payload: CreateFestivalDto = {
                    name: festivalFormData.name,
                    description: festivalFormData.description || undefined,
                    startDate: toIsoDateOnly(festivalFormData.startDate),
                    endDate: toIsoDateOnly(festivalFormData.endDate),
                    location: toLocationDto(festivalFormData.location) as
                      | FestivalLocationDto
                      | undefined,
                  };

                  await createFestival(token, payload);
                  toast.success("Festival created successfully!");
                  setShowFestivalModal(false);
                  setFestivalFormData({
                    poster: "",
                    website: "",
                    name: "",
                    location: "",
                    description: "",
                    startDate: undefined,
                    endDate: undefined,
                  });
                  await loadFestivals();
                } catch (err) {
                  toast.error("Failed to create festival");
                  console.error(err);
                } finally {
                  setIsSubmittingFestival(false);
                }
              }}
              disabled={isSubmittingFestival}
            >
              {isSubmittingFestival ? "Creating..." : "Create Festival"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
