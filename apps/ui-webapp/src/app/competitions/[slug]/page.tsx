import type { Metadata, ResolvingMetadata } from "next";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import {
  CompetitionDetailsClient,
  type HackathonApiData,
} from "./CompetitionDetailsClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  let data: HackathonApiData | null = null;

  try {
    data = (await getPublicHackathonBySlug(slug)) as HackathonApiData;
  } catch (error) {
    console.error("Error fetching hackathon metadata:", error);
  }

  if (!data) {
    return {
      title: "Competition Not Found | OppSkills",
    };
  }

  const title = `${data.name} | OppSkills`;
  // Simple heuristic: if description is long, truncate it.
  // We assume description is plain text or roughly readable.
  const description = data.description
    ? data.description.substring(0, 160) +
    (data.description.length > 160 ? "..." : "")
    : `Join ${data.name} on OppSkills.`;

  let imageUrl = data.bannerImageUrl;
  if (imageUrl) {
    // Use the proxy URL as requested
    imageUrl = `https://api.oppskills.com/image/serve?url=${encodeURIComponent(imageUrl)}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: data.name }] : [],
      type: "website",
      siteName: "OppSkills",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function Page() {
  return <CompetitionDetailsClient />;
}
