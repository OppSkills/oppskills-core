import type { Metadata } from "next";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getHackathon(slug: string) {
  try {
    return await getHackathonBySlug("", slug); // Pass empty string as token for public
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = (await getHackathon(slug)) as any;

  if (!hackathon) {
    return {
      title: "Hackathon Not Found | OppSkills",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${hackathon.name} | College Hackathon`;
  const description =
    hackathon.tagline ||
    `Join ${hackathon.name} - the ultimate college hackathon. Register now to compete, learn, and win prizes!`;

  // Use bannerImageUrl if available, otherwise bannerUrl.
  // Then wrap it in the proxy URL.
  const rawImageUrl = hackathon.bannerImageUrl || hackathon.bannerUrl;
  const ogImageUrl = rawImageUrl
    ? `https://api.oppskills.com/image/serve?url=${encodeURIComponent(
        rawImageUrl
      )}`
    : "https://oppskills.com/og_poster.png";

  const url = `https://oppskills.com/hackathons/${slug}`;

  return {
    title,
    description,
    applicationName: "OppSkills",
    authors: [{ name: "OppSkills Team", url: "https://oppskills.com" }],
    generator: "Next.js",
    keywords: [
      "Hackathon",
      "Coding Competition",
      "OppSkills",
      "Student Developer",
      "Tech Event",
      hackathon.name,
    ],
    referrer: "origin-when-cross-origin",
    creator: "OppSkills",
    publisher: "OppSkills",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "OppSkills",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: hackathon.name,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@oppskills",
      images: [ogImageUrl],
    },
  };
}

export default async function HackathonPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = (await getHackathon(slug)) as any;

  if (!hackathon) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold">Hackathon Not Found</h1>
      </div>
    );
  }

  const hackathonSchema = {
    "@context": "https://schema.org",
    "@type": "Hackathon",
    name: hackathon.name,
    description: hackathon.tagline || hackathon.description,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    location: {
      "@type": "Place",
      name: "Online", // default for hackathon if no location logic
    },
    image: [
      hackathon.bannerImageUrl ||
        hackathon.bannerUrl ||
        "https://oppskills.com/og_poster.png",
    ],
    organizer: {
      "@type": "Organization",
      name: "OppSkills",
      url: "https://oppskills.com",
    },
  };

  return (
    <>
      <JsonLd data={hackathonSchema} />
      <div className="container mx-auto px-4 py-12">
        {/* Basic SEO-friendly content structure */}
        <h1 className="text-4xl font-bold mb-4">{hackathon.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {hackathon.startDate
            ? new Date(hackathon.startDate).toLocaleDateString()
            : "Date TBA"}
        </p>

        <section className="prose  max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: hackathon.description || "" }}
          />
        </section>

        <div className="mt-8">
          {/* Call to action or Client Component button could go here */}
          <button className="px-6 py-2 bg-primary-500 text-primary-foreground rounded-lg font-medium">
            Register Now
          </button>
        </div>
      </div>
    </>
  );
}
