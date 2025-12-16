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

export interface RegistrationQuestion {
  id: string;
  label: string;
  required: boolean;
  isStatic: boolean;
}

export interface RegistrationSettingsData {
  candidateTypes: string[];
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  eventDate: Date | undefined;
  eventTime: string;
  maxTeamsNoLimit: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  questions: RegistrationQuestion[];
}

export interface Prize {
  id: string;
  name: string;
  amount: string;
  description: string;
}

export interface PrizesData {
  description: string;
  certificateProvided: boolean | null;
  list: Prize[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Attachment {
  id: string;
  title: string;
  type: string;
}

export interface AdditionalInfoData {
  contacts: Contact[];
  attachments: Attachment[];
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
  registrationQuestions: React.ReactNode[]; // Keep for compatibility if used elsewhere, but we use registrationSettings.questions now
  rounds: Round[];
  registrationSettings: RegistrationSettingsData;
  prizes: PrizesData;
  additionalInfo: AdditionalInfoData;
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
    eventFestName: "TechFest 2025",
    festivalId: "fest-001",
    eventFestVisibility: "Public",
    eventName: "HackVerse 2025",
    eventDate: new Date("2025-11-24"),
    eventLocation: "Bangalore International Exhibition Centre",
    eventTimeFrom: "09:00",
    eventDescription: "Join us for the biggest hackathon of the year! Build, learn, and grow with the community.",
    eventThumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2670",
    hackathonType: "Online",
    participantType: "Team",
    eventRegisterBy: new Date("2025-11-20"),
    registrationQuestions: [],
    rounds: [
      {
        id: "r1",
        name: "Ideation Phase",
        description: "Submit your initial ideas and prototypes.",
        startDate: new Date("2025-11-01"),
        endDate: new Date("2025-11-10"),
        startTime: "10:00",
        endTime: "23:59"
      },
      {
        id: "r2",
        name: "Hackathon Finale",
        description: "24-hour non-stop coding marathon.",
        startDate: new Date("2025-11-24"),
        endDate: new Date("2025-11-25"),
        startTime: "09:00",
        endTime: "09:00"
      }
    ],
    registrationSettings: {
      candidateTypes: ["College students", "Freshers"],
      startDate: new Date("2025-10-01"),
      startTime: "09:00",
      endDate: new Date("2025-11-20"),
      endTime: "23:59",
      eventDate: new Date("2025-11-24"),
      eventTime: "09:00",
      maxTeamsNoLimit: false,
      questions: [
        { id: "name", label: "Name", required: true, isStatic: true },
        { id: "email", label: "Email", required: true, isStatic: true },
        { id: "mobile", label: "Mobile Number", required: true, isStatic: true },
        { id: "gender", label: "Gender", required: true, isStatic: true },
        { id: "college", label: "Current College/ Organization", required: true, isStatic: true },
        { id: "userType", label: "User Type", required: true, isStatic: true },
        { id: "github", label: "GitHub Profile URL", required: true, isStatic: false },
      ]
    },
    prizes: {
      description: "Win exciting cash prizes and internship opportunities!",
      certificateProvided: true,
      list: [
        { id: "p1", name: "Star Performer", amount: "₹ 1,00,000", description: "Grand winner of the hackathon" },
        { id: "p2", name: "Runner Up", amount: "₹ 50,000", description: "Second place winner" }
      ]
    },
    additionalInfo: {
      contacts: [
        { id: "c1", name: "John Doe", phone: "+91 98765 43210", email: "john.doe@example.com" },
        { id: "c2", name: "Jane Smith", phone: "+91 99887 76655", email: "jane.smith@example.com" }
      ],
      attachments: [
        { id: "a1", title: "Rulebook.pdf", type: "PDF File" },
        { id: "a2", title: "Problem_Statement.zip", type: "Zip File" }
      ]
    }
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
