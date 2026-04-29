"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2, Pen, CheckCircle, UserCircle, Settings, Trophy, FileText, AlertCircle } from "lucide-react";
import BasicDetails from "./_components/BasicDetails";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { updateFestival } from "@/lib/api/festivalApi";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateFestivalDto } from "@oppskills/types/frontend";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { Container } from "@/app/dashboard/_components/Container";

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
    status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
    contactEmail: string;
    contactPhone: string;
    websiteUrl: string;
    organizationName: string;
    organizationLogoUrl: string;
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
        contactEmail: "",
        contactPhone: "",
        websiteUrl: getString(festival, "websiteUrl") ?? "",
        organizationName: getString(festival, "organizationName") ?? "",
        organizationLogoUrl: getString(festival, "organizationLogoUrl") ?? "",
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

    const [activeTab, setActiveTab] = useQueryState("tab", {
        defaultValue: "basic-details",
    });

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
        websiteUrl: "",
        organizationName: "",
        organizationLogoUrl: "",
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
                websiteUrl: formData.websiteUrl,
                organizationName: formData.organizationName,
                organizationLogoUrl: formData.organizationLogoUrl,
                location: {
                    type: "PHYSICAL", // Assuming Physical for now
                    address: formData.location
                }
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

    const tabs = [
        { id: "preview", label: "Preview", icon: <CheckCircle className="w-4 h-4" /> },
        { id: "basic-details", label: "Basic Details", icon: <Pen className="w-4 h-4" /> },
        { id: "registration-settings", label: "Registration Settings", icon: <UserCircle className="w-4 h-4" /> },
        { id: "prizes", label: "Prizes", icon: <Trophy className="w-4 h-4" /> },
        { id: "additional-info", label: "Additional Info", icon: <FileText className="w-4 h-4" /> },
        { id: "pass-settings", label: "Pass Settings", icon: <Settings className="w-4 h-4" /> },
    ];

    if (!isLoading && error) {
        return (
            <div className="flex h-full w-full items-center justify-center flex-col gap-4">
                <p className="text-destructive">Failed to load festival.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <BoneyardSkeleton
            loading={isLoading}
            name="dashboard-edit-festival"
            className="flex h-full w-full flex-col bg-neutral-50/50"
            fallback={<ProfileLikeFallback className="py-10" />}
        >
        <div className="flex flex-col h-full bg-neutral-50/50 w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-background border-b sticky top-0 z-20 transition-all duration-200">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold">Edit Festival</h1>
                    <p className="text-xs text-muted-foreground">{formData.name}</p>
                </div>
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

            {/* Sticky Tabs Bar */}
            <div className="sticky top-[69px] z-10 w-full border-b border-border bg-background/95 backdrop-blur-md">
                <div className="w-full max-w-7xl mx-auto flex items-center gap-2 px-6 py-3 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-primary-100 text-primary-600 border-primary-500"
                                    : "border-neutral-500 text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {activeTab === "basic-details" && (
                    <BasicDetails formData={formData} setFormData={setFormData} />
                )}

                {activeTab === "preview" && (
                    <Container heading="Preview" description="Festival preview is currently under development.">
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                            <CheckCircle className="w-12 h-12 opacity-20" />
                            <p>Premium preview coming soon.</p>
                        </div>
                    </Container>
                )}

                {(activeTab === "registration-settings" || activeTab === "prizes" || activeTab === "additional-info" || activeTab === "pass-settings") && (
                    <Container 
                        heading={tabs.find(t => t.id === activeTab)?.label || "Section"} 
                        description="This feature is not yet supported for Festivals in the current backend version."
                    >
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                            <AlertCircle className="w-12 h-12 text-amber-500 opacity-50" />
                            <div className="text-center">
                                <p className="font-medium text-neutral-800">Section Unavailable</p>
                                <p className="text-sm">Please contact the backend team to enable {tabs.find(t => t.id === activeTab)?.label} for Festivals.</p>
                            </div>
                        </div>
                    </Container>
                )}
            </div>
        </div>
        </BoneyardSkeleton>
    );
}
