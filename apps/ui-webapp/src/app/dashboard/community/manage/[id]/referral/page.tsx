import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCommunity, getMyMemberRecord } from "@/lib/api/communityApi";
import { AddReferrerButton } from "@/app/dashboard/_components/referrals/AddReferrerButton";
import { ReferralsTable } from "@/app/dashboard/_components/referrals/ReferralsTable";
import { ReferralAnalyticsCards } from "@/app/dashboard/_components/referrals/ReferralAnalyticsCards";
import { ReferralsAnalyticsLoader } from "@/app/dashboard/_components/referrals/ReferralsAnalyticsLoader";

type CommunityAccessControlRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "READ_ONLY"
  | "MEMBER";

async function getCommunityData(token: string, id: string) {
  try {
    const community = await getCommunity(token, id);
    return community;
  } catch {
    return null;
  }
}

async function getMemberRole(
  token: string,
  communityId: string,
): Promise<CommunityAccessControlRole | null> {
  try {
    const member = await getMyMemberRecord(token, communityId);
    return (member.accessControlRole as CommunityAccessControlRole) ?? null;
  } catch {
    return null;
  }
}

export default async function CommunityReferralsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params?.id;

  const { getToken, userId } = await auth();
  const token = (await getToken()) ?? "";

  if (!userId || !token) {
    redirect("/sign-in");
  }

  const community = await getCommunityData(token, id);

  // If community not found, redirect
  if (!community) {
    redirect("/dashboard/community");
  }

  // Determine user's access level:
  // ownerId gets full access
  const isOwner = community.ownerId === userId;

  let role: CommunityAccessControlRole | null = null;
  if (!isOwner) {
    role = await getMemberRole(token, id);
  }

  // MEMBER or non-member: no access to referral management
  if (!isOwner && (!role || role === "MEMBER")) {
    redirect("/dashboard/community");
  }

  // READ_ONLY members can view but cannot mutate
  const isReadOnly = !isOwner && role === "READ_ONLY";

  const communityName = community.name;

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
            <AddReferrerButton
              entityType="COMMUNITY"
              entityId={id}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Analytics Cards */}
        <Suspense fallback={<ReferralsAnalyticsLoader />}>
          <ReferralAnalyticsCards
            entityType="COMMUNITY"
            entityId={id}
            slug={community.handle}
            itemName={communityName}
          />
        </Suspense>

        {/* Referrals Table */}
        <div className="w-full">
          <ReferralsTable
            baseUrl={`/dashboard/community/manage/${id}/referral`}
            entityType="COMMUNITY"
            entityId={id}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
