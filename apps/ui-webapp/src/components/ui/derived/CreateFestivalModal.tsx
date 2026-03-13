"use client";

import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import type {
    CreateFestivalDto,
    FestivalLocationDto,
} from "@oppskills/types/frontend";
import { createFestival } from "@/lib/api/festivalApi";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import Image from "next/image";

import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
    () => import("@/components/ui/editor/RichtextEditor"),
    {
        ssr: false,
        loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
    }
);

interface CreateFestivalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function CreateFestivalModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateFestivalModalProps) {
    const { getToken } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPoster, setIsUploadingPoster] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        description: "",
        website: "",
        poster: "",
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
    });

    const posterInputId = useMemo(
        () => `festival-poster-upload-${crypto.randomUUID()}`,
        []
    );

    function toIsoDateOnly(value: Date): string {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
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

    function toLocationDto(
        input: string
    ): FestivalLocationDto | undefined {
        const trimmed = input.trim();
        if (trimmed.length === 0) return undefined;
        if (isValidUrl(trimmed)) {
            return { type: "VIRTUAL", virtualLink: trimmed };
        }
        return { type: "PHYSICAL", address: trimmed };
    }

    const handlePosterSelected = async (file: File | null) => {
        if (!file || isUploadingPoster) return;

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

        setIsUploadingPoster(true);
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

            setFormData(prev => ({ ...prev, poster: presign.publicUrl }));
            toast.success("Poster uploaded.");
        } catch (err) {
            console.error(err);
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsUploadingPoster(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Festival name is required");
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error("Start and end dates are required");
            return;
        }
        if (formData.endDate < formData.startDate) {
            toast.error("End date cannot be before start date");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Please sign in to create a festival");
                return;
            }

            const payload: CreateFestivalDto = {
                name: formData.name,
                description: formData.description || undefined,
                startDate: toIsoDateOnly(formData.startDate),
                endDate: toIsoDateOnly(formData.endDate),
                location: toLocationDto(formData.location),
                websiteUrl: isValidUrl(formData.website) ? formData.website : undefined,
                posterImageUrl: isValidUrl(formData.poster) ? formData.poster : undefined,
            };

            await createFestival(token, payload);
            toast.success("Festival created successfully!");
            onOpenChange(false);

            // Reset form
            setFormData({
                name: "",
                location: "",
                description: "",
                website: "",
                poster: "",
                startDate: undefined,
                endDate: undefined,
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            toast.error("Failed to create festival");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Create New Festival
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-4">
                    <div className="space-y-2">
                        <Label>Festival Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Enter festival name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Festival Poster</Label>
                        <div
                            className="w-full relative h-[200px] overflow-hidden rounded-xl flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group cursor-pointer"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files?.[0]) {
                                    void handlePosterSelected(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => document.getElementById(posterInputId)?.click()}
                        >
                            {formData.poster ? (
                                <Image
                                    src={formData.poster}
                                    alt="Poster"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Upload className="w-8 h-8 opacity-50" />
                                    <p className="text-sm">Click or drag image to upload</p>
                                </div>
                            )}

                            {isUploadingPoster && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 backdrop-blur-sm">
                                    <div className="animate-pulse text-sm font-medium">
                                        Uploading...
                                    </div>
                                </div>
                            )}

                            <input
                                id={posterInputId}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={isUploadingPoster}
                                onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    e.target.value = "";
                                    void handlePosterSelected(f);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                            value={formData.website}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    website: e.target.value,
                                })
                            }
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={formData.location}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
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
                                        {formData.startDate
                                            ? format(formData.startDate, "PPP")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.startDate}
                                        onSelect={(date) =>
                                            setFormData({
                                                ...formData,
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
                                        {formData.endDate
                                            ? format(formData.endDate, "PPP")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.endDate}
                                        onSelect={(date) =>
                                            setFormData({
                                                ...formData,
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
                        <RichTextEditor
                            value={formData.description}
                            onChange={(content) =>
                                setFormData({
                                    ...formData,
                                    description: content,
                                })
                            }
                            placeholder="Describe your festival..."
                            className="min-h-[200px]"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create Festival"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
