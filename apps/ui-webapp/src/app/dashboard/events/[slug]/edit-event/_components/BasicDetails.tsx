"use client";

import { Button } from "@/components/ui/button";
import {
  FileEdit,
  Calendar as CalendarIcon,
  AlignLeft,
  Users,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import { ClockCircle, DocumentText, MapPoint, Pen, UserCircle, AltArrowDown as ChevronDown, Earth, MagicStick2 } from "@solar-icons/react";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import InputBlock from "@/components/ui/derived/InputBlock";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  let url = trimmed;
  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || (parsed.hostname.includes(".") && !parsed.hostname.endsWith("."));
  } catch {
    return false;
  }
}

interface BasicDetailsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
  /** When true, registration questions UI is read-only (e.g. completed/cancelled). */
  registrationFormLocked?: boolean;
  triggerSave?: () => void;
}

export default function BasicDetails({
  formData,
  setFormData,
  registrationFormLocked = false,
  triggerSave,
}: BasicDetailsProps) {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { getToken } = useAuth();
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const bannerInputId = useMemo(() => `edit-event-banner-upload-${crypto.randomUUID()}`, []);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [tempLocationMode, setTempLocationMode] = useState<"OFFLINE" | "VIRTUAL">("OFFLINE");
  const [tempLocationValue, setTempLocationValue] = useState("");

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
        eventThumbnail: presign.publicUrl.startsWith("http")
          ? presign.publicUrl
          : presign.publicUrl.startsWith("//")
          ? `https:${presign.publicUrl}`
          : `https://${presign.publicUrl}`,
      }));

      toast.success("Banner uploaded.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  return (
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
        {/* Header Dropdowns */}
        <div className="flex w-full justify-between items-center bg-transparent mb-2">
          {/* Event Context Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium">
                  {formData.eventFestName || "Individual Event"}
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
                    eventFestName: "Individual Event",
                  })
                }
              >
                Individual Event
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setFormData({
                    ...formData,
                    eventFestName: "Conference",
                  })
                }
              >
                Conference
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium">
                  <Earth className="w-4 h-4 text-muted-foreground" />
                  {formData.eventFestVisibility || "Public"}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem
                onClick={() =>
                  setFormData({ ...formData, eventFestVisibility: "Public" })
                }
              >
                Public
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setFormData({ ...formData, eventFestVisibility: "Private" })
                }
              >
                Private
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
                  setFormData((prev) => ({
                    ...prev,
                    eventDate: date,
                    registrationSettings: {
                      ...prev.registrationSettings,
                      eventDate: date,
                    },
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <InputBlock
            icon={<ClockCircle className="w-6 h-6" />}
            label={
              <input
                type="time"
                value={formData.eventTimeFrom}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventTimeFrom: e.target.value,
                    registrationSettings: {
                      ...prev.registrationSettings,
                      eventTime: e.target.value,
                    },
                  }))
                }
                className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
              />
            }
            subLabel="Event Time"
            className="h-full"
          />
        </div>

        {/* Location */}
        <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
          <DialogTrigger asChild>
            <div className="h-full cursor-pointer" onClick={() => {
              const loc = formData.eventLocation || "";
              const isVirtual = loc.startsWith("VIRTUAL:") || (!loc.startsWith("OFFLINE:") && isValidUrl(loc));
              setTempLocationMode(isVirtual ? "VIRTUAL" : "OFFLINE");
              setTempLocationValue(
                loc.startsWith("VIRTUAL:") ? loc.substring(8) : loc.startsWith("OFFLINE:") ? loc.substring(8) : loc
              );
              setIsLocationOpen(true);
            }}>
              <InputBlock
                icon={<MapPoint className="w-6 h-6" />}
                label={
                  formData.eventLocation
                    ? formData.eventLocation.startsWith("OFFLINE:")
                      ? formData.eventLocation.substring(8)
                      : formData.eventLocation.startsWith("VIRTUAL:")
                      ? formData.eventLocation.substring(8)
                      : formData.eventLocation
                    : "Add Event Location"
                }
                subLabel="Offline location or virtual link"
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white border border-border rounded-xl p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Update Location</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-5 py-2">
              <div className="flex bg-muted p-1 rounded-lg gap-1 border border-border/40">
                <button
                  type="button"
                  onClick={() => setTempLocationMode("OFFLINE")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    tempLocationMode === "OFFLINE"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/40"
                  }`}
                >
                  Offline
                </button>
                <button
                  type="button"
                  onClick={() => setTempLocationMode("VIRTUAL")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    tempLocationMode === "VIRTUAL"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/40"
                  }`}
                >
                  Virtual
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  {tempLocationMode === "VIRTUAL" ? "Virtual Meeting Link" : "Offline Venue Address"}
                </label>
                <input
                  type="text"
                  value={tempLocationValue}
                  onChange={(e) => setTempLocationValue(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={tempLocationMode === "VIRTUAL" ? "e.g. https://zoom.us/j/..." : "e.g. Science City Auditorium, NY"}
                />
              </div>

              <Button
                type="button"
                onClick={() => {
                  const val = tempLocationValue.trim();
                  if (tempLocationMode === "VIRTUAL") {
                    if (val.length === 0) {
                      toast.error("Virtual link cannot be empty.");
                      return;
                    }
                    if (!isValidUrl(val)) {
                      toast.error("Please enter a valid URL for the virtual link.");
                      return;
                    }
                  }
                  const prefix = tempLocationMode === "VIRTUAL" ? "VIRTUAL:" : "OFFLINE:";
                  setFormData(prev => ({ ...prev, eventLocation: prefix + val }));
                  setIsLocationOpen(false);
                  toast.success("Location updated successfully.");
                  if (triggerSave) {
                    setTimeout(() => {
                      triggerSave();
                    }, 0);
                  }
                }}
                className="w-full h-11 font-bold rounded-lg mt-2 transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Description */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="h-full">
              <InputBlock
                icon={<DocumentText className="w-6 h-6" />}
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

        {/* Event Type & Participant Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-full">
                <InputBlock
                  icon={<MagicStick2 className="w-6 h-6" />}
                  label={formData.eventType || "Event Type"}
                  subLabel="Select event format"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["Workshop", "Conference", "Meetup", "Networking", "Seminar", "Webinar", "Other"].map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() => setFormData({ ...formData, eventType: t })}
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
                  label={formData.participantType || "Participant Type"}
                  subLabel="Who can attend?"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["Individual", "Team", "Either"].map((t) => (
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
        <div
          onClick={() => {
            if (!registrationFormLocked) {
              setShowRegistrationModal(true);
            }
          }}
          className={
            registrationFormLocked ? "opacity-50 cursor-not-allowed" : ""
          }
          title={
            registrationFormLocked
              ? "Registration form cannot be edited for this status"
              : undefined
          }
        >
          <InputBlock
            icon={<FileEdit className="w-6 h-6" />}
            label="Registration Form"
            subLabel={
              registrationFormLocked
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
          setFormData((prev) => ({
            ...prev,
            registrationQuestions: questions,
          }))
        }
      />
    </div>
  );
}
