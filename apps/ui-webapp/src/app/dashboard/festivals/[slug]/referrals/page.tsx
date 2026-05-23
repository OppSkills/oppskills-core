import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getFestivalBySlug } from "@/lib/api/festivalApi";
import { AddReferrerButton } from "@/app/dashboard/_components/referrals/AddReferrerButton";
import { ReferralsTable } from "@/app/dashboard/_components/referrals/ReferralsTable";
import { ReferralAnalyticsCards } from "@/app/dashboard/_components/referrals/ReferralAnalyticsCards";
import { ReferralsAnalyticsLoader } from "@/app/dashboard/_components/referrals/ReferralsAnalyticsLoader";

async function getFestivalData(token: string, slug: string) {
  try {
    const festival = (await getFestivalBySlug(token, slug)) as {
      name: string;
      id: string;
    };
    return festival;
  } catch (e) {
    return { name: "Festival", id: "" };
  }
}

export default async function ReferralsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { slug } = params;
  const { getToken } = await auth();
  const token = (await getToken()) || "";

  const festival = await getFestivalData(token, slug);

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
      <div className="w-full p-4 lg:p-6 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left space-y-2">
            <h1 className="font-bold text-3xl md:text-4xl text-foreground">
              {festival.name}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              View all the Referral details about Festival
            </p>
          </div>
          <div className="right self-end md:self-auto w-full sm:w-auto">
            <AddReferrerButton entityType="FESTIVAL" entityId={festival.id} />
          </div>
        </div>

        {/* Analytics Cards */}
        <Suspense fallback={<ReferralsAnalyticsLoader />}>
          <ReferralAnalyticsCards
            entityType="FESTIVAL"
            entityId={festival.id}
            slug={slug}
            itemName={festival.name}
          />
        </Suspense>

        {/* Referrals Table */}
        <div className="w-full">
          <ReferralsTable
            baseUrl={`/dashboard/festivals/${slug}/referrals`}
            entityType="FESTIVAL"
            entityId={festival.id}
          />
        </div>
      </div>
    </div>
  );
}
