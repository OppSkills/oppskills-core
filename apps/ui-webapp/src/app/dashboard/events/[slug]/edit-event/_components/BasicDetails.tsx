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

interface BasicDetailsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
  /** When true, registration questions UI is read-only (e.g. completed/cancelled). */
  registrationFormLocked?: boolean;
}

export default function BasicDetails({
  formData,
  setFormData,
  registrationFormLocked = false,
}: BasicDetailsProps) {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { getToken } = useAuth();
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const bannerInputId = useMemo(() => `edit-event-banner-upload-${crypto.randomUUID()}`, []);

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
        <Dialog>
          <DialogTrigger asChild>
            <div className="h-full">
              <InputBlock
                icon={<MapPoint className="w-6 h-6" />}
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
