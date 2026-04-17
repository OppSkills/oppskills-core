import { Loader2 } from "lucide-react";

/** Shared Suspense fallback for referral analytics on events / festivals / hackathon dashboard pages. */
export function ReferralsAnalyticsLoader() {
  return (
    <div className="flex h-40 w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
