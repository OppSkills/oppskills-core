import MeetPageClient from "./MeetPageClient";

export default async function MeetPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <MeetPageClient inviteCode={inviteCode} />;
}
