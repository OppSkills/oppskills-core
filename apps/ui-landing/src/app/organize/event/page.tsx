"use client";

import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  Clock,
  FileEdit,
  MapPin,
  Plus,
  Upload,
  Users,
  Building2,
  Banknote,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimePicker from "@/components/ui/time-picker";
import DescriptionEditorModal from "@/components/ui/derived/DescriptionEditorModal";
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
  CreateEventDto,
  EventLocationDto,
  FestivalLocationDto,
} from "@oppskills/types/frontend";
import { createEvent } from "@/lib/api/eventApi";
import { getMyFestivals } from "@/lib/api/festivalApi";
import CreateFestivalModal from "@/components/ui/derived/CreateFestivalModal";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

/**
 * Organizer page for creating Events.
 * Uses TanStack Form for form state management.
 * UI Pattern matches Organize Opportunity page.
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
      className={cn(
        "bg-neutral-200 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
        <span className="font-medium text-lg truncate w-full">{label}</span>
      </div>
      {subLabel && (
        <p className="text-muted-foreground/60 text-sm pl-9 truncate">{subLabel}</p>
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
    eventStartDate: z.date({ message: "Start date is required" }),
    eventEndDate: z.date({ message: "End date is required" }),
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

  const [formCompleted, setFormCompleted] = useState(false);

  const form = useForm({
    defaultValues: {
      eventFestName: "",
      festivalId: undefined as string | undefined,
      eventName: "",
      eventStartDate: undefined as Date | undefined,
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
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  type FestivalListItem = { id: string; name: string };
  const [festivals, setFestivals] = useState<ReadonlyArray<FestivalListItem>>(
    []
  );
  const [isLoadingFestivals, setIsLoadingFestivals] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
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

  function formatTime(time: string | undefined): string {
    if (!time) return "10:00 AM";
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
          purpose: "HACKATHON_BANNER",
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
        if (parsed.eventStartDate)
          form.setFieldValue("eventStartDate", new Date(parsed.eventStartDate));
        if (parsed.eventEndDate)
          form.setFieldValue("eventEndDate", new Date(parsed.eventEndDate));
        if (parsed.eventRegisterBy)
          form.setFieldValue(
            "eventRegisterBy",
            new Date(parsed.eventRegisterBy)
          );
        if (parsed.organizationName)
          form.setFieldValue("organizationName", parsed.organizationName);
        if (parsed.maxUsers)
          form.setFieldValue("maxUsers", parsed.maxUsers);
        if (typeof parsed.isFree === "boolean")
          form.setFieldValue("isFree", parsed.isFree);
        if (parsed.entryFeeAmount)
          form.setFieldValue("entryFeeAmount", parsed.entryFeeAmount);
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
          eventStartDate: values.eventStartDate?.toISOString(),
          eventEndDate: values.eventEndDate?.toISOString(),
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
      const res = await getMyFestivals(token);
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
    if (!values.eventStartDate) {
      toast.error("Start Date is required");
      return;
    }
    if (!values.eventEndDate) {
      toast.error("End Date is required");
      return;
    }
    if (values.eventEndDate < values.eventStartDate) {
      toast.error("End Date must be after Start Date");
      return;
    }
    if (!values.eventLocation) {
      toast.error("Location is required");
      return;
    }
    if (
      values.eventRegisterBy &&
      values.eventStartDate &&
      values.eventRegisterBy > values.eventStartDate
    ) {
      toast.error("Registration deadline must be before the Start Date");
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
        startDate: combineDateAndTimeToIso(
          values.eventStartDate,
          values.eventTimeFrom
        ),
        endDate: combineDateAndTimeToIso(
          values.eventEndDate,
          values.eventTimeFrom
        ),
        location: toLocationDto(values.eventLocation) as
          | EventLocationDto
          | undefined,
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
      setFormCompleted(true);
    } catch (err) {
      toast.error("Failed to list event. Please try again.");
      console.error(err);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  useEffect(() => {
    if (!formCompleted) return;
    toast.success("Redirecting to Dashboard....");
    router.push("/dashboard");
  }, [formCompleted]);

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
                      "absolute bottom-2 right-2 rounded-full bg-background/20 backdrop-blur-xl shadow-lg ring-1 ring-background/20 hover:bg-background/40 transition-colors cursor-pointer",
                      isUploadingBanner ? "opacity-60 cursor-not-allowed" : ""
                    )}
                    aria-disabled={isUploadingBanner}
                  >
                    <p className="text-background px-4 py-2 flex items-center gap-2 text-xs font-medium">
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
          <div className="flex flex-col gap-4">

            {/* ROW 1: Name and Date */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
              <div className="flex items-center min-h-[100px]">
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
              <div className="grid grid-cols-2 gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="h-full col-span-2">
                      <form.Subscribe
                        selector={(state) => [state.values.eventStartDate, state.values.eventEndDate]}
                        children={([start, end]: any[]) => (
                          <InputBlock
                            icon={<CalendarIcon className="w-6 h-6" />}
                            label={formatDateRange(start, end)}
                            subLabel="Event Date"
                            className="bg-muted h-full"
                          />
                        )}
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
                      <form.Subscribe
                        selector={state => state.values}
                        children={(values) => (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Start Date</label>
                              <div className="border rounded-md p-2">
                                <Calendar
                                  mode="single"
                                  selected={values.eventStartDate}
                                  onSelect={(date) => {
                                    if (date && values.eventEndDate && date > values.eventEndDate) {
                                      form.setFieldValue("eventStartDate", date);
                                      form.setFieldValue("eventEndDate", undefined);
                                    } else {
                                      form.setFieldValue("eventStartDate", date);
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
                                  selected={values.eventEndDate}
                                  onSelect={(date) => {
                                    if (date && values.eventStartDate && date < values.eventStartDate) return;
                                    form.setFieldValue("eventEndDate", date);
                                  }}
                                  disabled={(date) => values.eventStartDate ? date < values.eventStartDate : false}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      />
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

            {/* ROW 2: Location and Time */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
              {/* Location Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={(state) => state.values.eventLocation}
                      children={(loc) => (
                        <InputBlock
                          icon={<MapPin className="w-6 h-6" />}
                          label={loc || "Add Event Location"}
                          subLabel="Offline location or virtual link"
                          className="h-full"
                        />
                      )}
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
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="location">Location</Label>
                      <form.Field name="eventLocation">
                        {(field) => (
                          <Input
                            id="location"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. San Francisco, CA or https://zoom.us/..."
                          />
                        )}
                      </form.Field>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button">Save changes</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Time Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={(state) => state.values.eventTimeFrom}
                      children={(time) => (
                        <InputBlock
                          icon={<Clock className="w-6 h-6" />}
                          label={formatTime(time)}
                          subLabel="Event Time"
                          className="h-full"
                        />
                      )}
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
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="time">Time</Label>
                      <form.Subscribe
                        selector={(state) => state.values.eventTimeFrom}
                        children={(time) => (
                          <TimePicker
                            value={time}
                            onChange={(val) => form.setFieldValue("eventTimeFrom", val)}
                          />
                        )}
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

            {/* ROW 3: Description Modal */}
            <div onClick={() => setShowDescriptionModal(true)} className="cursor-pointer">
              <div className="h-full">
                <form.Subscribe
                  selector={state => state.values.eventDescription}
                  children={(desc) => (
                    <InputBlock
                      icon={<AlignLeft className="w-6 h-6" />}
                      label={desc ? "Description" : "Add Description"}
                      subLabel={
                        desc
                          ? desc.replace(/<[^>]*>?/gm, "") + (desc.length > 50 ? "..." : "")
                          : undefined
                      }
                      className="h-full"
                    />
                  )}
                />
              </div>
            </div>

            <form.Subscribe
              selector={state => state.values.eventDescription}
              children={(desc) => (
                <DescriptionEditorModal
                  open={showDescriptionModal}
                  onOpenChange={setShowDescriptionModal}
                  initialValue={desc}
                  onSave={(val) => form.setFieldValue("eventDescription", val)}
                  title="Event Description"
                />
              )}
            />

            {/* ROW 4: Extra Details (Max Users, Org, Deadline, Fee) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Users */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={state => state.values.maxUsers}
                      children={max => (
                        <InputBlock
                          icon={<Users className="w-5 h-5" />}
                          label={max ? `${max} Users` : "Unlimited Users"}
                          subLabel="Max Attendees"
                          className="h-full"
                        />
                      )}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Max Users</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 flex flex-col gap-3">
                    <Label>Max Attendees</Label>
                    <form.Field name="maxUsers">
                      {field => (
                        <Input
                          type="number"
                          min={1}
                          value={field.state.value ?? ""}
                          onChange={e => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Leave empty for unlimited"
                        />
                      )}
                    </form.Field>
                  </div>
                  <DialogFooter><DialogClose asChild><Button>Save</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Organization Name */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={state => state.values.organizationName}
                      children={name => (
                        <InputBlock
                          icon={<Building2 className="w-5 h-5" />}
                          label={name || "Organization Name"}
                          subLabel="Who is organizing?"
                          className="h-full"
                        />
                      )}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Organization</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 flex flex-col gap-3">
                    <Label>Organization Name</Label>
                    <form.Field name="organizationName">
                      {field => (
                        <Input
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          placeholder="e.g. Coding Club"
                        />
                      )}
                    </form.Field>
                  </div>
                  <DialogFooter><DialogClose asChild><Button>Save</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Registration Deadline */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={state => state.values.eventRegisterBy}
                      children={date => (
                        <InputBlock
                          icon={<CalendarDays className="w-5 h-5" />}
                          label={date ? format(date, "PPP") : "Select Date"}
                          subLabel="Registration Deadline"
                          className="bg-muted h-full"
                        />
                      )}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <form.Subscribe
                    selector={state => state.values.eventRegisterBy}
                    children={date => (
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => form.setFieldValue("eventRegisterBy", d)}
                        initialFocus
                      />
                    )}
                  />
                </PopoverContent>
              </Popover>

              {/* Ticketing / Fee */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="h-full">
                    <form.Subscribe
                      selector={state => state.values}
                      children={vals => (
                        <InputBlock
                          icon={<Banknote className="w-5 h-5" />}
                          label={vals.isFree ? "Free Event" : `${vals.currency} ${vals.entryFeeAmount}`}
                          subLabel="Ticketing"
                          className="h-full"
                        />
                      )}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ticketing</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 flex flex-col gap-4">
                    <form.Subscribe
                      selector={s => s.values.isFree}
                      children={isFree => (
                        <div className="flex bg-muted rounded-lg p-1">
                          <button
                            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", isFree ? "bg-background shadow" : "text-muted-foreground")}
                            onClick={() => form.setFieldValue("isFree", true)}
                          >
                            Free
                          </button>
                          <button
                            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", !isFree ? "bg-background shadow" : "text-muted-foreground")}
                            onClick={() => form.setFieldValue("isFree", false)}
                          >
                            Paid
                          </button>
                        </div>
                      )}
                    />

                    <form.Subscribe
                      selector={s => s.values}
                      children={vals => !vals.isFree && (
                        <div className="flex gap-2">
                          <div className="w-24 flex flex-col gap-2">
                            <Label>Currency</Label>
                            <Input
                              value={vals.currency}
                              onChange={e => form.setFieldValue("currency", e.target.value)}
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              value={vals.entryFeeAmount}
                              onChange={e => form.setFieldValue("entryFeeAmount", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <DialogFooter><DialogClose asChild><Button>Save</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>

            </div>

            {/* Submit Button */}
            <Button
              className="w-full font-semibold rounded-full mt-4"
              size="lg"
              onClick={() => {
                formCompleted ? router.push("/dashboard") : form.handleSubmit();
              }}
              disabled={isSubmittingEvent || formCompleted}
            >
              {isSubmittingEvent
                ? "Listing..."
                : formCompleted
                  ? "Redirecting to Dashboard"
                  : "List Event"}
            </Button>
          </div>
        </div>
      </div>

      {/* Create Festival Modal */}
      <CreateFestivalModal
        open={showFestivalModal}
        onOpenChange={setShowFestivalModal}
        onSuccess={loadFestivals}
      />
    </div>
  );
}
