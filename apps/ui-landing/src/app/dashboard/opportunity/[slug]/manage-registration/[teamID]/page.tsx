"use client";

import React, { useState } from "react";
import { ChevronLeft, UserCircle2, CheckCircle2 } from "lucide-react"; // Using stock lucide icons
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import TeamMembers, { TeamMember } from "./_components/TeamMembers";
import SynopsisSubmission from "./_components/SynopsisSubmission";
import PresentationSubmission from "./_components/PresentationSubmission";
import OfflineRound from "./_components/OfflineRound";
import Image from "next/image"; // If we need Next/Image, though avatar uses it internally? No, AvatarImage uses img tag usually unless customized.

// Mock Data
const MOCK_MEMBERS: TeamMember[] = [
    {
        id: "1",
        name: "Student Name",
        role: "Team Leader",
        college: "College Name",
        email: "pghasdfasdf@gmail.com",
        location: "Lucknow, Uttar Pradesh, India",
        education: "College Student | Management | 2-Year MBA (Master of Business Administration) | Full Time | 2nd Year",
        registeredOn: "20 Dec 2025, 02:02 PM",
        avatarUrl: "https://github.com/shadcn.png" // Placeholder
    },
    {
        id: "2",
        name: "Student Name",
        role: "Team Member",
        college: "College Name",
        email: "pghasdfasdf@gmail.com",
        location: "Lucknow, Uttar Pradesh, India",
        education: "College Student | Management | 2-Year MBA (Master of Business Administration) | Full Time | 2nd Year",
        registeredOn: "20 Dec 2025, 02:02 PM",
        avatarUrl: "https://github.com/shadcn.png"
    },
    {
        id: "3",
        name: "Student Name",
        role: "Team Member",
        college: "College Name",
        email: "pghasdfasdf@gmail.com",
        location: "Lucknow, Uttar Pradesh, India",
        education: "College Student | Management | 2-Year MBA (Master of Business Administration) | Full Time | 2nd Year",
        registeredOn: "20 Dec 2025, 02:02 PM",
        avatarUrl: "https://github.com/shadcn.png"
    }
];

type TabType = "members" | "synopsis" | "presentation" | "offline";

export default function TeamManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("members");

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-6 space-y-6 font-inter">
            {/* Header Section */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-gray-100 rounded-full h-10 w-10">
                    <ChevronLeft className="h-6 w-6 text-gray-500" />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        {/* Team Logo Placeholder - replacing with a colored circle if no image */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            LN
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 font-poppins">Team Name</h1>
                    </div>
                    <Badge className="w-fit mt-1 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-medium text-xs px-2 py-0.5 rounded-md">
                        Completed
                    </Badge>
                </div>
            </div>


            {/* Custom Tabs Navigation */}
            <div className="flex flex-wrap gap-4">
                {/* Tab 1: Team Members */}
                <button
                    onClick={() => setActiveTab("members")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${activeTab === "members"
                            ? "bg-secondary/50 border-primary/30 text-primary shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                >
                    <UserCircle2 className="h-5 w-5" />
                    Team Members
                </button>

                {/* Tab 2: Synopsis Submission */}
                <button
                    onClick={() => setActiveTab("synopsis")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${activeTab === "synopsis"
                            ? "bg-secondary/50 border-primary/30 text-primary shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs border ${activeTab === "synopsis" ? "border-primary" : "border-muted-foreground"}`}>1</div>
                    Synopsis Submission
                </button>

                {/* Tab 3: Presentation Submission */}
                <button
                    onClick={() => setActiveTab("presentation")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${activeTab === "presentation"
                            ? "bg-secondary/50 border-primary/30 text-primary shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs border ${activeTab === "presentation" ? "border-primary" : "border-muted-foreground"}`}>2</div>
                    Presentation Submission
                </button>

                {/* Tab 4: Offline Round */}
                <button
                    onClick={() => setActiveTab("offline")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all ${activeTab === "offline"
                            ? "bg-secondary/50 border-primary/30 text-primary shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs border ${activeTab === "offline" ? "border-primary" : "border-muted-foreground"}`}>3</div>
                    Offline Round
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 min-h-[500px]">
                {activeTab === "members" && <TeamMembers members={MOCK_MEMBERS} />}
                {activeTab === "synopsis" && <SynopsisSubmission />}
                {activeTab === "presentation" && <PresentationSubmission />}
                {activeTab === "offline" && <OfflineRound />}
            </div>
        </div>
    );
}
