"use client";

import { useReferralById } from "@/hooks/useReferrals";

export function ReferrerName({ referId }: { referId: string }) {
  const { data } = useReferralById(referId);
  const firstName = data?.referrer?.firstName ?? "";
  const lastName = data?.referrer?.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim() || "Referrer";
  return <>{name}</>;
}
