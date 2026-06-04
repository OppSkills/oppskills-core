import type { Metadata } from "next";
import { meetPageMetadata } from "@/lib/metadata";
import MeetPageClient from "./MeetPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}): Promise<Metadata> {
  const { inviteCode } = await params;

  return meetPageMetadata({
    title: "Join meeting",
    description:
      "You were invited to a live video meeting on OppSkills Meet. Sign in to join your community call.",
    path: `/${inviteCode}`,
  });
}

export default async function MeetPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <MeetPageClient inviteCode={inviteCode} />;
}
