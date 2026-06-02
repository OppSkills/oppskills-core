"use client";

import { useParams } from "next/navigation";
import ManageCommunityClient from "../_components/ManageCommunityClient";

export default function ManageCommunityByIdPage() {
  const params = useParams();
  const rawId = params?.id;
  const communityId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (typeof communityId !== "string" || communityId.trim().length === 0) {
    return null;
  }

  return <ManageCommunityClient communityId={communityId} />;
}
