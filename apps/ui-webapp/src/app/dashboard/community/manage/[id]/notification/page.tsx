import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCommunity, getMyMemberRecord } from "@/lib/api/communityApi";
import { SendNotification } from "@/components/common/SendNotification";

type CommunityAccessControlRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "READ_ONLY"
  | "MEMBER";

async function getCommunityData(token: string, id: string) {
  try {
    const community = await getCommunity(token, id);
    return community;
  } catch {
    return null;
  }
}

async function getMemberRole(
  token: string,
  communityId: string,
): Promise<CommunityAccessControlRole | null> {
  try {
    const member = await getMyMemberRecord(token, communityId);
    return (member.accessControlRole as CommunityAccessControlRole) ?? null;
  } catch {
    return null;
  }
}

export default async function CommunityNotificationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params?.id;

  const { getToken, userId } = await auth();
  const token = (await getToken()) ?? "";

  if (!userId || !token) {
    redirect("/sign-in");
  }

  const community = await getCommunityData(token, id);

  // If community not found, redirect
  if (!community) {
    redirect("/dashboard/community");
  }

  // Determine user's access level
  const isOwner = community.ownerId === userId;

  let role: CommunityAccessControlRole | null = null;
  if (!isOwner) {
    role = await getMemberRole(token, id);
  }

  // MEMBER or non-member: no access to notification management
  if (!isOwner && (!role || role === "MEMBER")) {
    redirect("/dashboard/community");
  }

  // READ_ONLY members can view but cannot mutate
  const isReadOnly = !isOwner && role === "READ_ONLY";

  return (
    <SendNotification
      type="community"
      id={id}
      isReadOnly={isReadOnly}
    />
  );
}
