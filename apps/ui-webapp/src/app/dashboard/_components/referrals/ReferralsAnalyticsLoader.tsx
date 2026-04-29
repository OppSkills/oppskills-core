import { StatsGridFallback } from "@/components/boneyard/loading-fallbacks";

/** Shared Suspense fallback for referral analytics on events / festivals / hackathon dashboard pages. */
export function ReferralsAnalyticsLoader() {
  return (
    <div className="w-full">
      <StatsGridFallback />
    </div>
  );
}
