import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Legacy /tickets URL: ticket and payout management lives on …/payments.
 */
export default async function EventTicketsRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/dashboard/events/${slug}/payments`);
}
