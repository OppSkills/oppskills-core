"use client";

import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    Link as LinkIcon,
    Building2,
    Image as ImageIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { ClockCircle, DocumentText, MapPoint, Pen, UserCircle, MagicStick2, Earth } from "@solar-icons/react";
import BannerUploader from "@/components/ui/derived/BannerUploader";
import InputBlock from "@/components/ui/derived/InputBlock";

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
    const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
    const bannerInputId = useMemo(() => `festival-banner-upload-${crypto.randomUUID()}`, []);
    const logoInputId = useMemo(() => `festival-logo-upload-${crypto.randomUUID()}`, []);

    // Upload banner image
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
                bannerUrl: presign.publicUrl,
            }));

            toast.success("Banner uploaded.");
        } catch (err: unknown) {
            console.error(err);
            toast.error("Upload failed.");
        } finally {
            setIsUploadingBanner(false);
        }
    }

    // Upload Logo
    async function handleLogoSelected(file: File | null): Promise<void> {
        if (!file) return;
        if (isUploadingLogo) return;

        setIsUploadingLogo(true);
        try {
            const token = await getToken();
            if (!token) return;

            const presign = await presignImageUpload(token, {
                purpose: "HACKATHON_BANNER", // Using existing purpose
                mimeType: file.type,
            });

            await uploadImageToS3PresignedPost({ presign, file });

            setFormData((prev) => ({
                ...prev,
                organizationLogoUrl: presign.publicUrl,
            }));

            toast.success("Logo uploaded.");
        } catch (err: unknown) {
            console.error(err);
            toast.error("Logo upload failed.");
        } finally {
            setIsUploadingLogo(false);
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Left Sidebar - Assets */}
            <div className="w-full lg:max-w-[371px] flex flex-col gap-6">
                <BannerUploader
                    imageUrl={formData.bannerUrl}
                    onUpload={(file) => void handleBannerSelected(file)}
                    isUploading={isUploadingBanner}
                    inputId={bannerInputId}
                />

                <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                    <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Organization Logo
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center overflow-hidden relative group">
                            {formData.organizationLogoUrl ? (
                                <Image
                                    src={formData.organizationLogoUrl}
                                    alt="Org Logo"
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-neutral-400" />
                            )}
                            {isUploadingLogo && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <ClockCircle className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor={logoInputId}
                                className="text-xs font-bold bg-primary-100 text-primary-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary-200 transition-colors"
                            >
                                {formData.organizationLogoUrl ? "Change Logo" : "Upload Logo"}
                            </label>
                            <input
                                id={logoInputId}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleLogoSelected(e.target.files?.[0] || null)}
                            />
                            {formData.organizationLogoUrl && (
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, organizationLogoUrl: "" }))}
                                    className="text-xs font-bold text-destructive hover:underline"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Form */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex w-full justify-between items-center bg-transparent mb-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer">
                                <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">
                                    <Earth className="w-4 h-4 text-muted-foreground" />
                                    {formData.visibility === "PUBLIC" ? "Public" : "Private"}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                            <DropdownMenuItem onClick={() => setFormData({ ...formData, visibility: "PUBLIC" })}>Public</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFormData({ ...formData, visibility: "PRIVATE" })}>Private</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                        {formData.status}
                    </div>
                </div>

                <div className="w-full">
                    <InputBlock
                        icon={null}
                        label={
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full text-foreground"
                                placeholder="Festival Name"
                            />
                        }
                        subLabel="Official name of the festival"
                        className="bg-transparent hover:bg-transparent p-0 border-none cursor-text"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="h-full">
                                <InputBlock
                                    icon={<CalendarIcon className="w-6 h-6" />}
                                    label={formData.startDate ? format(formData.startDate, "dd MMM yyyy") : "Start Date"}
                                    subLabel="Festival Start"
                                    className="h-full"
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formData.startDate}
                                onSelect={(date) => setFormData({ ...formData, startDate: date })}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="h-full">
                                <InputBlock
                                    icon={<CalendarIcon className="w-6 h-6" />}
                                    label={formData.endDate ? format(formData.endDate, "dd MMM yyyy") : "End Date"}
                                    subLabel="Festival End"
                                    className="h-full"
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formData.endDate}
                                onSelect={(date) => setFormData({ ...formData, endDate: date })}
                                disabled={(date) => formData.startDate ? date < formData.startDate : false}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <div className="h-full">
                            <InputBlock
                                icon={<MapPoint className="w-6 h-6" />}
                                label={formData.location || "Add Location"}
                                subLabel="Festival Venue"
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Festival Location</DialogTitle>
                        </DialogHeader>
                        <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Science City, Ahmedabad"
                            className="mt-4"
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button>Done</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <div className="h-full">
                            <InputBlock
                                icon={<DocumentText className="w-6 h-6" />}
                                label={formData.description ? "Description" : "Add Description"}
                                subLabel={formData.description ? formData.description.replace(/<[^>]*>?/gm, "").substring(0, 50) + "..." : "Tell us about the festival"}
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                        <DialogHeader><DialogTitle>Festival Description</DialogTitle></DialogHeader>
                        <div className="flex-1 overflow-hidden border rounded-md">
                            <RichTextEditor
                                value={formData.description}
                                onChange={(content) => setFormData({ ...formData, description: content })}
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputBlock
                        icon={<Building2 className="w-6 h-6" />}
                        label={
                            <input
                                value={formData.organizationName}
                                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full"
                                placeholder="Organization Name"
                            />
                        }
                        subLabel="Organizing Entity"
                    />

                    <InputBlock
                        icon={<LinkIcon className="w-6 h-6" />}
                        label={
                            <input
                                value={formData.websiteUrl}
                                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full"
                                placeholder="https://..."
                            />
                        }
                        subLabel="Official Website"
                    />
                </div>
            </div>
        </div>
    );
}
