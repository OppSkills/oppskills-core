"use client";
import { FileEdit, Calendar as CalendarIcon, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import React, { useState, useMemo } from "react";
import { FormData } from "../page";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import {
  ClockCircle,
  DocumentText,
  MapPoint,
  MagicStick2,
  Earth,
  AltArrowDown as SolarChevronDown,
} from "@solar-icons/react";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import InputBlock from "@/components/ui/derived/InputBlock";
import LocationInputModal from "@/components/ui/derived/LocationInputModal";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false },
);

interface BasicDetailsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
  registrationFormLocked?: boolean;
  triggerSave?: () => void;
}

export default function BasicDetails({
  formData,
  setFormData,
  registrationFormLocked = false,
  triggerSave,
}: BasicDetailsProps) {
  const { getToken } = useAuth();
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const bannerInputId = useMemo(
    () => `edit-hackathon-banner-upload-${crypto.randomUUID()}`,
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
      if (!token) {
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
      toast.error("Upload failed.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      {/* Left Sidebar */}
      <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
        <BannerUploader
          imageUrl={formData.eventThumbnail}
          onUpload={(file) => void handleBannerSelected(file)}
          isUploading={isUploadingBanner}
          inputId={bannerInputId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex w-full justify-between items-center bg-transparent mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium">
                  {formData.eventFestName || "Individual Hackathon"}
                  <SolarChevronDown className="w-4 h-4 text-muted-foreground" />
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
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium">
                  <Earth className="w-4 h-4 text-muted-foreground" />
                  {formData.eventFestVisibility || "Public"}
                  <SolarChevronDown className="w-4 h-4 text-muted-foreground" />
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
                      : "Start Date"
                  }
                  subLabel="Hackathon Start"
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
            subLabel="Start Time"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <div className="h-full">
                <InputBlock
                  icon={<CalendarIcon className="w-6 h-6" />}
                  label={
                    formData.eventEndDate
                      ? formData.eventEndDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "End Date (Optional)"
                  }
                  subLabel="Hackathon End"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.eventEndDate}
                onSelect={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventEndDate: date,
                    registrationSettings: {
                      ...prev.registrationSettings,
                      endDate: date,
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
                value={formData.eventTimeTo || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventTimeTo: e.target.value,
                    registrationSettings: {
                      ...prev.registrationSettings,
                      endTime: e.target.value,
                    },
                  }))
                }
                className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
                placeholder="End Time"
              />
            }
            subLabel="End Time (Optional)"
          />
        </div>

        <LocationInputModal
          value={formData.eventLocation}
          onChange={(val, placeId) =>
            setFormData((prev) => ({ ...prev, eventLocation: val, eventLocationPlaceId: placeId }))
          }
          label="Add Location"
          subLabel="Offline or Virtual"
        />

        <Dialog>
          <DialogTrigger asChild>
            <div className="h-full">
              <InputBlock
                icon={<DocumentText className="w-6 h-6" />}
                label={
                  formData.eventDescription ? "Description" : "Add Description"
                }
                subLabel={
                  formData.eventDescription
                    ? formData.eventDescription
                        .replace(/<[^>]*>?/gm, "")
                        .substring(0, 50) + "..."
                    : "Details about the hackathon"
                }
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Description</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden border rounded-md">
              <RichTextEditor
                value={formData.eventDescription}
                onChange={(content) =>
                  setFormData({ ...formData, eventDescription: content })
                }
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-full">
                <InputBlock
                  icon={<MagicStick2 className="w-6 h-6" />}
                  label={formData.hackathonType || "Hackathon Type"}
                  subLabel="Select format"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["Coding Hackathon", "Idea Hackathon", "Open Hackathon"].map(
                (t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() =>
                      setFormData({ ...formData, hackathonType: t })
                    }
                  >
                    {t}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-full">
                <InputBlock
                  icon={<Users className="w-6 h-6" />}
                  label={formData.participantType || "Participant Type"}
                  subLabel="Team size"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              {[
                "Individual",
                "Team of 2",
                "Team of 3",
                "Team of 4",
                "Team of 5",
                "Team of 2-4",
                "Team of 3-5",
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
      </div>
    </div>
  );
}
