import type { Metadata, ResolvingMetadata } from "next";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import { API_URL, SITE_URL } from "@/lib/constants";
import {
  CompetitionDetailsClient,
  type HackathonApiData,
  transformApiData,
} from "./CompetitionDetailsClient";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getCompetition(slug: string): Promise<HackathonApiData | null> {
  try {
    return (await getPublicHackathonBySlug(slug)) as HackathonApiData;
  } catch (error) {
    console.error("Error fetching hackathon SSR data:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCompetition(slug);

  if (!data) {
    return {
      title: "Competition Not Found | OppSkills",
    };
  }

  const title = `${data.name} | OppSkills`;
  const description = data.description
    ? data.description.substring(0, 160) +
      (data.description.length > 160 ? "..." : "")
    : `Join ${data.name} on OppSkills.`;

  let imageUrl = data.bannerImageUrl;
  if (imageUrl) {
    imageUrl = `${API_URL}/image/serve?url=${encodeURIComponent(imageUrl)}`;
  } else {
    imageUrl = `${SITE_URL}/og_poster.png`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hackathons/${data.slug}`,
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
    alternates: {
      canonical: `${SITE_URL}/hackathons/${data.slug}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const data = await getCompetition(slug);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Competition Not Found
        </h2>
        <p className="text-muted-foreground">
          This competition may not exist or is not publicly available.
        </p>
      </div>
    );
  }

  return <CompetitionDetailsClient initialData={transformApiData(data)} />;
}
