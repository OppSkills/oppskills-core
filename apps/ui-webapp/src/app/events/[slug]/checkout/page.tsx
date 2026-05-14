import EventCheckoutClient from "./EventCheckoutClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventCheckoutPage({ params }: Props) {
  const { slug } = await params;
  return <EventCheckoutClient slug={slug} />;
}
