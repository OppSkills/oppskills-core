import { auth } from "@clerk/nextjs/server";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
import { ReferredUsersTable } from "@/app/dashboard/_components/referrals/ReferredUsersTable";
import { ReferrerName } from "@/app/dashboard/_components/referrals/ReferrerName";

async function getHackathonData(token: string, slug: string) {
    try {
        const hackathon = (await getHackathonBySlug(token, slug)) as { name: string };
        return hackathon;
    } catch (e) {
        return { name: "Hackathon" };
    }
}

export default async function ReferrerDetailsPage(props: {
    params: Promise<{ slug: string; referId: string }>;
}) {
    const params = await props.params;
    const { slug, referId } = params;
    const { getToken } = await auth();
    const token = (await getToken()) || "";

    const hackathon = await getHackathonData(token, slug);
    return (
        <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
            <div className="w-full max-w-[1600px] p-6 lg:p-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl md:text-4xl text-foreground">
                        {hackathon.name} - referrals
                    </h1>
                    <p className="text-muted-foreground text-xl font-medium">
                        <ReferrerName referId={referId} />
                    </p>
                </div>

                {/* Referred Users Table */}
                <div className="w-full flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-neutral-800">Referred Users</h2>
                    <ReferredUsersTable referralId={referId} />
                </div>
            </div>
        </div>
    );
}
