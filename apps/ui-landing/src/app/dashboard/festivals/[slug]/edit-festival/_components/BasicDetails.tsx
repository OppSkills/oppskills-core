"use client";

import { Button } from "@/components/ui/button";
import {
    AlignLeft,
    Calendar as CalendarIcon,
    ChevronDown,
    Globe,
    MapPin,
    Upload,
    Mail,
    Phone,
} from "lucide-react";
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
import { FestivalFormData } from "../page";
import { toast } from "sonner";
import { DialogClose } from "@radix-ui/react-dialog";
import { useAuth } from "@clerk/nextjs";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";

// InputBlock Component
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
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary-500 transition-colors">
            {icon}
            <span className="font-medium text-lg text-foreground group-hover:text-primary">
                {label}
            </span>
        </div>
        {subLabel && (
            <p className="text-muted-foreground/60 text-sm pl-9 truncate">{subLabel}</p>
        )}
        {children}
    </div>
);

interface BasicDetailsProps {
    formData: FestivalFormData;
    setFormData: (data: React.SetStateAction<FestivalFormData>) => void;
}

export default function BasicDetails({
    formData,
    setFormData,
}: BasicDetailsProps) {
    const { getToken } = useAuth();
    const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
    const fileInputId = useMemo(() => `banner-upload-${crypto.randomUUID()}`, []);

    // Upload banner image
    async function handleBannerSelected(file: File | null): Promise<void> {
        if (!file) return;
        if (isUploadingBanner) return;

        // Client-side validation
        const maxBytes = 10 * 1024 * 1024; // 10MB
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

            // Using EVENT_BANNER as a close approximation for Festival Banner logic
            const presign = await presignImageUpload(token, {
                purpose: "EVENT_BANNER",
                mimeType: file.type,
            });

            await uploadImageToS3PresignedPost({ presign, file });

            setFormData((prev) => ({
                ...prev,
                bannerUrl: presign.publicUrl,
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
            {/* Left Sidebar - Thumbnail */}
            <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
                <div className="w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted group border border-border/50 shadow-sm">
                    <Image
                        width={371}
                        height={220}
                        src={
                            formData.bannerUrl && formData.bannerUrl.trim().length > 0
                                ? formData.bannerUrl
                                : "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Mock placeholder
                        }
                        alt="Festival Thumbnail"
                        className="w-full h-full object-cover"
                    />

                    <label
                        htmlFor={fileInputId}
                        className={cn(
                            "absolute bottom-3 right-3 rounded-full bg-foreground/30 backdrop-blur-md border border-background/20 hover:bg-foreground/50 transition-colors cursor-pointer shadow-lg",
                            isUploadingBanner ? "opacity-60 cursor-not-allowed" : ""
                        )}
                        aria-disabled={isUploadingBanner}
                    >
                        <p className="text-background px-4 py-1.5 flex items-center gap-2 text-xs font-medium">
                            <Upload className="w-3 h-3" />
                            {isUploadingBanner ? "Uploading…" : "Upload Banner"}
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
                            e.target.value = "";
                            void handleBannerSelected(f);
                        }}
                    />
                </div>
            </div>

            {/* Main Content - Form */}
            <div className="flex-1 flex flex-col gap-6 bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                {/* Header Dropdowns */}
                <div className="flex w-full justify-between items-center bg-transparent">
                    {/* Visibility Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer">
                                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    {formData.visibility === "PUBLIC" ? "Public" : "Private"}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                            <DropdownMenuItem
                                onClick={() => setFormData({ ...formData, visibility: "PUBLIC" })}
                            >
                                Public
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFormData({ ...formData, visibility: "PRIVATE" })}
                            >
                                Private
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        {formData.status}
                    </div>
                </div>

                {/* Festival Name */}
                <div className="w-full">
                    <input
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        className="text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full text-foreground"
                        placeholder="Festival Name"
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
                                            formData.startDate
                                                ? format(formData.startDate, "d MMM yyyy")
                                                : "Start Date"
                                        }
                                        subLabel="Festival Start Date"
                                        className="bg-neutral-100 h-full"
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.startDate}
                                    onSelect={(date) =>
                                        setFormData({ ...formData, startDate: date })
                                    }
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="h-full">
                                    <InputBlock
                                        icon={<CalendarIcon className="w-6 h-6" />}
                                        label={
                                            formData.endDate
                                                ? format(formData.endDate, "d MMM yyyy")
                                                : "End Date"
                                        }
                                        subLabel="Festival End Date"
                                        className="bg-neutral-100 h-full"
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.endDate}
                                    onSelect={(date) =>
                                        setFormData({ ...formData, endDate: date })
                                    }
                                    disabled={(date) =>
                                        formData.startDate ? date < formData.startDate : false
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Location */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="h-full">
                                <InputBlock
                                    icon={<MapPin className="w-6 h-6" />}
                                    label={formData.location || "Add Location"}
                                    subLabel="Where is it happening?"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Festival Location</DialogTitle>
                                <DialogDescription>
                                    Enter the location where the festival will take place.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Location</Label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                location: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. San Francisco, CA"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="submit">Save Changes</Button>
                                </DialogClose>
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
                                        formData.description
                                            ? "Description"
                                            : "Add Description"
                                    }
                                    subLabel={
                                        formData.description
                                            ? formData.description
                                                .replace(/<[^>]*>?/gm, "")
                                                .substring(0, 50) + "..."
                                            : "Tell the world about your festival..."
                                    }
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Festival Description</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
                                <RichTextEditor
                                    value={formData.description}
                                    onChange={(content: string) =>
                                        setFormData({ ...formData, description: content })
                                    }
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button>Save</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
