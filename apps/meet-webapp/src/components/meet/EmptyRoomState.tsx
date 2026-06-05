"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check, Link2, Users } from "lucide-react";
import { toast } from "sonner";

interface EmptyRoomStateProps {
  inviteCode: string;
}

export default function EmptyRoomState({ inviteCode }: EmptyRoomStateProps) {
  const [copied, setCopied] = useState(false);
  const meetLink = useMemo(() => {
    if (typeof window === "undefined") return `/${inviteCode}`;
    return `${window.location.origin}/${inviteCode}`;
  }, [inviteCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetLink);
      setCopied(true);
      toast.success("Meeting link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0 min-w-0 w-full overflow-y-auto">
      <div className="max-w-md w-full min-w-0 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#835BD5]/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-[#835BD5]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">You&apos;re the only one here</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            No one else has joined yet. Share the meeting link so others can
            join you.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#14121c] p-4 space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wide">
            <Link2 className="w-3.5 h-3.5" />
            Meeting link
          </div>
          <p className="text-sm text-white/80 break-all font-mono">
            {meetLink}
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="w-full py-3 rounded-xl bg-[#835BD5] hover:bg-[#6f4bc0] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy meeting link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
