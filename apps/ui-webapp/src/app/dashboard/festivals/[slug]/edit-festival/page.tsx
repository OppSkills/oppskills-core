"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, Pen, CheckCircle, FileText } from "lucide-react";
import BasicDetails from "./_components/BasicDetails";
import FestivalPreview from "./_components/FestivalPreview";
import AdditionalInfo from "./_components/AdditionalInfo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { updateFestival, updateFestivalStatus } from "@/lib/api/festivalApi";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateFestivalDto } from "@oppskills/types/frontend";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
    locationType: "PHYSICAL" | "VIRTUAL";
    locationCity: string;
    locationVirtualLink: string;
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
    const locType = (getString(festival, "locationType") as "PHYSICAL" | "VIRTUAL") ?? "PHYSICAL";
    const locAddress = getString(festival, "locationAddress") ?? "";
    const locCity = getString(festival, "locationCity") ?? "";
    const locVirtualLink = getString(festival, "locationVirtualLink") ?? "";

    let location = locAddress;
    if (locType === "VIRTUAL") {
        location = locVirtualLink || "Virtual Event";
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
        locationType: locType,
        locationCity: locCity,
        locationVirtualLink: locVirtualLink,
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
        defaultValue: "preview",
    });

    const { data: festivalRaw, isLoading, error } = useFestivalBySlug(slugParam);
    const [hasHydrated, setHasHydrated] = useState(false);

    // Initial state to compare against for dirty check
    const [initialState, setInitialState] = useState<FestivalFormData | null>(null);
    const lastSavedAtRef = useRef<number | null>(null);

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
        locationType: "PHYSICAL",
        locationCity: "",
        locationVirtualLink: "",
    });

    const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
    const lastSavedSnapshotRef = useRef<string | null>(null);
    const savingSnapshotRef = useRef<string | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveQueuedRef = useRef<boolean>(false);
    const latestFormDataRef = useRef<FestivalFormData>(formData);

    useEffect(() => {
        latestFormDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        if (festivalRaw && !hasHydrated) {
            try {
                const mapped = mapFestivalToFormData(festivalRaw);
                setFormData(mapped);
                setInitialState(mapped); // Set baseline for dirty check
                const updatedAt = festivalRaw["updatedAt"] ? new Date(festivalRaw["updatedAt"] as string).getTime() : Date.now();
                lastSavedAtRef.current = Number.isNaN(updatedAt) ? Date.now() : updatedAt;
                setHasHydrated(true);
            } catch (err) {
                console.error("Failed to map festival data", err);
                toast.error("Failed to load festival details");
            }
        }
    }, [festivalRaw, hasHydrated]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            const currentFormData = latestFormDataRef.current;

            const updateDto: UpdateFestivalDto = {
                name: currentFormData.name,
                slug: currentFormData.slug || undefined,
                description: currentFormData.description,
                startDate: currentFormData.startDate ? currentFormData.startDate.toISOString() : undefined,
                endDate: currentFormData.endDate ? currentFormData.endDate.toISOString() : undefined,
                posterImageUrl: currentFormData.bannerUrl,
                websiteUrl: currentFormData.websiteUrl,
                organizationName: currentFormData.organizationName,
                organizationLogoUrl: currentFormData.organizationLogoUrl,
                location: {
                    type: currentFormData.locationType || "PHYSICAL",
                    address: currentFormData.locationType === "PHYSICAL" ? currentFormData.location : undefined,
                    city: currentFormData.locationType === "PHYSICAL" ? currentFormData.locationCity : undefined,
                    virtualLink: currentFormData.locationType === "VIRTUAL" ? currentFormData.locationVirtualLink : undefined,
                }
            };

            await updateFestival(token, currentFormData.id, updateDto);

            // Update status via the patch endpoint if it changed
            if (currentFormData.status !== initialState?.status) {
                await updateFestivalStatus(token, currentFormData.id, currentFormData.status);
            }
        },
        onSuccess: () => {
            if (typeof savingSnapshotRef.current === "string") {
                lastSavedSnapshotRef.current = savingSnapshotRef.current;
            }
            savingSnapshotRef.current = null;

            const nowSnapshot = JSON.stringify(latestFormDataRef.current);
            if (nowSnapshot === lastSavedSnapshotRef.current) {
                lastSavedAtRef.current = Date.now();
                setAutoSaveStatus("saved");
            } else {
                setAutoSaveStatus("dirty");
            }

            setInitialState(latestFormDataRef.current); // Reset baseline
            queryClient.invalidateQueries({ queryKey: ["festival-by-slug", slugParam] });

            if (saveQueuedRef.current) {
                saveQueuedRef.current = false;
                setTimeout(() => {
                    runSaveMutation();
                }, 0);
            }
        },
        onError: (err) => {
            console.error(err);
            setAutoSaveStatus("error");
            savingSnapshotRef.current = null;
        }
    });

    const runSaveMutation = useCallback((): void => {
        if (saveMutation.isPending) {
            saveQueuedRef.current = true;
            return;
        }

        setAutoSaveStatus("saving");
        savingSnapshotRef.current = JSON.stringify(latestFormDataRef.current);
        saveMutation.mutate();
    }, [saveMutation]);

    // Initialize the snapshot baseline
    useEffect(() => {
        if (!hasHydrated) return;
        if (lastSavedSnapshotRef.current !== null) return;
        lastSavedSnapshotRef.current = JSON.stringify(formData);
        lastSavedAtRef.current = Date.now();
        setAutoSaveStatus("saved");
    }, [hasHydrated, formData]);

    // Handle autosave effect
    useEffect(() => {
        if (!hasHydrated) return;

        const snapshot = JSON.stringify(formData);
        if (snapshot === lastSavedSnapshotRef.current) {
            if (autoSaveStatus !== "saving") setAutoSaveStatus("saved");
            return;
        }

        setAutoSaveStatus("dirty");

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            runSaveMutation();
        }, 900);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, [formData, hasHydrated, autoSaveStatus, runSaveMutation]);

    const tabs = [
        { id: "preview", label: "Preview", icon: <CheckCircle className="w-4 h-4" /> },
        { id: "basic-details", label: "Basic Details", icon: <Pen className="w-4 h-4" /> },
        { id: "additional-info", label: "Additional Info", icon: <FileText className="w-4 h-4" /> },
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
                </div>

                {/* Sticky Tabs Bar */}
                <div className="sticky top-[70px] z-10 w-full bg-neutral-100">
                    <div className="w-full max-w-7xl mx-auto flex flex-col gap-2 px-6 py-3">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-primary-100 text-primary-600 border border-primary-500"
                                            : "text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Last saved row */}
                        <div className="flex items-center gap-4 py-2 mt-1">
                            <div className="text-sm font-bold poppins text-neutral-400 shrink-0">
                                {autoSaveStatus === "saving" ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> Saving...
                                    </span>
                                ) : autoSaveStatus === "error" ? (
                                    <span className="text-red-500">Save failed</span>
                                ) : (
                                    "Last Saved"
                                )}
                            </div>
                            <div className="flex-1 h-px bg-neutral-200" />
                            <div className="text-sm font-medium poppins text-neutral-500 shrink-0">
                                {typeof lastSavedAtRef.current === "number"
                                    ? format(new Date(lastSavedAtRef.current), "do MMMM yyyy, hh:mm a")
                                    : "Awaiting changes..."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    {activeTab === "basic-details" && (
                        <BasicDetails formData={formData} setFormData={setFormData} />
                    )}

                    {activeTab === "preview" && (
                        <FestivalPreview formData={formData} />
                    )}

                    {activeTab === "additional-info" && (
                        <AdditionalInfo formData={formData} setFormData={setFormData} />
                    )}
                </div>
            </div>
        </BoneyardSkeleton>
    );
}
