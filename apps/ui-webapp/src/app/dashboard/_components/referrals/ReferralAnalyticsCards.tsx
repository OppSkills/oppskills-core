"use client";

import React, { memo, useMemo } from "react";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { useReferralAnalytics } from "@/hooks/useReferrals";
import type { ReferralEntityType } from "@/lib/api/referralApi";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { StatsGridFallback } from "@/components/boneyard/loading-fallbacks";
import PublicLinkQrCard from "@/app/dashboard/_components/PublicLinkQrCard";
import { useUser } from "@clerk/nextjs";
import { useReferrals } from "@/hooks/useReferrals";

export const ReferralAnalyticsCards = memo(function ReferralAnalyticsCards({
  entityType,
  entityId,
  slug,
  itemName,
  referralCode,
}: {
  entityType: ReferralEntityType;
  entityId: string;
  slug?: string;
  itemName?: string;
  referralCode?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    console.count("[render] ReferralAnalyticsCards");
  }

  const { data, isLoading } = useReferralAnalytics(entityType, entityId);
  const { user } = useUser();
  const { data: referralsData } = useReferrals(entityType, entityId);

  const activeReferralCode = useMemo(() => {
    if (referralCode) return referralCode;
    if (!user || !referralsData?.data) return undefined;

    const userEmail = user.primaryEmailAddress?.emailAddress.toLowerCase();
    const myReferral = referralsData.data.find(
      (r) => r.referrer.email.toLowerCase() === userEmail
    );
    return myReferral?.code;
  }, [referralCode, user, referralsData]);

  const metrics = useMemo(
    () =>
      data ?? {
        referredParticipants: 0,
        totalRegistrations: 0,
        totalClicks: 0,
        totalReferrers: 0,
        activeReferrers: 0,
        linksGenerated: 0,
      },
    [data],
  );

  const referralData = useMemo(
    () => [
      {
        type: "highlight" as const,
        title: "Referred Participants",
        value: String(metrics.referredParticipants),
        badge: "Total registration",
        badgeValue: String(metrics.totalRegistrations),
      },
      {
        type: "normal" as const,
        title: "Referral Clicks",
        value: String(metrics.totalClicks),
        badge: "Total Clicks",
        badgeValue: String(metrics.totalClicks),
      },
      {
        type: "normal" as const,
        title: "Referral Users",
        value: String(metrics.totalReferrers),
        badge: "Total Referral Users",
        badgeValue: String(metrics.activeReferrers),
      },
      {
        type: "normal" as const,
        title: "Referral Link Generated",
        value: String(metrics.linksGenerated),
        badge: "Active Links",
        badgeValue: String(metrics.activeReferrers),
      },
    ],
    [metrics],
  );

  return (
    <BoneyardSkeleton
      loading={isLoading || !data}
      name="referral-analytics-cards"
      fallback={<StatsGridFallback />}
      className="w-full"
    >
      <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
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

        <MotionItem className="md:col-span-2 md:justify-self-center xl:col-span-1 xl:justify-self-stretch">
          <PublicLinkQrCard
            title="Referral Link QR"
            url={`https://www.oppskills.com/${entityType.toLowerCase()}s/${slug}`}
            downloadFileName={`${entityType.toLowerCase()}-${slug}-referral-qr`}
            itemName={itemName}
            type={entityType.toLowerCase() as any}
            referralCode={activeReferralCode}
          />
        </MotionItem>
      </MotionContainer>
    </BoneyardSkeleton>
  );
});
