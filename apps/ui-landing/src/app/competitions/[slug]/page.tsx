import { Metadata, ResolvingMetadata } from "next";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import CompetitionDetailsClient from "./_components/CompetitionDetailsClient";
import {
  HackathonApiData,
  transformApiData,
} from "./_components/competition-utils";
import { notFound } from "next/navigation";

// Force dynamic rendering since we rely on API calls
// and we want up-to-date data.
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const data = (await getPublicHackathonBySlug(
      params.slug
    )) as HackathonApiData;
    if (!data) {
      return {
        title: "Competition Not Found - OppSkills",
      };
    }

    const competition = transformApiData(data);
    const previousImages = (await parent).openGraph?.images || [];

    // Proxy URL for the banner image
    const ogImage = competition.thumbnail
      ? `https://api.oppskills.com/image/serve?url=${encodeURIComponent(
          competition.thumbnail
        )}`
      : previousImages[0];

    // Fallback if no specific image is provided
    const ogImages = competition.thumbnail
      ? [ogImage, ...previousImages]
      : previousImages;

    return {
      title: `${competition.title} | Hackathon on OppSkills`,
      description:
        competition.about?.slice(0, 160) ||
        `Join ${competition.title} on OppSkills. Identify your skills, compete with others, and win prizes.`,
      openGraph: {
        title: `${competition.title} | Hackathon`,
        description: competition.about?.slice(0, 200),
        url: `https://oppskills.com/competitions/${competition.slug}`,
        siteName: "OppSkills",
        images: ogImages,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: competition.title,
        description: competition.about?.slice(0, 200),
        images: ogImages,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Competition Details - OppSkills",
    };
  }
}

export default async function Page({ params }: Props) {
  let initialData: HackathonApiData | null = null;

  try {
    initialData = (await getPublicHackathonBySlug(
      params.slug
    )) as HackathonApiData;
  } catch (error) {
    console.error("Failed to fetch competition data on server:", error);
  }

  if (!initialData) {
    // If public data is missing on the server, we might want to handle it gracefully.
    // However, since the client component doesn't fetch anymore, we should probably 404
    // or show an error state if we strictly need data.
    // But adhering to the previous behavior logic (trying to rely on client for Drafts?),
    // the user removed fetching from client. So we must treat this as Not Found or Error.

    // For now, let's render the client with null/mock if possible, or just 404.
    // But `CompetitionDetailsClient` expects `competition` (non-nullable in interface usually, but let's check).
    // The user defined `competition: CompetitionDetails`. It is NOT optional.
    // So we effectively found nothing.
    // But wait, organizers might need to see "Draft". "Draft" items return 404 on public API?
    // Public API usually filters out drafts.

    // If we want to support Drafts, we might need a way for the Client to handle "no public data but maybe draft".
    // But the user removed that logic!
    // I will return 404 for now to be safe, or render a "Not Found" state using the client if it handles it (it doesn't seem to).
    // Actually, looking at the user's Client code again (Step 63), it blindly renders `competition.title` etc.
    // It will crash if competition is null.

    // So if no data, we should render a fallback UI here or notFound().
    // Given the previous user context ("Draft Preview"), hiding it behind 404 is technically correct for public.
    // But for the owner, it's annoying.
    // I'll stick to standard behavior: if public API fails/returns empty, it's a 404.
    // If the user wants Draft support they need to re-add the client-side fetching fallback.
    return notFound();
  }

  const transformedData = transformApiData(initialData);

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: transformedData.title,
    description: transformedData.about,
    startDate: initialData.startDate,
    endDate: initialData.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      transformedData.location === "Online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      transformedData.location === "Online"
        ? {
            "@type": "VirtualLocation",
            url: initialData.locationVirtualLink || "https://oppskills.com",
          }
        : {
            "@type": "Place",
            name: transformedData.venueName || "TBD",
            address: {
              "@type": "PostalAddress",
              streetAddress: transformedData.venueAddress,
              addressLocality: initialData.locationCity,
            },
          },
    image: [transformedData.thumbnail],
    organizer: {
      "@type": "Organization",
      name: transformedData.organizers[0]?.name || "OppSkills",
      url: "https://oppskills.com",
    },
    offers: {
      "@type": "Offer",
      url: `https://oppskills.com/competitions/${transformedData.slug}`,
      price: transformedData.isFree
        ? "0"
        : transformedData.entryFeeAmount?.toString(),
      priceCurrency: transformedData.currency,
      availability: "https://schema.org/InStock",
      validFrom: transformedData.createdAt,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompetitionDetailsClient competition={transformedData} />
    </>
  );
}
