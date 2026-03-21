import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HackathonJoinInviteContent } from "./HackathonJoinInviteContent";

export default function HackathonJoinInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <HackathonJoinInviteContent />
    </Suspense>
  );
}
