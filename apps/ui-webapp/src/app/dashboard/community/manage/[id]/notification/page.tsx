"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { SendNotification } from "@/components/common/SendNotification";
import { getCommunity, getMyMemberRecord } from "@/lib/api/communityApi";

export default function CommunityNotificationPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const communityId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { getToken, isLoaded, userId: loggedInUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (!communityId) return;

    let cancelled = false;
    async function checkAccess() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (!token) {
          router.push("/dashboard/community");
          return;
        }

        const [community, myMemberRecord] = await Promise.all([
          getCommunity(token, communityId as string),
          getMyMemberRecord(token, communityId as string).catch(() => null),
        ]);

        if (cancelled) return;

        const isOwner = loggedInUserId === community.ownerId;
        const role = myMemberRecord?.accessControlRole;

        const isAuthorized = isOwner || (role && ["ADMIN", "MODERATOR", "READ_ONLY"].includes(role));

        if (!isAuthorized) {
          toast.error("You do not have permission to view this page.");
          router.push("/dashboard/community");
          return;
        }

        const isUserReadOnly = !isOwner && role === "READ_ONLY";
        setIsReadOnly(isUserReadOnly);
        setLoading(false);
      } catch (err) {
        console.error("Access check failed:", err);
        toast.error("Failed to verify access permissions.");
        router.push("/dashboard/community");
      }
    }

    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, [communityId, isLoaded, getToken, loggedInUserId, router]);

  if (loading || !communityId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100">
        <div className="text-neutral-500 font-medium">Verifying access...</div>
      </div>
    );
  }

  return (
    <SendNotification
      type="community"
      id={communityId}
      isReadOnly={isReadOnly}
    />
  );
}
