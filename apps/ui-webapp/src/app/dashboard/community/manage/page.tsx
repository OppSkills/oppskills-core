"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy `/dashboard/community/manage` — list and open a specific community from
 * `/dashboard/community` or `/dashboard/community/manage/[id]`.
 */
export default function ManageCommunityIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/community");
  }, [router]);

  return null;
}
