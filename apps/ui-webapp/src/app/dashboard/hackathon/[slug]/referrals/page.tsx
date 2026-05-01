import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
import { AddReferrerButton } from "@/app/dashboard/_components/referrals/AddReferrerButton";
import { ReferralsTable } from "@/app/dashboard/_components/referrals/ReferralsTable";
import { ReferralAnalyticsCards } from "@/app/dashboard/_components/referrals/ReferralAnalyticsCards";
import { ReferralsAnalyticsLoader } from "@/app/dashboard/_components/referrals/ReferralsAnalyticsLoader";

async function getHackathonData(token: string, slug: string) {
    try {
        const hackathon = (await getHackathonBySlug(token, slug)) as { name: string; id: string };
        return hackathon;
    } catch (e) {
        return { name: "Hackathon", id: "" };
    }
}

export default async function ReferralsPage(props: {
    params: Promise<{ slug: string }>;
}) {
    const params = await props.params;
    const { slug } = params;
    const { getToken } = await auth();
    const token = (await getToken()) || "";

    const hackathon = await getHackathonData(token, slug);

    return (
        <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
            <div className="w-full p-4 lg:p-6 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="left space-y-2">
                        <h1 className="font-bold text-3xl md:text-4xl text-foreground">
                            {hackathon.name}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            View all the Referral details about Hackathon
                        </p>
                    </div>
                    <div className="right self-end md:self-auto w-full sm:w-auto">
                        <AddReferrerButton entityType="HACKATHON" entityId={hackathon.id} />
                    </div>
                </div>

                {/* Analytics Cards */}
                <Suspense fallback={<ReferralsAnalyticsLoader />}>
                    <ReferralAnalyticsCards
                        entityType="HACKATHON"
                        entityId={hackathon.id}
                        slug={slug}
                        itemName={hackathon.name}
                    />
                </Suspense>

                {/* Referrals Table */}
                <div className="w-full">
                    <ReferralsTable
                        baseUrl={`/dashboard/hackathon/${slug}/referrals`}
                        entityType="HACKATHON"
                        entityId={hackathon.id}
                    />
                </div>
            </div>
        </div>
    );
}
