import { Suspense } from "react";
import { AddReferrerButton } from "@/app/dashboard/_components/referrals/AddReferrerButton";
import { ReferralsTable } from "@/app/dashboard/_components/referrals/ReferralsTable";
import { ReferralAnalyticsCards } from "@/app/dashboard/_components/referrals/ReferralAnalyticsCards";
import { ReferralsAnalyticsLoader } from "@/app/dashboard/_components/referrals/ReferralsAnalyticsLoader";

export default async function CommunityReferralsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params?.id;
  const communityName = "OppSkills Community";

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
      <div className="w-full p-4 lg:p-6 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left space-y-2">
            <h1 className="font-bold text-3xl md:text-4xl text-foreground font-poppins">
              {communityName}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              View all the Referral details about Community
            </p>
          </div>
          <div className="right self-end md:self-auto w-full sm:w-auto">
            <AddReferrerButton entityType="COMMUNITY" entityId={id} />
          </div>
        </div>

        {/* Analytics Cards */}
        <Suspense fallback={<ReferralsAnalyticsLoader />}>
          <ReferralAnalyticsCards
            entityType="COMMUNITY"
            entityId={id}
            slug={id}
            itemName={communityName}
          />
        </Suspense>

        {/* Referrals Table */}
        <div className="w-full">
          <ReferralsTable
            baseUrl={`/dashboard/community/manage/${id}/referral`}
            entityType="COMMUNITY"
            entityId={id}
          />
        </div>
      </div>
    </div>
  );
}
