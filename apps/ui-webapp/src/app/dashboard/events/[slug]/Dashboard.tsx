import { redirect } from "next/navigation";

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/dashboard/events/${slug}/edit-event`);
}
