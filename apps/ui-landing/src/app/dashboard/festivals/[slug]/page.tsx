import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { currentUser, auth } from "@clerk/nextjs/server";
import {
    MotionContainer,
    MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import RegistrationLineChart from "@/app/dashboard/_components/RegistrationChart";
import Alerts from "@/app/dashboard/_components/Alerts";
import RoundStats from "@/app/dashboard/_components/RoundStats";
import DomainsChart from "@/app/dashboard/_components/DomainsChart";
import GenderDiversityChart from "@/app/dashboard/_components/GenderDiversityChart";
import ImpressionsChart from "@/app/dashboard/_components/ImpressionsChart";

// Helper components
function AnalyticsLoader() {
    return (
        <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

// Mock Data for Festival Analytics
const mockAnalytics = {
    registrations: 156,
    impressions: 1205,
    views: 890,
};

// Async component for Analytics
async function AnalyticsSection() {
    // Mock data usage
    const stats = mockAnalytics;

    const { registrations: completedRegistrations, impressions, views } = stats;

    let ctrRatio = impressions > 0 ? views / impressions : 0;
    if (ctrRatio > 1) ctrRatio = 1;

    let ctrBadge = "Concerning";
    if (ctrRatio > 0.5) {
        ctrBadge = "Best";
    } else if (ctrRatio >= 0.25) {
        ctrBadge = "Good";
    } else if (ctrRatio < 0.1) {
        ctrBadge = "Concerning";
    } else {
        ctrBadge = "Average";
    }

    const analyticData = [
        {
            type: "highlight",
            title: "Completed Registration",
            value: completedRegistrations.toString(),
            badge: "Total Registrations",
            badgeValue: completedRegistrations.toString(),
        },
        {
            type: "normal",
            title: "Total Impressions",
            value: impressions.toLocaleString(),
            badge: "All Time",
            badgeValue: "",
        },
        {
            type: "normal",
            title: "Total Views",
            value: views.toLocaleString(),
            badge: "All Time",
            badgeValue: "",
        },
        {
            type: "normal",
            title: "CTR Ratio",
            value: (ctrRatio * 100).toFixed(1) + "%",
            badge: ctrBadge,
            badgeValue: "",
        },
    ];

    return (
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 justify-between">
            {analyticData.map((item, index) => (
                <MotionItem key={index}>
                    <AnalyticCard
                        type={(item.type as "normal" | "highlight") || "normal"}
                        title={item.title}
                        value={item.value}
                        badge={item.badge}
                        badgeValue={item.badgeValue}
                    />
                </MotionItem>
            ))}
        </MotionContainer>
    );
}

export default async function FestivalDashboard(props: {
    params: Promise<{ slug: string }>;
}) {
    const params = await props.params;
    const { slug } = params;
    const user = await currentUser();

    // Mock Name (since we are using mock data)
    const name = "Tech Fest 2024 (Mock)";

    return (
        <div className="flex justify-center w-full bg-neutral-200">
            <div className="w-full bg-background p-4 sm:p-6 flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="left">
                        <h1 className="font-semibold text-[24px] md:text-[28px] break-words">
                            Welcome back, {user?.firstName} {user?.lastName}
                        </h1>
                        <p className="text-sm md:text-[16px] text-muted-foreground pt-1 md:pt-2">
                            View all the details for {slug}
                        </p>
                    </div>
                    <div className="right self-end md:self-auto">
                        <Button className="rounded-full">
                            <Image
                                src="/icons/share.svg"
                                alt="Share"
                                width={16}
                                height={16}
                            />{" "}
                            Share
                        </Button>
                    </div>
                </div>

                {/* Analytics Section with Loader */}
                <Suspense fallback={<AnalyticsLoader />}>
                    <AnalyticsSection />
                </Suspense>

                {/* CHARTS */}
                <MotionContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <MotionItem>
                        <RegistrationLineChart />
                    </MotionItem>
                    <MotionItem>
                        <Alerts />
                    </MotionItem>
                    <MotionItem>
                        <RoundStats />
                    </MotionItem>
                    <MotionItem>
                        <DomainsChart />
                    </MotionItem>
                    <MotionItem>
                        <GenderDiversityChart />
                    </MotionItem>
                    <MotionItem>
                        <ImpressionsChart />
                    </MotionItem>
                </MotionContainer>
            </div>
        </div>
    );
}
