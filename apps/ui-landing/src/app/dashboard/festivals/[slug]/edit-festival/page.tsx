"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import BasicDetails from "./_components/BasicDetails";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { updateFestival } from "@/lib/api/festivalApi";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateFestivalDto } from "@oppskills/types/frontend";

// Types
export interface FestivalFormData {
    id: string;
    name: string;
    slug: string;
    description: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    location: string;
    bannerUrl: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "ONGOING" | "COMPLETED" | "CANCELLED";
    contactEmail: string;
    contactPhone: string;
}

// Helper: Check if val is object
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getDate(value: unknown): Date | undefined {
    if (typeof value !== "string" || value.trim().length === 0) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapFestivalToFormData(festival: unknown): FestivalFormData {
    if (!isRecord(festival)) {
        throw new Error("Invalid festival data format");
    }

    const startDate = getDate(festival["startDate"]);
    const endDate = getDate(festival["endDate"]);

    // Map Location
    const locType = getString(festival, "locationType");
    const locAddress = getString(festival, "locationAddress");
    const locCity = getString(festival, "locationCity");
    const locVirtualLink = getString(festival, "locationVirtualLink");

    let location = "";
    if (locType === "VIRTUAL") {
        location = locVirtualLink ?? "Virtual Event";
    } else {
        location = [locAddress, locCity].filter(Boolean).join(", ");
    }

    // Map Visibility/Status
    const status = getString(festival, "status") as FestivalFormData["status"] ?? "DRAFT";
    const visibility = (status === "PUBLISHED" || status === "ONGOING" || status === "COMPLETED") ? "PUBLIC" : "PRIVATE";

    return {
        id: getString(festival, "id") ?? "",
        name: getString(festival, "name") ?? "",
        slug: getString(festival, "slug") ?? "",
        description: getString(festival, "description") ?? "",
        startDate,
        endDate,
        location,
        bannerUrl: getString(festival, "posterImageUrl") ?? "",
        visibility, // Inferred
        status,
        // Fields not yet in backend festival entity
        contactEmail: "",
        contactPhone: "",
    };
}

export default function EditFestivalPage() {
    const params = useParams();
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const slugParam = useMemo(() => {
        const raw = isRecord(params) ? params["slug"] : undefined;
        if (typeof raw === "string") return raw;
        if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
        return null;
    }, [params]);

    const { data: festivalRaw, isLoading, error } = useFestivalBySlug(slugParam);
    const [hasHydrated, setHasHydrated] = useState(false);

    // Initial state to compare against for dirty check
    const [initialState, setInitialState] = useState<FestivalFormData | null>(null);

    const [formData, setFormData] = useState<FestivalFormData>({
        id: "",
        name: "",
        slug: "",
        description: "",
        startDate: undefined,
        endDate: undefined,
        location: "",
        bannerUrl: "",
        visibility: "PRIVATE",
        status: "DRAFT",
        contactEmail: "",
        contactPhone: "",
    });

    useEffect(() => {
        if (festivalRaw && !hasHydrated) {
            try {
                const mapped = mapFestivalToFormData(festivalRaw);
                setFormData(mapped);
                setInitialState(mapped); // Set baseline for dirty check
                setHasHydrated(true);
            } catch (err) {
                console.error("Failed to map festival data", err);
                toast.error("Failed to load festival details");
            }
        }
    }, [festivalRaw, hasHydrated]);

    // Check if form is dirty
    const isDirty = useMemo(() => {
        if (!initialState) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialState);
    }, [formData, initialState]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            const updateDto: UpdateFestivalDto = {
                name: formData.name,
                description: formData.description,
                startDate: formData.startDate ? formData.startDate.toISOString() : undefined,
                endDate: formData.endDate ? formData.endDate.toISOString() : undefined,
                posterImageUrl: formData.bannerUrl,
                location: {
                    type: "PHYSICAL", // Assuming Physical for now based on simplicity of current UI
                    address: formData.location
                }
                // Note: visibility/status updates might need separate handling or specific mapping if supported by update DTO
            };

            await updateFestival(token, formData.id, updateDto);
        },
        onSuccess: () => {
            toast.success("Festival details saved successfully");
            setInitialState(formData); // Reset dirty state
            queryClient.invalidateQueries({ queryKey: ["festival-by-slug", slugParam] });
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to save changes");
        }
    });

    const handleDiscard = () => {
        if (initialState) {
            setFormData(initialState);
            toast.info("Changes discarded");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center flex-col gap-4">
                <p className="text-destructive">Failed to load festival.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-background border-b sticky top-0 z-10 transition-all duration-200">
                <h1 className="text-xl font-bold">Edit Festival</h1>
                <div className={`flex gap-2 transition-opacity duration-200 ${isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Button variant="outline" onClick={handleDiscard} disabled={saveMutation.isPending}>Discard</Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <BasicDetails formData={formData} setFormData={setFormData} />
            </div>
        </div>
    );
}
