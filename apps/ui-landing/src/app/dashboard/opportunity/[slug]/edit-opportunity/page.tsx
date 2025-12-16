"use client";

import {
  FileEdit,
  Trophy,
  LayoutTemplate,
  CheckCircle2,
  FileText,
  Settings,
} from "lucide-react";
import {
  RegistrationQuestion,
} from "@/components/ui/hackathon/RegistrationQuestionsModal";
import React, { useState } from "react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

// Import new components
import BasicDetails from "./_components/BasicDetails";
import RoundsAndStages from "./_components/RoundsAndStages";
import AdditionalInfo from "./_components/AdditionalInfo";
import Prizes from "./_components/Prizes";
import RegistrationSettings from "./_components/RegistrationSettings";

/**
 * Shared Types
 */
export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export interface FormData {
  eventFestName: string;
  festivalId?: string;
  eventFestVisibility: string;
  eventName: string;
  eventDate: Date | undefined;
  eventLocation: string;
  eventTimeFrom: string;
  eventDescription: string;
  eventThumbnail: string;
  eventRegisterBy: Date | undefined;
  hackathonType: string;
  participantType: string;
  registrationQuestions: RegistrationQuestion[];
  rounds: Round[];
}

/**
 * Edit Opportunity Page
 */
export default function EditOpportunityPage() {
  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "basic-details" });

  const tabs = [
    { id: "preview", label: "Preview", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "basic-details", label: "Basic Details", icon: <FileEdit className="w-4 h-4" /> },
    { id: "registration-settings", label: "Registration Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "rounds-stages", label: "Rounds and Stages", icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: "prizes", label: "Prizes", icon: <Trophy className="w-4 h-4" /> },
    { id: "additional-info", label: "Additional Info", icon: <FileText className="w-4 h-4" /> },
  ];

  const [formData, setFormData] = useState<FormData>({
    eventFestName: "",
    festivalId: undefined,
    eventFestVisibility: "",
    eventName: "HackVerse",
    eventDate: new Date("2025-11-24"),
    eventLocation: "",
    eventTimeFrom: "09:00",
    eventDescription: "",
    eventThumbnail: "",
    hackathonType: "",
    participantType: "",
    eventRegisterBy: undefined,
    registrationQuestions: [],
    rounds: [],
  });

  return (
    <div className="w-full flex flex-col items-center py-6 gap-6">
      {/* Tabs Navigation */}
      <div className="w-full xl:max-w-[1161px] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 min-w-max px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-secondary text-secondary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full xl:max-w-[1161px]">
        {activeTab === "basic-details" && (
          <BasicDetails formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "registration-settings" && (
          <RegistrationSettings formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "rounds-stages" && (
          <RoundsAndStages formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "prizes" && (
          <Prizes formData={formData} setFormData={setFormData} />
        )}

        {activeTab === "additional-info" && (
          <AdditionalInfo formData={formData} setFormData={setFormData} />
        )}

        {/* Placeholders for other tabs */}
        {activeTab === "preview" && (
          <div className="flex items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
            Content for {tabs.find(t => t.id === activeTab)?.label} is coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
