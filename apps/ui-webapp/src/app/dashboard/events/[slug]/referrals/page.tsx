import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getEventBySlug } from "@/lib/api/eventApi";
import { AddReferrerButton } from "@/app/dashboard/_components/referrals/AddReferrerButton";
import { ReferralsTable } from "@/app/dashboard/_components/referrals/ReferralsTable";
import { ReferralAnalyticsCards } from "@/app/dashboard/_components/referrals/ReferralAnalyticsCards";
import { ReferralsAnalyticsLoader } from "@/app/dashboard/_components/referrals/ReferralsAnalyticsLoader";

async function getEventData(token: string, slug: string) {
    try {
        const event = (await getEventBySlug(token, slug)) as { name: string; id: string };
        return event;
    } catch (e) {
        return { name: "Event", id: "" };
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
                        <AddReferrerButton entityType="EVENT" entityId={event.id} />
                    </div>
                </div>

                {/* Analytics Cards */}
                <Suspense fallback={<ReferralsAnalyticsLoader />}>
                    <ReferralAnalyticsCards entityType="EVENT" entityId={event.id} />
                </Suspense>

                {/* Referrals Table */}
                <div className="w-full">
                    <ReferralsTable
                        baseUrl={`/dashboard/events/${slug}/referrals`}
                        entityType="EVENT"
                        entityId={event.id}
                    />
                </div>
            </div>
        </div>
    );
}
