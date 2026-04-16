import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getEventBySlug } from "@/lib/api/eventApi";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import { AddReferrerButton } from "./_components/AddReferrerButton";
import { ReferralsTable } from "./_components/ReferralsTable";
import {
    MotionContainer,
    MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { QRCodeSVG } from "qrcode.react";

// Helper components
function AnalyticsLoader() {
    return (
        <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

async function getEventData(token: string, slug: string) {
    try {
        const event = (await getEventBySlug(token, slug)) as { name: string };
        return event;
    } catch (e) {
        return { name: "Event" };
    }
}

export default async function ReferralsPage(props: {
    params: Promise<{ slug: string }>;
}) {
    const params = await props.params;
    const { slug } = params;
    const { getToken } = await auth();
    const token = (await getToken()) || "";

    const event = await getEventData(token, slug);

    return (
        <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
            <div className="w-full max-w-[1600px] p-6 lg:p-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="left space-y-2">
                        <h1 className="font-bold text-3xl md:text-4xl text-foreground">
                            {event.name}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            View all the Referral details about Event
                        </p>
                    </div>
                    <div className="right self-end md:self-auto w-full sm:w-auto">
                        <AddReferrerButton />
                    </div>
                </div>

                {/* Analytics Cards */}
                <Suspense fallback={<AnalyticsLoader />}>
                    <ReferralCardsSection />
                </Suspense>

                {/* Referrals Table */}
                <div className="w-full">
                    <ReferralsTable />
                </div>
            </div>
        </div>
    );
}

function ReferralCardsSection() {
    // Mock data as requested since backend doesn't exist yet
    const referralData = [
        {
            type: "highlight" as const,
            title: "Referred Participants",
            value: "80",
            badge: "Total registration",
            badgeValue: "340",
        },
        {
            type: "normal" as const,
            title: "Referral Impressions",
            value: "12,000",
            badge: "Total Impressions",
            badgeValue: "15,000",
        },
        {
            type: "normal" as const,
            title: "Referral Users",
            value: "10",
            badge: "Total Referral Users",
            badgeValue: "20",
        },
        {
            type: "normal" as const,
            title: "Referral Link Generated",
            value: "15",
            badge: "Active Links",
            badgeValue: "10",
        },
    ];

    return (
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {referralData.map((item, index) => (
                <MotionItem key={index}>
                    <AnalyticCard
                        type={item.type}
                        title={item.title}
                        value={item.value}
                        badge={item.badge}
                        badgeValue={item.badgeValue}
                        className="h-full"
                    />
                </MotionItem>
            ))}

        </MotionContainer>
    );
}
