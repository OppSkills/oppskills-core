"use client";

import React from "react";
import { FestivalFormData } from "../page";
import { Switch } from "@/components/ui/switch";
import { Pulse } from "@solar-icons/react";

interface AdditionalInfoProps {
    formData: FestivalFormData;
    setFormData: (data: React.SetStateAction<FestivalFormData>) => void;
}

export default function AdditionalInfo({ formData, setFormData }: AdditionalInfoProps) {
    const isPublished = formData.status === "PUBLISHED" || formData.status === "ONGOING";

    const handleToggle = (checked: boolean) => {
        setFormData({
            ...formData,
            status: checked ? "PUBLISHED" : "DRAFT",
        });
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl">
            <div className="flex flex-col gap-1.5 p-6 bg-white border border-border rounded-2xl shadow-sm justify-center">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-base font-bold text-neutral-900 flex items-center gap-2">
                            <Pulse className="w-5 h-5 text-primary" />
                            Festival Publication Status
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Change your festival status between Draft and Published.
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isPublished ? "bg-primary-100 text-primary-700 border border-primary-300" : "bg-neutral-100 text-neutral-600 border border-neutral-300"
                        }`}>
                            {formData.status}
                        </span>
                        <Switch
                            id="publication-toggle"
                            checked={isPublished}
                            onCheckedChange={handleToggle}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
