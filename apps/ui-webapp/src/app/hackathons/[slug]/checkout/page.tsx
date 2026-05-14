import HackathonCheckoutClient from "./HackathonCheckoutClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HackathonCheckoutPage({ params }: Props) {
  const { slug } = await params;
  return <HackathonCheckoutClient slug={slug} />;
}
