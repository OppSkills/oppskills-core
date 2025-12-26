import type { Metadata } from "next";
import EventDetailsClient from "./_components/EventDetailsClient";
import { getPublicEventBySlug } from "@/lib/api/eventApi";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getEvent(slug: string): Promise<any> {
  try {
    return await getPublicEventBySlug(slug);
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Wait for the slug params
  const { slug } = await params;
  const event = (await getEvent(slug)) as any;

  if (!event) {
    return {
      title: "Event Not Found | OppSkills",
      description: "The requested event could not be found.",
    };
  }

  const title = `${event.name}`;
  // Strip HTML from description for meta description
  const description = event.description
    ? event.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Join ${event.name} at OppSkills.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://oppskills.com/events/${event.slug}`,
      siteName: "OppSkills",
      images: event.bannerImageUrl
        ? [
            {
              url: `https://api.oppskills.com/image/serve?url=${event.bannerImageUrl}`,
              width: 1200,
              height: 630,
              alt: event.name,
            },
          ]
        : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: event.bannerImageUrl
        ? [`https://api.oppskills.com/image/serve?url=${event.bannerImageUrl}`]
        : undefined,
    },
    alternates: {
      canonical: `https://oppskills.com/events/${event.slug}`,
    },
  };
}

export default async function EventPage({ params }: Props) {
  // Wait for the slug params
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
        <p className="text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
    );
  }

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description?.replace(/<[^>]*>/g, ""),
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.locationType === "ONLINE" || event.locationType === "VIRTUAL"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.locationType === "ONLINE" || event.locationType === "VIRTUAL"
        ? {
            "@type": "VirtualLocation",
            url: event.locationVirtualLink || "https://oppskills.com",
          }
        : {
            "@type": "Place",
            name: event.locationAddress || "TBA",
            address: {
              "@type": "PostalAddress",
              addressLocality: event.locationCity,
              addressCountry: "IN",
            },
          },
    image: event.bannerImageUrl
      ? [`https://api.oppskills.com/image/serve?url=${event.bannerImageUrl}`]
      : undefined,
    organizer: {
      "@type": "Person",
      name: `${event.owner.firstName} ${event.owner.lastName}`,
    },
    offers: {
      "@type": "Offer",
      url: `https://oppskills.com/events/${event.slug}`,
      price: event.isFree ? "0" : event.entryFeeAmount,
      priceCurrency: event.currency || "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLd data={eventSchema} />
      <EventDetailsClient event={event} />
    </>
  );
}
