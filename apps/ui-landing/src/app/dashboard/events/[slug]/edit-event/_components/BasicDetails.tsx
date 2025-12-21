"use client";

import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  FileEdit,
  Globe,
  MapPin,
  Users,
  Wand2,
  Upload,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { format } from "date-fns";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

// Reusing the InputBlock logic
const InputBlock = ({
  icon,
  label,
  subLabel,
  children,
  className,
  onClick,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  subLabel?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-neutral-100/50 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-neutral-100 transition-colors cursor-pointer group border border-transparent hover:border-border/50",
      className
    )}
  >
    <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
      {icon}
      <span className="font-medium text-lg text-foreground group-hover:text-primary">
        {label}
      </span>
    </div>
    {subLabel && (
      <p className="text-muted-foreground/60 text-sm pl-9">{subLabel}</p>
    )}
    {children}
  </div>
);

interface BasicDetailsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function BasicDetails({
  formData,
  setFormData,
}: BasicDetailsProps) {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { getToken } = useAuth();
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const fileInputId = useMemo(() => `banner-upload-${crypto.randomUUID()}`, []);

  /**
   * Upload banner image:
   * - Backend generates S3 presigned POST (bucket stays private; CloudFront serves public URL).
   * - Browser uploads file directly to S3.
   * - We store the returned CloudFront URL into `eventThumbnail` (autosave persists it).
   */
  async function handleBannerSelected(file: File | null): Promise<void> {
    if (!file) return;
    if (isUploadingBanner) return;

    // Client-side validation (backend presign also enforces size and MIME type).
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
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row p-2 gap-6 animate-in fade-in duration-500">
      {/* Left Sidebar - Thumbnail & Preview */}
      <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
        <div className="w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted group">
          <Image
            width={371}
            height={220}
            src={
              typeof formData.eventThumbnail === "string" &&
              formData.eventThumbnail.trim().length > 0
                ? formData.eventThumbnail.trim()
                : "/tmp/hackathon.jpg"
            }
            alt="Event Thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
            <div className="self-center mt-auto mb-auto">
              <h2 className="text-white text-3xl font-bold tracking-[0.2em] text-center">
                EVENT
              </h2>
              <p className="text-white/80 text-[10px] text-center tracking-widest mt-1">
                WWW.TECHEVENT.COM
              </p>
            </div>
            <div className="flex justify-between items-end w-full">
              <div className="h-[1px] w-12 bg-white/50 mb-1"></div>
              <span className="text-white/80 text-[10px]">19/12/2024</span>
            </div>
          </div>

          <label
            htmlFor={fileInputId}
            className={cn(
              "absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-colors cursor-pointer",
              isUploadingBanner ? "opacity-60 cursor-not-allowed" : ""
            )}
            aria-disabled={isUploadingBanner}
          >
            <p className="text-white px-4 py-1.5 flex items-center gap-2 text-xs font-medium">
              <Upload className="w-3 h-3" />
              {isUploadingBanner ? "Uploading…" : "Upload"}
            </p>
          </label>

          <input
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isUploadingBanner}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              // Reset input so selecting the same file again still triggers onChange.
              e.target.value = "";
              void handleBannerSelected(f);
            }}
          />
        </div>
      </div>

      {/* Main Content - Form */}
      <div className="flex-1 flex flex-col gap-6 bg-card rounded-2xl">
        {/* Header Dropdowns */}
        <div className="flex w-full justify-between items-center bg-transparent">
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
                  <Globe className="w-4 h-4 text-muted-foreground" />
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

        {/* Event Name */}
        <div className="w-full">
          <input
            value={formData.eventName}
            onChange={(e) =>
              setFormData({ ...formData, eventName: e.target.value })
            }
            className="text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full text-foreground"
            placeholder="Event Name"
          />
        </div>

        {/* Form Grid */}
        <div className="flex flex-col gap-4">
          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <div className="h-full">
                  <InputBlock
                    icon={<CalendarIcon className="w-6 h-6" />}
                    label={
                      formData.eventDate
                        ? format(formData.eventDate, "d MMM yyyy")
                        : "Select Date"
                    }
                    subLabel="Event Date"
                    className="bg-neutral-100 h-full"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.eventDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, eventDate: date })
                  }
                />
              </PopoverContent>
            </Popover>

            {/* Time */}
            <InputBlock
              icon={<Clock className="w-6 h-6" />}
              label={
                <input
                  type="time"
                  value={formData.eventTimeFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, eventTimeFrom: e.target.value })
                  }
                  className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
                />
              }
              subLabel="Event Time"
              className="bg-neutral-100 lg:w-full md:w-full"
            />
          </div>

          {/* Location */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="h-full">
                <InputBlock
                  icon={<MapPin className="w-6 h-6" />}
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
                  <Label>Location</Label>
                  <Input
                    value={formData.eventLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eventLocation: e.target.value,
                      })
                    }
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Description */}
          <Dialog>
            <DialogTrigger asChild>
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
                      ? formData.eventDescription
                          .replace(/<[^>]*>?/gm, "")
                          .substring(0, 50) + "..."
                      : "Everything you need to know about..."
                  }
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Event Description</DialogTitle>
              </DialogHeader>
              <RichTextEditor
                value={formData.eventDescription}
                onChange={(content: string) =>
                  setFormData({ ...formData, eventDescription: content })
                }
              />
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Event Type & Participant Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="h-full">
                  <InputBlock
                    icon={<Wand2 className="w-6 h-6" />}
                    label={formData.eventType || "Event Type"}
                    subLabel="Select event format"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["Workshop", "Conference", "Meetup", "Networking"].map((t) => (
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
                {["Individual", "Group", "Corporate", "Students"].map((t) => (
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
          <div onClick={() => setShowRegistrationModal(true)}>
            <InputBlock
              icon={<FileEdit className="w-6 h-6" />}
              label="Registration Form"
              subLabel="Customize registration questions"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-lg font-semibold shadow-lg shadow-primary/20">
            List Event
          </Button>
        </div>
      </div>
      <RegistrationQuestionsModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        questions={formData.registrationQuestions}
        onSave={(questions) =>
          setFormData({ ...formData, registrationQuestions: questions })
        }
      />
    </div>
  );
}
