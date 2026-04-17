"use client";

import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { useReferralAnalytics } from "@/hooks/useReferrals";
import type { ReferralEntityType } from "@/lib/api/referralApi";

export function ReferralAnalyticsCards({
  entityType,
  entityId,
}: {
  entityType: ReferralEntityType;
  entityId: string;
}) {
  const { data } = useReferralAnalytics(entityType, entityId);
  const metrics = data ?? {
    referredParticipants: 0,
    totalRegistrations: 0,
    totalClicks: 0,
    totalReferrers: 0,
    activeReferrers: 0,
    linksGenerated: 0,
  };

  const referralData = [
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
