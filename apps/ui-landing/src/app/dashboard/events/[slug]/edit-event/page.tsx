"use client";

import React, { useState } from "react";
import {
  FileEdit,
  Trophy,
  LayoutTemplate,
  CheckCircle2,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistrationQuestion } from "@/components/ui/hackathon/RegistrationQuestionsModal";
import BasicDetails from "./_components/BasicDetails";
import RegistrationSettings from "./_components/RegistrationSettings";
import Prizes from "./_components/Prizes";
import AdditionalInfo from "./_components/AdditionalInfo";
import CompetitionDetailsPage from "@/app/competitions/[slug]/page";
import { useQueryState } from "nuqs";

// Types
export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export interface BasicQuestion {
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
  questions: BasicQuestion[];
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
  url?: string;
  size?: number;
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
  eventType: string; // Changed from hackathonType
  participantType: string;
  registrationQuestions: RegistrationQuestion[];
  rounds: Round[];
  registrationSettings: RegistrationSettingsData;
  prizes: PrizesData;
  additionalInfo: AdditionalInfoData;
}

export default function EditEventPage() {
  const [activeTab, setActiveTab] = useQueryState("activeTab", {
    defaultValue: "basic-details",
  });

  const [formData, setFormData] = useState<FormData>({
    eventFestName: "Detailed Event",
    festivalId: "fest-001",
    eventFestVisibility: "Public",
    eventName: "Tech Innovators Summit 2024",
    eventDate: new Date("2024-03-15"),
    eventLocation: "San Francisco Convention Center",
    eventTimeFrom: "09:00",
    eventDescription:
      "Join us for the biggest tech summit of the year! Connect, learn, and grow.",
    eventThumbnail:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2670",
    eventType: "Conference",
    participantType: "Individual",
    eventRegisterBy: new Date("2024-03-10"),
    registrationQuestions: [],
    rounds: [],
    registrationSettings: {
      candidateTypes: ["Professionals"],
      startDate: new Date("2024-01-01"),
      startTime: "09:00",
      endDate: new Date("2024-03-10"),
      endTime: "23:59",
      eventDate: new Date("2024-03-15"),
      eventTime: "09:00",
      maxTeamsNoLimit: true,
      questions: [
        { id: "name", label: "Name", required: true, isStatic: true },
        { id: "email", label: "Email", required: true, isStatic: true },
        {
          id: "mobile",
          label: "Mobile Number",
          required: true,
          isStatic: true,
        },
        { id: "gender", label: "Gender", required: true, isStatic: true },
        {
          id: "college",
          label: "Current College/ Organization",
          required: true,
          isStatic: true,
        },
        { id: "userType", label: "User Type", required: true, isStatic: true },
      ],
    },
    prizes: {
      description: "",
      certificateProvided: true,
      list: [],
    },
    additionalInfo: {
      contacts: [],
      attachments: [],
    },
  });

  const tabs = [
    {
      id: "preview",
      label: "Preview",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: "basic-details",
      label: "Basic Details",
      icon: <FileEdit className="w-4 h-4" />,
    },
    {
      id: "registration-settings",
      label: "Registration Settings",
      icon: <Settings className="w-4 h-4" />,
    },
    { id: "prizes", label: "Prizes", icon: <Trophy className="w-4 h-4" /> },
    {
      id: "additional-info",
      label: "Additional Info",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full flex flex-col items-center p-6 gap-6 bg-background min-h-screen">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* Tabs Navigation */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap bg-background",
                  activeTab === tab.id
                    ? "bg-secondary text-secondary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          {activeTab === "basic-details" && (
            <BasicDetails formData={formData} setFormData={setFormData} />
          )}

          {/* Placeholders for other tabs to prevent errors if clicked */}
          {activeTab === "registration-settings" && (
            <RegistrationSettings
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {activeTab === "prizes" && (
            <Prizes formData={formData} setFormData={setFormData} />
          )}

          {activeTab === "additional-info" && (
            <AdditionalInfo formData={formData} setFormData={setFormData} />
          )}

          {/* Placeholders for other tabs to prevent errors if clicked */}
          {activeTab !== "basic-details" &&
            activeTab !== "preview" &&
            activeTab !== "registration-settings" &&
            activeTab !== "prizes" &&
            activeTab !== "additional-info" && (
              <div className="bg-background rounded-2xl p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Settings className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Coming Soon</p>
                <p>
                  {tabs.find((t) => t.id === activeTab)?.label} configuration is
                  under development.
                </p>
              </div>
            )}

          {activeTab === "preview" && (
            <div className="bg-background rounded-2xl overflow-hidden min-h-[500px]">
              <div className="p-8 text-center text-muted-foreground">
                Preview Component Placeholder
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
