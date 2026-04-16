import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getFestivalBySlug } from "@/lib/api/festivalApi";
import { ReferredUsersTable } from "@/app/dashboard/_components/referrals/ReferredUsersTable";

// Helper components
function AnalyticsLoader() {
    return (
        <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

async function getFestivalData(token: string, slug: string) {
    try {
        const festival = (await getFestivalBySlug(token, slug)) as { name: string };
        return festival;
    } catch (e) {
        return { name: "Festival" };
    }
}

async function getReferrerName(referId: string) {
    const names: Record<string, string> = {
        "1": "Ananya Sharma",
        "2": "Rohit Verma",
        "3": "Suhani Mehta",
        "4": "Amitabh Singh",
        "5": "Neha Kapoor",
        "6": "Karan Malhotra"
    };
    return names[referId] || "Referrer";
}

export default async function ReferrerDetailsPage(props: {
    params: Promise<{ slug: string; referId: string }>;
}) {
    const params = await props.params;
    const { slug, referId } = params;
    const { getToken } = await auth();
    const token = (await getToken()) || "";

    const festival = await getFestivalData(token, slug);
    const referrerName = await getReferrerName(referId);

    return (
        <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
            <div className="w-full max-w-[1600px] p-6 lg:p-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl md:text-4xl text-foreground">
                        {festival.name} - referrals
                    </h1>
                    <p className="text-muted-foreground text-xl font-medium">
                        {referrerName}
                    </p>
                </div>

                {/* Referred Users Table */}
                <div className="w-full flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-neutral-800">Referred Users</h2>
                    <ReferredUsersTable />
                </div>
            </div>
        </div>
    );
}
